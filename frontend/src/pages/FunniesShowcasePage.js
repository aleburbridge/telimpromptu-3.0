import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
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
  tallyVotesPerImage,
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

  const [roomId, setRoomId] = useState("");
  const [playersMap, setPlayersMap] = useState({});
  const [images, setImages] = useState([]);
  const [responses, setResponses] = useState({});
  const [votes, setVotes] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  const showcaseGroups = useMemo(
    () => groupResponsesByImage({ images, responses, playersMap }),
    [images, responses, playersMap],
  );

  const currentGroup = showcaseGroups[currentIndex];
  const currentResponses = currentGroup?.responses || [];
  const currentResponse = currentResponses[currentResponseIndex];
  const voteTallies = useMemo(() => tallyVotesPerImage(votes), [votes]);
  const currentImageVoteCount = currentGroup
    ? voteTallies[currentGroup.imageId] || 0
    : 0;

  const handleNavigateHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleNextResponse = useCallback(() => {
    setCurrentResponseIndex((index) =>
      Math.min(index + 1, Math.max(currentResponses.length - 1, 0)),
    );
  }, [currentResponses.length]);

  const handlePreviousResponse = useCallback(() => {
    setCurrentResponseIndex((index) => Math.max(index - 1, 0));
  }, []);

  const hasNextResponse = currentResponseIndex + 1 < currentResponses.length;
  const hasPreviousResponse = currentResponseIndex > 0;

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
      const gameType = normalizeGameType(data.gameType);
      if (gameType !== "funnies") {
        handleNavigateHome();
        return;
      }

      const funniesData = data.funnies || {};
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
    setCurrentResponseIndex(0);
  }, [currentIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) =>
      Math.min(index + 1, Math.max(showcaseGroups.length - 1, 0)),
    );
  }, [showcaseGroups.length]);

  const resetIndexOnDataChange = useRef(showcaseGroups.length);
  useEffect(() => {
    if (resetIndexOnDataChange.current !== showcaseGroups.length) {
      setCurrentIndex(0);
      resetIndexOnDataChange.current = showcaseGroups.length;
    }
  }, [showcaseGroups.length]);

  const handleVote = useCallback(async () => {
    if (!roomId || !playerIdRef.current || !currentGroup || !currentResponse) {
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

    setIsSubmittingVote(true);
    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`funnies.votes.${voteKey}`]: {
          imageId,
          playerId: currentResponse.playerId,
          voterId: playerIdRef.current,
          captionOwnerId: currentResponse.playerId,
          captionText: currentResponse.caption,
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
  }, [currentGroup, currentResponse, roomId]);

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
            <h1 className="funnies-headline text-4xl">Evening Edition Showcase</h1>
          </header>

          <div className="funnies-image-frame">
            <img
              src={currentGroup.imageId}
              alt="Comic strip panel"
              className="w-full max-h-[480px] object-contain"
            />
          </div>

          {currentResponse ? (
            <div className="funnies-vote-panel space-y-6">
              <p className="text-lg leading-7">
                {currentResponse.caption}
              </p>
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  className="funnies-button"
                  onClick={handleVote}
                  disabled={isSubmittingVote}
                >
                  {isSubmittingVote ? "Submitting…" : "Vote for this Caption"}
                </button>
                <div className="flex items-center gap-3">
                  <p className="funnies-subhead">Votes for this caption</p>
                  <span className="funnies-vote-count">{currentImageVoteCount}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="funnies-vote-panel">
              <p>No captions were submitted for this image.</p>
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
          <div className="ml-auto flex flex-wrap gap-3">
            <button
              type="button"
              className="funnies-nav-button"
              onClick={handlePreviousResponse}
              disabled={!hasPreviousResponse}
            >
              Previous Caption
            </button>
            <button
              type="button"
              className="funnies-nav-button"
              onClick={handleNextResponse}
              disabled={!hasNextResponse}
            >
              Next Caption
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
