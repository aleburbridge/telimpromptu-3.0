import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  arrayUnion,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, IS_FIREBASE_CONFIGURED } from "../config/firebase";
import { GAME_TYPES, normalizeGameType } from "../constants/gameTypes";
import {
  calculateCompletionState,
  decodeResponsesMap,
  encodeImageKey,
  encodeResponsesMap,
  ensureImageSet,
  filterCaptionsByImages,
  normalizeOrder,
  sanitizeImageSet,
  shuffleArray,
} from "../utils/funnies-utils";
import { getRoomIdFromPlayerId } from "../utils/player-utils";
import { getRoomDataFromRoomId } from "../utils/room-utils";

function buildResponsesMap(rawResponses) {
  const decoded = decodeResponsesMap(rawResponses);
  const normalized = {};
  Object.entries(decoded).forEach(([playerId, entries]) => {
    if (!entries || typeof entries !== "object") {
      return;
    }
    const captions = {};
    Object.entries(entries).forEach(([imageId, caption]) => {
      if (typeof caption === "string") {
        captions[imageId] = caption;
      }
    });
    normalized[playerId] = captions;
  });
  return normalized;
}

function arraysAreEqual(first, second) {
  if (first === second) {
    return true;
  }
  if (!Array.isArray(first) || !Array.isArray(second)) {
    return false;
  }
  if (first.length !== second.length) {
    return false;
  }
  for (let index = 0; index < first.length; index += 1) {
    if (first[index] !== second[index]) {
      return false;
    }
  }
  return true;
}

