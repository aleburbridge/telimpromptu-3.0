import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateRoomForm from "../components/CreateRoomForm";
import About from "../components/About";
import AllRoomsList from "../components/AllRoomsList";
import axios from "../config/axios";
import { REGION, PROJECT_ID } from "../config/firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import { roomsCollectionRef, playerCollectionRef } from "../config/firebase";
import { setRoomHeadline } from "../utils/room-utils";

export default function HomePage() {
  const [showCreateRoomButton, setShowCreateRoomButton] = useState(true);
  const [showCreateRoomForm, setShowCreateRoomForm] = useState(false);
  const [isCreatingTestRoom, setIsCreatingTestRoom] = useState(false);
  const navigate = useNavigate();
  
  const isTestMode = process.env.REACT_APP_TEST_MODE === 'true';

  const toggleFormVisibility = () => {
    setShowCreateRoomForm(!showCreateRoomForm);
    setShowCreateRoomButton(!showCreateRoomButton);
  };

  const createTestRoomWith4Players = async () => {
    setIsCreatingTestRoom(true);
    try {
      // Create room with unique name
      const timestamp = Date.now();
      const roomResponse = await axios.post(
        `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/saveRoomToDb`,
        {
          roomName: `Test Room 4 Players ${timestamp}`,
          password: "test123",
        },
      );

      const roomResult = roomResponse.data;
      if (!roomResult.success) {
        throw new Error(roomResult.message || "Failed to create room");
      }

      const roomId = roomResult.roomId;

      // Create 4 players
      const playerNames = ["Player1", "Player2", "Player3", "Player4"];
      const playerPromises = playerNames.map(async (playerName) => {
        const playerResponse = await axios.post(
          `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/savePlayerToDb`,
          {
            playerName: playerName,
            roomId: roomId,
          },
        );
        return playerResponse.data;
      });

      const playerResults = await Promise.all(playerPromises);
      
      // Store the first player as the current user
      const mainPlayer = playerResults[0];
      localStorage.setItem("playerId", mainPlayer.playerId);

      // Set all players to vote for sports
      const votePromises = playerResults.map(async (playerResult) => {
        const playerDocRef = doc(playerCollectionRef, playerResult.playerId);
        await updateDoc(playerDocRef, {
          topicVote: "sports"
        });
      });

      await Promise.all(votePromises);

      // Set a test headline
      await setRoomHeadline(roomId, "Local Sports Team Wins Big Game");

      // Navigate to prompt-answering page
      navigate("/prompt-answering");

    } catch (error) {
      console.error("Error creating test room:", error);
      alert("Failed to create test room: " + error.message);
    } finally {
      setIsCreatingTestRoom(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {showCreateRoomButton && (
        <>
          <button
            className="btn btn-accent btn-tall w-full"
            onClick={toggleFormVisibility}
          >
            Create Room
          </button>
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
                "Test Room with 4 People"
              )}
            </button>
          )}
        </>
      )}
      {showCreateRoomForm && <CreateRoomForm />}
      <About />
      <AllRoomsList />
    </div>
  );
}
