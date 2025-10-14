import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, IS_FIREBASE_CONFIGURED } from "../config/firebase";
import {
  decodeResponsesMap,
  filterCaptionsByImages,
  sanitizeImageSet,
  tallyVotesByCaption,
} from "../utils/funnies-utils";
import {
  getListOfPlayersFromRoomId,
  getRoomIdFromPlayerId,
} from "../utils/player-utils";

function groupResponsesByImage({ images, responses, playersMap }) {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return images.map((imageId) => {
    const groupedResponses = Object.entries(responses || {})
      .map(([playerId, playerResponses]) => {
        const caption = playerResponses?.[imageId];
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

function selectWinningEntry(responses, tallies) {
  if (!Array.isArray(responses) || responses.length === 0) {
    return null;
  }

  const enriched = responses.map((response) => ({
    ...response,
    votes: tallies?.[response.playerId] || 0,
  }));

  enriched.sort((first, second) => {
    if (second.votes !== first.votes) {
      return second.votes - first.votes;
    }
    return first.playerName.localeCompare(second.playerName);
  });

  return enriched[0];
}

export default function FunniesWinnersPage() {
  const navigate = useNavigate();
  const playerIdRef = useRef(null);
  const hasClearedReadyListRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [playersMap, setPlayersMap] = useState({});
  const [images, setImages] = useState([]);
  const [responses, setResponses] = useState({});
  const [votes, setVotes] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const goHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const initialize = async () => {
      if (!IS_FIREBASE_CONFIGURED) {
        setError(
          "This environment is not connected to Firebase, so winners cannot be displayed.",
        );
        setIsLoading(false);
        return;
      }

      const storedPlayerId = localStorage.getItem("playerId");
      if (!storedPlayerId) {
        goHome();
        return;
      }
      playerIdRef.current = storedPlayerId;

      setIsLoading(true);
      try {
        const derivedRoomId = await getRoomIdFromPlayerId(storedPlayerId);
        if (!derivedRoomId) {
          goHome();
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
        console.error("Failed to load winners page", initializeError);
        setError("We couldn't load the winners. Please try again.");
        setIsLoading(false);
      }
    };

    initialize();
  }, [goHome]);

  useEffect(() => {
    if (!roomId || !IS_FIREBASE_CONFIGURED) {
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
        const funniesData = data.funnies || {};

        const rawImages = Array.isArray(funniesData.images)
          ? funniesData.images
          : [];
        const normalizedImages = sanitizeImageSet(rawImages);
        setImages(normalizedImages);

        const decodedResponses = decodeResponsesMap(funniesData.responses);
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
        setResponses(filteredResponses);

        const votesMap =
          funniesData.votes && typeof funniesData.votes === "object"
            ? funniesData.votes
            : {};
        setVotes(votesMap);
        setIsLoading(false);
      },
      (snapshotError) => {
        console.error("Realtime snapshot error while loading winners", snapshotError);
        setError("We couldn't load the winners. Please try again.");
      },
    );

    return () => unsubscribe();
  }, [IS_FIREBASE_CONFIGURED, roomId]);

  useEffect(() => {
    if (
      !roomId ||
      !IS_FIREBASE_CONFIGURED ||
      hasClearedReadyListRef.current
    ) {
      return;
    }

    const roomRef = doc(db, "rooms", roomId);
    updateDoc(roomRef, {
      "funnies.winnersReadyPlayers": [],
      "funnies.updatedAt": Date.now(),
    }).catch((clearError) => {
      console.error("Failed to reset winners readiness state", clearError);
    });
    hasClearedReadyListRef.current = true;
  }, [IS_FIREBASE_CONFIGURED, roomId]);

  const voteTallies = useMemo(() => tallyVotesByCaption(votes), [votes]);

  const showcaseGroups = useMemo(
    () => groupResponsesByImage({ images, responses, playersMap }),
    [images, responses, playersMap],
  );

  const winningSlides = useMemo(
    () =>
      showcaseGroups.map((group, index) => {
        const winningEntry = selectWinningEntry(
          group.responses,
          voteTallies[group.imageId] || {},
        );
        return {
          ...group,
          displayIndex: index + 1,
          winner: winningEntry,
        };
      }),
    [showcaseGroups, voteTallies],
  );

  if (error) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-4xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Winners Circle</h2>
          <p className="text-[#c1121f]">{error}</p>
          <button type="button" className="funnies-button" onClick={goHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-4xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Winners Circle</h2>
          <p>Setting the stage…</p>
          <div className="typing-loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="funnies-paper px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="funnies-sheet space-y-6 text-left">
          <header className="space-y-2">
            <p className="funnies-subhead">Victory Edition</p>
            <h2 className="funnies-headline text-4xl">The Winners Circle</h2>
            <p className="funnies-dek">
              Celebrating the captions that brought the loudest laughs.
            </p>
          </header>

          <div className="funnies-winners-grid">
            {winningSlides.length ? (
              winningSlides.map((slide) => (
                <article key={slide.imageId} className="funnies-winners-card">
                  <p className="funnies-subhead text-sm uppercase tracking-[0.3em]">
                    Panel {slide.displayIndex}
                  </p>
                  <div className="funnies-image-frame funnies-image-frame--winners">
                    <img
                      src={slide.imageId}
                      alt={`Winning comic panel ${slide.displayIndex}`}
                      className="w-full object-contain"
                    />
                  </div>
                  <div className="funnies-winner-caption">
                    {slide.winner ? (
                      <>
                        <p className="funnies-winner-name italic">
                          {slide.winner.playerName}
                        </p>
                        <p className="funnies-winner-text">
                          &ldquo;{slide.winner.caption}&rdquo;
                        </p>
                        <p className="funnies-winner-votes">
                          {slide.winner.votes} vote{slide.winner.votes === 1 ? "" : "s"}
                        </p>
                      </>
                    ) : (
                      <p className="funnies-winner-empty">
                        No captions were submitted for this panel.
                      </p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="funnies-winner-empty funnies-winner-empty--full">
                We don't have any winning captions to show yet. Check back soon!
              </p>
            )}
          </div>
        </section>

        <nav className="flex flex-wrap gap-3">
          <button type="button" className="funnies-nav-button" onClick={goHome}>
            Back to Home
          </button>
        </nav>
      </div>
    </div>
  );
}