export default function FunniesCaptionPage() {
  const navigate = useNavigate();
  const playerIdRef = useRef(null);
  const hasMarkedCompleteRef = useRef(false);
  const hasNavigatedRef = useRef(false);

  const [roomId, setRoomId] = useState("");
  const [images, setImages] = useState([]);
  const [displayOrder, setDisplayOrder] = useState([]);
  const [captions, setCaptions] = useState({});
  const [savedCaptions, setSavedCaptions] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playersCount, setPlayersCount] = useState(0);
  const [completedPlayers, setCompletedPlayers] = useState([]);
  const [isPlayerComplete, setIsPlayerComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const currentImageId = displayOrder[currentIndex];
  const currentCaption = captions[currentImageId] || "";

  const completionState = useMemo(
    () =>
      calculateCompletionState({
        images,
        responses: { [playerIdRef.current || ""]: savedCaptions },
        playerId: playerIdRef.current || "",
      }),
    [savedCaptions, images],
  );

  useEffect(() => {
    if (displayOrder.length === 0) {
      return;
    }
    if (currentIndex >= displayOrder.length) {
      setCurrentIndex(displayOrder.length - 1);
    }
  }, [currentIndex, displayOrder.length]);

  const ensureFunniesSession = useCallback(
    async (targetRoomId, playerId) => {
      const roomRef = doc(db, "rooms", targetRoomId);
      let selectedImages = [];
      let playerOrder = [];
      let existingPlayerResponses = {};

      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(roomRef);
        if (!snapshot.exists) {
          throw new Error("Room not found");
        }

        const data = snapshot.data() || {};
        const funniesData = data.funnies || {};

        const existingImagesRaw = Array.isArray(funniesData.images)
          ? funniesData.images
          : [];

        selectedImages = ensureImageSet(existingImagesRaw);

        if (!selectedImages.length) {
          throw new Error("No images available for this game");
        }

        const existingOrdersRaw =
          funniesData.orders && typeof funniesData.orders === "object"
            ? funniesData.orders
            : {};

        const normalizedOrders = Object.entries(existingOrdersRaw).reduce(
          (accumulator, [pid, order]) => {
            accumulator[pid] = normalizeOrder(order, selectedImages);
            return accumulator;
          },
          {},
        );

        if (normalizedOrders[playerId]) {
          playerOrder = normalizeOrder(normalizedOrders[playerId], selectedImages);
        } else {
          playerOrder = normalizeOrder(
            shuffleArray(selectedImages),
            selectedImages,
          );
        }
        normalizedOrders[playerId] = playerOrder;

        const decodedResponses = buildResponsesMap(funniesData.responses);
        const sanitizedResponses = Object.entries(decodedResponses).reduce(
          (accumulator, [pid, responses]) => {
            accumulator[pid] = filterCaptionsByImages(responses, selectedImages);
            return accumulator;
          },
          {},
        );

        if (!sanitizedResponses[playerId]) {
          sanitizedResponses[playerId] = {};
        }

        existingPlayerResponses = sanitizedResponses[playerId];

        const sanitizedCompletedPlayers = Array.isArray(
          funniesData.completedPlayers,
        )
          ? funniesData.completedPlayers.filter(
              (value) => typeof value === "string",
            )
          : [];

        const updatedFunniesData = {
          ...funniesData,
          images: selectedImages,
          orders: normalizedOrders,
          responses: encodeResponsesMap(sanitizedResponses),
          completedPlayers: sanitizedCompletedPlayers,
          winnersReadyPlayers: [],
        };

        transaction.set(roomRef, { funnies: updatedFunniesData }, { merge: true });
      });

      setImages(selectedImages);
      setDisplayOrder(playerOrder);
      setCurrentIndex(0);
      setCaptions({ ...existingPlayerResponses });
      setSavedCaptions({ ...existingPlayerResponses });
    },
    [],
  );

  const markPlayerComplete = useCallback(async () => {
    if (hasMarkedCompleteRef.current || !roomId || !playerIdRef.current) {
      return;
    }

    if (!IS_FIREBASE_CONFIGURED) {
      console.error('Cannot mark completion: Firebase not configured');
      return;
    }

    try {
      const roomRef = doc(db, "rooms", roomId);
      await updateDoc(roomRef, {
        [`funnies.completedPlayers`]: arrayUnion(playerIdRef.current),
        "funnies.updatedAt": serverTimestamp(),
      });
      hasMarkedCompleteRef.current = true;
    } catch (markError) {
      console.error("Error marking funnies completion", markError);
      hasMarkedCompleteRef.current = false;
    }
  }, [roomId]);

  const handleNavigateHome = useCallback(() => {
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    const initialize = async () => {
      if (!IS_FIREBASE_CONFIGURED) {
        console.error('Firebase not configured (REACT_APP_FIREBASE_PROJECT_ID missing).');
        setError('This environment is not configured to connect to Firebase. Please set REACT_APP_FIREBASE_PROJECT_ID or use the emulator.');
        setIsLoading(false);
        return;
      }

      const storedPlayerId = localStorage.getItem("playerId");
      if (!storedPlayerId) {
        handleNavigateHome();
        return;
      }
      playerIdRef.current = storedPlayerId;
      setIsLoading(true);
      try {
        const derivedRoomId = await getRoomIdFromPlayerId(storedPlayerId);
        if (!derivedRoomId) {
          handleNavigateHome();
          return;
        }

        const roomData = await getRoomDataFromRoomId(derivedRoomId);
        const resolvedGameType = normalizeGameType(roomData?.gameType);
        if (resolvedGameType !== GAME_TYPES.FUNNIES) {
          handleNavigateHome();
          return;
        }

        setRoomId(derivedRoomId);
        await ensureFunniesSession(derivedRoomId, storedPlayerId);
      } catch (initializeError) {
        console.error("Failed to initialize funnies session", initializeError);
        setError("We could not start this Funnies game. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [ensureFunniesSession, handleNavigateHome]);

  useEffect(() => {
    if (!roomId) {
      return undefined;
    }

    if (!IS_FIREBASE_CONFIGURED) {
      console.error('Skipping realtime listener: Firebase not configured');
      return undefined;
    }

    const roomRef = doc(db, "rooms", roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setError("This room is no longer available.");
        return;
      }

      const data = snapshot.data() || {};
      const playerIds = Array.isArray(data.players)
        ? data.players.filter((value) => typeof value === "string")
        : [];
      setPlayersCount(playerIds.length);

      const funniesData = data.funnies || {};
      const completedList = Array.isArray(funniesData.completedPlayers)
        ? funniesData.completedPlayers.filter((value) => typeof value === "string")
        : [];

      setCompletedPlayers(completedList);
      const playerFinished = playerIdRef.current
        ? completedList.includes(playerIdRef.current)
        : false;
      setIsPlayerComplete(playerFinished);
      if (playerFinished) {
        hasMarkedCompleteRef.current = true;
      }

      const snapshotImagesRaw = Array.isArray(funniesData.images)
        ? funniesData.images
        : [];
      const normalizedSnapshotImages = sanitizeImageSet(snapshotImagesRaw);

      setImages((previous) =>
        arraysAreEqual(previous, normalizedSnapshotImages)
          ? previous
          : normalizedSnapshotImages,
      );

      const ordersMap =
        funniesData.orders && typeof funniesData.orders === "object"
          ? funniesData.orders
          : {};

      if (playerIdRef.current && ordersMap[playerIdRef.current]) {
        const nextOrder = normalizeOrder(
          ordersMap[playerIdRef.current],
          normalizedSnapshotImages,
        );
        setDisplayOrder((previous) =>
          arraysAreEqual(previous, nextOrder) ? previous : nextOrder,
        );
      } else if (normalizedSnapshotImages.length) {
        setDisplayOrder((previous) =>
          arraysAreEqual(previous, normalizedSnapshotImages)
            ? previous
            : normalizedSnapshotImages,
        );
      }

      const responsesMap = buildResponsesMap(funniesData.responses);
      if (playerIdRef.current && responsesMap[playerIdRef.current]) {
        const playerResponses = filterCaptionsByImages(
          responsesMap[playerIdRef.current],
          normalizedSnapshotImages,
        );
        setSavedCaptions(playerResponses);
        setCaptions((previous) => {
          const sanitizedPrevious = filterCaptionsByImages(
            previous,
            normalizedSnapshotImages,
          );
          return {
            ...sanitizedPrevious,
            ...playerResponses,
          };
        });
      } else {
        setSavedCaptions({});
        setCaptions((previous) =>
          filterCaptionsByImages(previous, normalizedSnapshotImages),
        );
      }

      const hasEveryoneFinished =
        completedList.length > 0 &&
        playerIds.length > 0 &&
        completedList.length >= playerIds.length;

      if (hasEveryoneFinished && !hasNavigatedRef.current) {
        hasNavigatedRef.current = true;
        navigate("/funnies-showcase");
      }
    });

    return () => unsubscribe();
  }, [navigate, roomId]);

  useEffect(() => {
    if (!completionState.isComplete || isPlayerComplete) {
      return;
    }
    markPlayerComplete();
  }, [completionState.isComplete, isPlayerComplete, markPlayerComplete]);

  const handleCaptionChange = useCallback(
    (event) => {
      if (!currentImageId) {
        return;
      }
      const { value } = event.target;
      setError("");
      setCaptions((previous) => ({ ...previous, [currentImageId]: value }));
    },
    [currentImageId],
  );

  const handleSaveCaption = useCallback(async () => {
    if (!roomId || !playerIdRef.current || !currentImageId) {
      return;
    }

    const caption = (captions[currentImageId] || "").trim();
    if (!caption) {
      setError("Add a caption before moving on.");
      return;
    }

    setError("");
    setIsSaving(true);
    try {
      if (!IS_FIREBASE_CONFIGURED) {
        console.error('Cannot save caption: Firebase not configured');
        setError('Cannot save caption: backend not configured.');
        return;
      }

      const roomRef = doc(db, "rooms", roomId);
      const encodedImageKey = encodeImageKey(currentImageId);
      await updateDoc(roomRef, {
        [`funnies.responses.${playerIdRef.current}.${encodedImageKey}`]: caption,
        "funnies.updatedAt": serverTimestamp(),
      });

      setSavedCaptions((previous) => ({ ...previous, [currentImageId]: caption }));
      setCaptions((previous) => ({ ...previous, [currentImageId]: caption }));

      if (displayOrder.length > 0) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < displayOrder.length) {
          setCurrentIndex(nextIndex);
        } else {
          await markPlayerComplete();
        }
      }
    } catch (saveError) {
      console.error("Failed to save caption", saveError);
      setError("We could not save that caption. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [captions, completionState.total, currentImageId, currentIndex, displayOrder.length, markPlayerComplete, roomId]);

  const showLoader = isLoading || !displayOrder.length || !currentImageId;

  if (error && !roomId) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-3xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Funnies Edition</h2>
          <p>{error}</p>
          <button className="funnies-button" onClick={handleNavigateHome}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (showLoader) {
    return (
      <div className="funnies-paper px-4 py-10">
        <div className="mx-auto w-full max-w-3xl funnies-sheet space-y-4 text-left">
          <h2 className="funnies-headline text-3xl">Funnies Edition</h2>
          <p>Setting up your Funnies game…</p>
          <div className="typing-loader"></div>
        </div>
      </div>
    );
  }

  const actionLabel =
    currentIndex + 1 >= displayOrder.length ? "Save & Finish" : "Save & Next";

  return (
    <div className="funnies-paper px-4 py-10">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <section className="funnies-sheet space-y-6 text-left">
          <header className="space-y-2">
            <p className="funnies-subhead">
              Caption {currentIndex + 1} of {displayOrder.length}
            </p>
            <h1 className="funnies-headline text-4xl">Newsroom Caption Desk</h1>
          </header>

          <div className="funnies-image-frame">
            <img
              src={currentImageId}
              alt="Comic strip panel"
              className="w-full max-h-[420px] object-contain"
            />
          </div>

          <div className="space-y-4">
            <p className="funnies-subhead">Write your punchline</p>
            <textarea
              value={currentCaption}
              onChange={handleCaptionChange}
              readOnly={isPlayerComplete}
              rows={4}
              className="funnies-textarea"
              placeholder="Type something hilarious"
            />
            {error && (
              <p className="text-sm font-semibold text-[#c1121f]">{error}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="funnies-button"
              onClick={handleSaveCaption}
              disabled={isSaving || isPlayerComplete}
            >
              {isSaving ? "Saving…" : actionLabel}
            </button>
          </div>
        </section>

        <aside className="funnies-status space-y-2 text-left">
          <p className="funnies-subhead">Pressroom Bulletin</p>
          <p>
            {completedPlayers.length} of {playersCount || "?"} players have filed their copy.
          </p>
          {isPlayerComplete && (
            <p className="font-semibold text-[#c1121f]">
              You are all set! Waiting for the rest of the newsroom…
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
