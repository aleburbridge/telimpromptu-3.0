import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRoomForm from "../components/CreateRoomForm";
import About from "../components/About";
import AllRoomsList from "../components/AllRoomsList";
import GameTypeSelector from "../components/GameTypeSelector";
import axios from "../config/axios";
import { REGION, PROJECT_ID } from "../config/firebase.js";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { playerCollectionRef, roomsCollectionRef } from "../config/firebase";
import { setRoomHeadline } from "../utils/room-utils";
import {
  DEFAULT_GAME_TYPE,
  getGameOptionById,
  GAME_TYPES,
  normalizeGameType,
} from "../constants/gameTypes";
import {
  encodeResponsesMap,
  selectRandomImages,
  shuffleArray,
} from "../utils/funnies-utils";
import { FUNNIES_IMAGE_PATHS } from "../constants/funniesImages";

export default function HomePage() {
  const [showCreateRoomButton, setShowCreateRoomButton] = useState(true);
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [isCreatingTestRoom, setIsCreatingTestRoom] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState(() => {
    if (typeof window !== "undefined") {
      const storedGameType = window.localStorage.getItem("gameType");
      return normalizeGameType(storedGameType);
    }
    return DEFAULT_GAME_TYPE;
  });
  const navigate = useNavigate();

  const isTestMode = process.env.REACT_APP_TEST_MODE === "true";
  const selectedGameOption = getGameOptionById(selectedGameType);
  const createButtonLabel = selectedGameOption
    ? `Create ${selectedGameOption.title} Room`
    : "Create Room";
  const isBroadcastSelected = selectedGameType === GAME_TYPES.BROADCAST;
  const isFunniesSelected = selectedGameType === GAME_TYPES.FUNNIES;
  const testButtonLabel = isFunniesSelected
    ? "Test Funnies Room"
    : "Test Broadcast Room";

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "gameType",
        normalizeGameType(selectedGameType),
      );
    }
  }, [selectedGameType]);

  const toggleFormVisibility = () => {
    setShowCreateRoomForm(!showCreateRoomForm);
    setShowCreateRoomButton(!showCreateRoomButton);
  };

  const createTestRoomWith4Players = async () => {
    setIsCreatingTestRoom(true);
    const isBroadcast = selectedGameType === GAME_TYPES.BROADCAST;
    try {
      const timestamp = Date.now();
      const roomResponse = await axios.post(
        `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/saveRoomToDb`,
        {
          roomName: `${isBroadcast ? "Broadcast" : "Funnies"} Test Room ${timestamp}`,
          password: "test123",
          gameType: selectedGameType,
        },
      );

      const roomResult = roomResponse.data;
      if (!roomResult.success) {
        throw new Error(roomResult.message || "Failed to create room");
      }

      const roomId = roomResult.roomId;
      const playerNames = ["Player1", "Player2", "Player3", "Player4"];
      const playerPromises = playerNames.map(async (playerName) => {
        const playerResponse = await axios.post(
          `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/savePlayerToDb`,
          {
            playerName,
            roomId,
          },
        );
        return playerResponse.data;
      });

      const playerResults = await Promise.all(playerPromises);
      const mainPlayer = playerResults[0];

      localStorage.setItem("playerId", mainPlayer.playerId);
      localStorage.setItem("gameType", selectedGameType);

      if (isBroadcast) {
        const votePromises = playerResults.map(async (playerResult) => {
          const playerDocRef = doc(playerCollectionRef, playerResult.playerId);
          await updateDoc(playerDocRef, {
            topicVote: "sports",
          });
        });

        await Promise.all(votePromises);
        await setRoomHeadline(roomId, "Local Sports Team Wins Big Game");
        navigate("/prompt-answering");
        return;
      }

      const readyPromises = playerResults.map(async (playerResult) => {
        const playerDocRef = doc(playerCollectionRef, playerResult.playerId);
        await updateDoc(playerDocRef, {
          isReady: true,
        });
      });

      await Promise.all(readyPromises);

      const selectedImages = selectRandomImages(FUNNIES_IMAGE_PATHS);
      const images = selectedImages.length
        ? selectedImages
        : FUNNIES_IMAGE_PATHS.slice(0, 4);

      const orders = {};
      const responses = {};
      const completedPlayers = [];

      playerResults.forEach((playerResult, index) => {
        const order = index === 0 ? [...images] : shuffleArray(images);
        orders[playerResult.playerId] = order;
        if (index === 0) {
          responses[playerResult.playerId] = {};
        } else {
          responses[playerResult.playerId] = images.reduce((accumulator, imageId, imageIndex) => {
            accumulator[imageId] = `Sample punchline ${imageIndex + 1}`;
            return accumulator;
          }, {});
          completedPlayers.push(playerResult.playerId);
        }
      });

      const roomDocRef = doc(roomsCollectionRef, roomId);
      await updateDoc(roomDocRef, {
        gameType: GAME_TYPES.FUNNIES,
        "funnies.images": images,
        "funnies.orders": orders,
        "funnies.responses": encodeResponsesMap(responses),
        "funnies.completedPlayers": completedPlayers,
        "funnies.updatedAt": serverTimestamp(),
      });

      navigate("/funnies-caption");
    } catch (error) {
      console.error("Error creating test room:", error);
      alert("Failed to create test room: " + error.message);
    } finally {
      setIsCreatingTestRoom(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {isTestMode && (
            <button
              className="btn btn-primary btn-tall w-full mt-2"
              onClick={createTestRoomWith4Players}
              disabled={isCreatingTestRoom}
            >
              {isCreatingTestRoom ? (
                <>
                  Creating test room...
                  <div className="typing-loader ml-2"></div>
                </>
              ) : (
                testButtonLabel
              )}
            </button>
          )}
      {showCreateRoomButton && (
        <>
          <div className="mb-4 rounded-2xl bg-secondary p-4">
            <p className="text-center text-lg font-semibold uppercase tracking-wide text-text">
              Choose your game
            </p>
            <GameTypeSelector
              selectedGame={selectedGameType}
              onSelect={setSelectedGameType}
              className="mt-3"
            />
            <button
              className="btn btn-accent btn-tall w-full mt-4"
              onClick={toggleFormVisibility}
            >
              {createButtonLabel}
          </button>
          </div>
        </>
      )}
      {showCreateRoomForm && (
        <CreateRoomForm
          selectedGameType={selectedGameType}
          onGameTypeChange={setSelectedGameType}
        />
      )}
      <AllRoomsList selectedGameType={selectedGameType} />
    </div>
  );
}
