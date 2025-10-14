import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { arrayUnion, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, IS_FIREBASE_CONFIGURED } from "../config/firebase";
import {
  getListOfPlayersFromRoomId,
  getRoomIdFromPlayerId,
} from "../utils/player-utils";
import { normalizeGameType } from "../constants/gameTypes";
import {
  decodeResponsesMap,
  encodeImageKey,
  filterCaptionsByImages,
  sanitizeImageSet,
  tallyVotesByCaption,
} from "../utils/funnies-utils";

function groupResponsesByImage({ images, responses, playersMap }) {
  if (!Array.isArray(images) || !responses) {
    return [];
  }

  return images.map((imageId) => {
    const groupedResponses = Object.entries(responses || {})
      .map(([playerId, playerResponses]) => {
        if (!playerResponses || typeof playerResponses !== "object") {
          return null;
        }
        const caption = playerResponses[imageId];
        if (!caption || typeof caption !== "string") {
          return null;
        }
        return {
          playerId,
          playerName: playersMap[playerId] || "Anonymous Player",
          caption,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.playerName.localeCompare(b.playerName));

    return {
      imageId,
      responses: groupedResponses,
    };
  });
}

export default function FunniesShowcasePage() {
  const navigate = useNavigate();
  const playerIdRef = useRef(null);
  const hasNavigatedToWinnersRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [playersMap, setPlayersMap] = useState({});
  const [images, setImages] = useState([]);
  const [responses, setResponses] = useState({});
  const [votes, setVotes] = useState({});
  const [roomPlayerIds, setRoomPlayerIds] = useState([]);
  const [winnersReadyPlayers, setWinnersReadyPlayers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleResponseCount, setVisibleResponseCount] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isAcknowledgingWinners, setIsAcknowledgingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState("");

  const showcaseGroups = useMemo(
    () => groupResponsesByImage({ images, responses, playersMap }),
    [images, responses, playersMap],
  );

  const currentGroup = showcaseGroups[currentIndex];
  const currentResponses = currentGroup?.responses || [];
  const voteTalliesByCaption = useMemo(
    () => tallyVotesByCaption(votes),
    [votes],
  );
  const currentImageTallies = currentGroup
    ? voteTalliesByCaption[currentGroup.imageId] || {}
    : {};

  const currentUserVote = useMemo(() => {
    if (!playerIdRef.current || !currentGroup) {
      return null;
    }
    const encodedKey = encodeImageKey(currentGroup.imageId);
    return votes?.[`${encodedKey}_${playerIdRef.current}`] || null;
  }, [currentGroup, votes]);

  const revealedResponses = useMemo(
    () => currentResponses.slice(0, visibleResponseCount),
    [currentResponses, visibleResponseCount],
  );

  const canRevealMore = visibleResponseCount < currentResponses.length;
  const nextResponseToReveal = canRevealMore
    ? currentResponses[visibleResponseCount]
    : null;
  const isFinalImage =
    showcaseGroups.length > 0 && currentIndex === showcaseGroups.length - 1;
  const areResponsesFullyRevealed =
    currentResponses.length === 0 || !canRevealMore;
  const shouldShowWinnersButton = isFinalImage && areResponsesFullyRevealed;
  const totalPlayers =
    roomPlayerIds.length > 0
      ? roomPlayerIds.length
      : Object.keys(playersMap).length;
  const acknowledgedCount = winnersReadyPlayers.length;
  const hasPlayerAcknowledged = playerIdRef.current
    ? winnersReadyPlayers.includes(playerIdRef.current)
    : false;
  const remainingAcknowledgements = Math.max(
    totalPlayers - acknowledgedCount,
    0,
  );
  const isWaitingForOthers = hasPlayerAcknowledged && remainingAcknowledgements > 0;
  const winnersButtonDisabled = isAcknowledgingWinners || hasPlayerAcknowledged;

  const handleNavigateHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleRevealNext = useCallback(() => {
    setVisibleResponseCount((count) =>
      Math.min(count + 1, currentResponses.length),
    );
  }, [currentResponses.length]);

  useEffect(() => {
    const initialize = async () => {
      const storedPlayerId = localStorage.getItem("playerId");
      if (!storedPlayerId) {
        handleNavigateHome();
        return;
      }
      playerIdRef.current = storedPlayerId;

      try {
        const derivedRoomId = await getRoomIdFromPlayerId(storedPlayerId);
        if (!derivedRoomId) {
          handleNavigateHome();
          return;
        }

        setRoomId(derivedRoomId);
        const players = await getListOfPlayersFromRoomId(derivedRoomId);
        const map = players.reduce((accumulator, player) => {
          accumulator[player.id] = player.playerName || "Player";
          return accumulator;
        }, {});
        setPlayersMap(map);
      } catch (initializeError) {
        console.error("Unable to load funnies showcase", initializeError);
        setError("We could not load this showcase. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [handleNavigateHome]);

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }

    if (!IS_FIREBASE_CONFIGURED) {
      console.error('Skipping realtime listener: Firebase not configured');
      setError('This environment is not configured to connect to Firebase.');
      return undefined;
    }

    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
      if (!snapshot.exists()) {
        setError("This room is no longer available.");
        return;
      }

      const data = snapshot.data() || {};
      const roomPlayers = Array.isArray(data.players)
        ? data.players.filter((value) => typeof value === "string")
        : [];
      setRoomPlayerIds(roomPlayers);

      const gameType = normalizeGameType(data.gameType);
      if (gameType !== "funnies") {
        handleNavigateHome();
        return;
      }

      const funniesData = data.funnies || {};
      const winnersReadyList = Array.isArray(funniesData.winnersReadyPlayers)
        ? Array.from(
            new Set(
              funniesData.winnersReadyPlayers.filter(
                (value) => typeof value === "string" && value.length > 0,
              ),
            ),
          )
        : [];
      setWinnersReadyPlayers(winnersReadyList);
      const imageListRaw = Array.isArray(funniesData.images)
        ? funniesData.images
        : [];

      const normalizedImages = sanitizeImageSet(imageListRaw);

      const responsesMap =
        funniesData.responses && typeof funniesData.responses === "object"
          ? funniesData.responses
          : {};

      const decodedResponses = decodeResponsesMap(responsesMap);
      const filteredResponses = Object.entries(decodedResponses).reduce(
        (accumulator, [playerId, playerResponses]) => {
          accumulator[playerId] = filterCaptionsByImages(
            playerResponses,
            normalizedImages,
          );
          return accumulator;
        },
        {},
      );

      setImages(normalizedImages);
      setResponses(filteredResponses);

      const votesMap =
        funniesData.votes && typeof funniesData.votes === "object"
          ? funniesData.votes
          : {};
      setVotes(votesMap);

      if (!normalizedImages.length) {
        setError("We could not find any images for this showcase.");
      }
      }, (snapshotError) => {
        console.error('Realtime snapshot error for room', roomId, snapshotError);
        setError('Network error while loading the room. Please check your connection.');
      });

    return () => unsubscribe();
  }, [handleNavigateHome, roomId]);

  useEffect(() => {
    setVisibleResponseCount(1);
  }, [currentIndex, currentResponses.length]);

  useEffect(() => {
    const totalPlayersCount =
      roomPlayerIds.length > 0
        ? roomPlayerIds.length
        : Object.keys(playersMap).length;

    if (
      totalPlayersCount > 0 &&
      winnersReadyPlayers.length >= totalPlayersCount &&
      !hasNavigatedToWinnersRef.current
    ) {
      hasNavigatedToWinnersRef.current = true;
      navigate("/funnies-winners");
    }
  }, [navigate, playersMap, roomPlayerIds, winnersReadyPlayers]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) =>
      Math.min(index + 1, Math.max(showcaseGroups.length - 1, 0)),
    );
  }, [showcaseGroups.length]);

  const handleAcknowledgeWinners = useCallback(async () => {
    const playerId = playerIdRef.current;
    if (
      !shouldShowWinnersButton ||
      !roomId ||
      !playerId ||
      isAcknowledgingWinners ||
      winnersReadyPlayers.includes(playerId)
    ) {
      return;
    }

    if (!IS_FIREBASE_CONFIGURED) {
      setWinnersError(
        "This environment isn't connected to the backend, so we can't show winners.",
      );
      return;
    }

    setIsAcknowledgingWinners(true);
    setWinnersError("");
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        "funnies.winnersReadyPlayers": arrayUnion(playerId),
        "funnies.updatedAt": Date.now(),
      });
      setWinnersReadyPlayers((previous) =>
        previous.includes(playerId) ? previous : [...previous, playerId],
      );
    } catch (ackError) {
      console.error("Failed to record winners acknowledgement", ackError);
      setWinnersError("We couldn't register your click. Please try again.");
    } finally {
      setIsAcknowledgingWinners(false);
    }
  }, [
    IS_FIREBASE_CONFIGURED,
    isAcknowledgingWinners,
    roomId,
    shouldShowWinnersButton,
    winnersReadyPlayers,
  ]);

  const resetIndexOnDataChange = useRef(showcaseGroups.length);
  useEffect(() => {
    if (resetIndexOnDataChange.current !== showcaseGroups.length) {
      setCurrentIndex(0);
      resetIndexOnDataChange.current = showcaseGroups.length;
    }
  }, [showcaseGroups.length]);

  const handleVote = useCallback(
    async (selectedResponse) => {
      if (
        !roomId ||
        !playerIdRef.current ||
        !currentGroup ||
        !selectedResponse ||
        isSubmittingVote
      ) {
        return;
      }

      if (!IS_FIREBASE_CONFIGURED) {
        console.error('Cannot submit vote: Firebase not configured');
        setError('Cannot submit vote: backend not configured.');
        return;
      }

      const imageId = currentGroup.imageId;
      const encodedImageKey = encodeImageKey(imageId);
      const voteKey = `${encodedImageKey}_${playerIdRef.current}`;
      const captionOwnerId = selectedResponse.playerId;

      setIsSubmittingVote(true);
      try {
        const roomRef = doc(db, "rooms", roomId);
        await updateDoc(roomRef, {
          [`funnies.votes.${voteKey}`]: {
            imageId,
            playerId: captionOwnerId,
            voterId: playerIdRef.current,
            captionOwnerId,
            captionText: selectedResponse.caption,
            votedAt: Date.now(),
          },
          "funnies.updatedAt": Date.now(),
        });
      } catch (voteError) {
        console.error("Failed to record vote", voteError);
        setError("We could not save your vote. Please try again.");
      } finally {
        setIsSubmittingVote(false);
      }
    },
    [currentGroup, isSubmittingVote, roomId],
  );

  if (error) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-4xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Funnies Showcase</h2>
          <p className="text-[#c1121f]">{error}</p>
          <button className="funnies-button" onClick={handleNavigateHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !currentGroup) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-4xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Funnies Showcase</h2>
          <p>Preparing your captions…</p>
          <div className="typing-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnies-paper px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <section className="funnies-sheet space-y-6 text-left">
          <header className="space-y-2">
            <p className="funnies-subhead">
              Image {currentIndex + 1} of {showcaseGroups.length}
            </p>
          </header>

          <div className="funnies-image-frame">
            <img
              src={currentGroup.imageId}
              alt="Comic strip panel"
              className="w-full max-h-[50vh] object-contain"
            />
          </div>

          {revealedResponses.length ? (
            <div className="funnies-caption-list">
              {revealedResponses.map((response, index) => {
                const voteCount = currentImageTallies[response.playerId] || 0;
                const isUserVote =
                  currentUserVote?.captionOwnerId === response.playerId;
                return (
                  <article key={response.playerId} className="funnies-caption-card">
                    <p className="funnies-caption-author italic">
                      {response.playerName}
                    </p>
                    <p className="funnies-caption-text">&ldquo;{response.caption}&rdquo;</p>
                    <div className="funnies-caption-actions">
                      <button
                        type="button"
                        className={`funnies-button funnies-button--vote ${
                          isUserVote ? "funnies-button--selected" : ""
                        }`}
                        onClick={() => handleVote(response)}
                      >
                        Vote
                      </button>
                      <div className="funnies-vote-counter">
                        <span className="funnies-vote-count">{voteCount}</span>
                        <span className="funnies-subhead">Votes</span>
                      </div>
                    </div>
                  </article>
                );
              })}
              {canRevealMore && (
                <button
                  type="button"
                  className="funnies-nav-button"
                  onClick={handleRevealNext}
                >
                  Reveal Next Caption
                  {nextResponseToReveal?.playerName ? (
                    <>
                      {' '}
                      (<span className="italic">{nextResponseToReveal.playerName}</span>)
                    </>
                  ) : null}
                </button>
              )}
            </div>
          ) : (
            <div className="funnies-vote-panel">
              <p>No captions were submitted for this image.</p>
            </div>
          )}

          {shouldShowWinnersButton && (
            <div className="funnies-victory-cta">
              <button
                type="button"
                className="funnies-button funnies-button--victory"
                onClick={handleAcknowledgeWinners}
                disabled={winnersButtonDisabled}
              >
                {isWaitingForOthers ? "Waiting for other players…" : "See Winners"}
              </button>
              <p className="funnies-victory-meta">
                {acknowledgedCount}/{totalPlayers || "?"} players ready
                {isWaitingForOthers && remainingAcknowledgements > 0
                  ? ` — waiting for ${remainingAcknowledgements} more`
                  : ""}
              </p>
              {winnersError ? (
                <p className="funnies-victory-error">{winnersError}</p>
              ) : null}
            </div>
          )}
        </section>

        <nav className="flex flex-wrap gap-3">
          <button
            type="button"
            className="funnies-nav-button"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
          >
            Previous Image
          </button>
          <button
            type="button"
            className="funnies-nav-button"
            onClick={goToNext}
            disabled={currentIndex + 1 >= showcaseGroups.length}
          >
            Next Image
          </button>
        </nav>
      </div>
    </div>
  );
}
