import React, { useState, useEffect } from "react";
import { playerCollectionRef } from "../config/firebase.js";
import { doc, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { getRoomIdFromPlayerId } from "../utils/player-utils.js";
import { getRoomNameById } from "../utils/room-utils.js";

export default function WaitingRoomPage() {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [readyToStart, setReadyToStart] = useState(false);
  const [playerClickedStart, setPlayerClickedStart] = useState(false);
  const [playersList, setPlayersList] = useState([]);

  useEffect(() => {
    const initializeRoom = async () => {
      const fetchedRoomId = await getRoomIdFromPlayerId(
        localStorage.getItem("playerId"),
      );
      if (fetchedRoomId) {
        setRoomId(fetchedRoomId);
        try {
          const fetchedRoomName = await getRoomNameById(fetchedRoomId);
          setRoomName(fetchedRoomName);
        } catch (error) {
          console.error("Error fetching room name:", error);
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
      setReadyToStart(players.length > 2); // why is this a number and not a bool \:(

      if (players.length > 2 && allReady) {
        navigate("/topic-vote");
      }
    });

    return () => unsubscribe();
  }, [roomId, navigate]);

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
