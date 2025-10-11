import React, { useState, useEffect } from "react";
import { playerCollectionRef } from "../config/firebase.js";
import { doc, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { getRoomIdFromPlayerId } from "../utils/player-utils.js";
import { getRoomDataFromRoomId } from "../utils/room-utils.js";
import {
  DEFAULT_GAME_TYPE,
  GAME_TYPES,
  getGameOptionById,
  normalizeGameType,
} from "../constants/gameTypes";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [gameType, setGameType] = useState(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const stored = window.localStorage.getItem("gameType");
    return stored ? normalizeGameType(stored) : null;
  });
  const [roomId, setRoomId] = useState("");
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerClickedStart, setPlayerClickedStart] = useState(false);
  const [playersList, setPlayersList] = useState([]);

  const fallbackGameOption = getGameOptionById(DEFAULT_GAME_TYPE);
  const normalizedGameType = gameType
    ? normalizeGameType(gameType)
    : null;

  const activeGameOption = normalizedGameType
    ? getGameOptionById(normalizedGameType)
    : null;
  const gameLabel = activeGameOption
    ? activeGameOption.title
    : fallbackGameOption?.title || "Broadcast";

  useEffect(() => {
    if (typeof window !== "undefined" && normalizedGameType) {
      window.localStorage.setItem("gameType", normalizedGameType);
    }
  }, [normalizedGameType]);

  useEffect(() => {
    const initializeRoom = async () => {
      const playerId = typeof window !== "undefined" ? localStorage.getItem("playerId") : null;
      const fetchedRoomId = await getRoomIdFromPlayerId(playerId);
      if (fetchedRoomId) {
        setRoomId(fetchedRoomId);
        try {
          const roomData = await getRoomDataFromRoomId(fetchedRoomId);
          if (roomData) {
            setRoomName(roomData.roomName || "");
            const resolvedGameType = normalizeGameType(roomData.gameType);
            setGameType((previous) => resolvedGameType || previous || DEFAULT_GAME_TYPE);
          } else {
            setGameType((previous) => previous || DEFAULT_GAME_TYPE);
          }
        } catch (error) {
          console.error("Error fetching room data:", error);
        }
      }
    };
    initializeRoom();
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const q = query(playerCollectionRef, where("roomId", "==", roomId));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const players = [];
      let allReady = true;
      querySnapshot.forEach((doc) => {
        const player = doc.data();
        player.docId = doc.id;
        players.push(player);
        if (!player.isReady) {
          allReady = false;
        }
      });
      setPlayersList(players);
      setReadyToStart(players.length > 2);

      if (players.length > 2 && allReady) {
        if (!normalizedGameType) {
          return;
        }

        if (normalizedGameType === GAME_TYPES.FUNNIES) {
          navigate("/funnies-caption");
        } else {
          navigate("/topic-vote");
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, navigate, normalizedGameType]);

  const handleClick = async () => {
    const playerId = localStorage.getItem("playerId");
    const playerDocRef = doc(playerCollectionRef, playerId);
    setPlayerClickedStart(true);
    await updateDoc(playerDocRef, {
      isReady: true,
    });
  };

  return (
    <div className="container container-md">
      <p className="text-2xl mt-2 text-white">
        Waiting Room for <i>{roomName}</i>
      </p>
      <p className="mt-1 text-white opacity-80">{gameLabel} Game</p>
      <p className="mt-4 text-white">
        {readyToStart
          ? "💡 Once you start the game, you won't be able to add more players"
          : ""}
      </p>
      <button
        className="btn btn-primary mt-3 h-12"
        disabled={playerClickedStart || !readyToStart}
        onClick={handleClick}
      >
        {readyToStart
          ? "☑︎ Ready to Start"
          : `Need ${3 - playersList.length} more players to start`}
      </button>
      <div className="container-inner mt-2">
        <p className="text-xl">
          <u>Players</u>
        </p>
        {playersList.map((player) => (
          <div key={player.docId} className="mt-1 text-white">
            {readyToStart ? (player.isReady ? "✅  " : "⏳  ") : ""}
            {player.playerName || "Unnamed Player"}
            {player.docId === localStorage.getItem("playerId") ? " (you)" : ""}
          </div>
        ))}
      </div>
      <Link to="/">
        <button className="btn btn-secondary mt-4 text-accent">
          ← Leave Room
        </button>
      </Link>
    </div>
  );
}
