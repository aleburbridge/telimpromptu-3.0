import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { generateSlug } from "random-word-slugs";
import { REGION, PROJECT_ID, db } from "../config/firebase.js";
import { doc, updateDoc } from "firebase/firestore";
import GameTypeSelector from "./GameTypeSelector";
import { DEFAULT_GAME_TYPE } from "../constants/gameTypes";

export default function CreateRoomForm({ selectedGameType = DEFAULT_GAME_TYPE, onGameTypeChange }) {
  const navigate = useNavigate();
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialRoomName, setInitialRoomName] = useState("");
  const [gameType, setGameType] = useState(selectedGameType);

  const generateWordSlug = () => {
    let wordSlug = generateSlug(2, { format: "title" });

    if (wordSlug.endsWith("y")) {
      wordSlug = wordSlug.slice(0, -1) + "ies";
    } else if (wordSlug.endsWith("oo")) {
      wordSlug = wordSlug + "s";
    } else if (wordSlug.endsWith("ch") || wordSlug.endsWith("o")) {
      wordSlug = wordSlug + "es";
    } else if (wordSlug.endsWith("s")) {
      // do nothing
    } else {
      wordSlug = wordSlug + "s";
    }

    return wordSlug;
  };

  useEffect(() => {
    setInitialRoomName(generateWordSlug());
  }, []);

  useEffect(() => {
    setGameType(selectedGameType);
  }, [selectedGameType]);

  const handleRegenerate = () => {
    setInitialRoomName(generateWordSlug());
  };

  const handleGameSelection = (nextGameType) => {
    setGameType(nextGameType);
    if (onGameTypeChange) {
      onGameTypeChange(nextGameType);
    }
  };

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    const chosenGameType = payload.gameType || gameType;

    try {
      const roomResponse = await axios.post(
        `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/saveRoomToDb`,
        {
          roomName: payload.roomName,
          password: payload.password,
          gameType: chosenGameType,
        },
      );

      const roomResult = roomResponse.data;

      if (roomResult.success) {
        const playerResponse = await axios.post(
          `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/savePlayerToDb`,
          {
            playerName: payload.playerName,
            roomId: roomResult.roomId,
          },
        );

        const playerResult = playerResponse.data;

        try {
          await updateDoc(doc(db, "rooms", roomResult.roomId), {
            gameType: chosenGameType,
          });
        } catch (updateError) {
          console.error("Failed to persist game type on room", updateError);
        }

        localStorage.setItem("playerId", playerResult.playerId);
        localStorage.setItem("gameType", chosenGameType);
        navigate("/waiting-room");
      } else {
        setError(
          roomResult.message || "Could not create room. Please try again.",
        );
        setIsLoading(false);
      }
    } catch (e) {
      setError("Error creating room. Check console for details.");
      console.error("Error creating room: ", e);
      setIsLoading(false);
    }
  };

  return (
    <form className="container-inner mx-auto" onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      <div className="mt-2">
        <p className="text-left text-xs font-semibold uppercase tracking-wide text-text">
          Select a game
        </p>
        <GameTypeSelector
          selectedGame={gameType}
          onSelect={handleGameSelection}
          className="mt-2"
        />
        <input type="hidden" name="gameType" value={gameType} />
      </div>
      <div>
        <input
          className="input w-full mt-1"
          type="text"
          name="playerName"
          placeholder="Your Name"
          required
        />
      </div>
      <div className="relative">
        <input
          className="input w-full mt-2"
          type="text"
          name="roomName"
          value={initialRoomName}
          onChange={(e) => setInitialRoomName(e.target.value)}
          placeholder="Room Name"
          required
        />
        <button
          type="button"
          onClick={handleRegenerate}
          className="absolute top-4 right-4 text-xl text-white"
          title="Regenerate Room Name"
        >
          🎲
        </button>
      </div>
      <div>
        <input
          className="input w-full mt-2"
          type="password"
          name="password"
          placeholder="Room Password"
          required
        />
      </div>
      <button
        className="btn btn-accent btn-tall w-full mt-2 mb-6 flex items-center justify-center"
        type="submit"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            Creating room
            <div className="flex items-center ml-2">
              <div className="lds-spinner">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </>
        ) : (
          "Create Room"
        )}
      </button>
    </form>
  );
}
