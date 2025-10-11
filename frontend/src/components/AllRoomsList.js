import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";
import { getGameOptionById, normalizeGameType } from "../constants/gameTypes";

export default function AllRoomsList({ selectedGameType }) {
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState([]);
  const preferredGameType =
    typeof selectedGameType === "string"
      ? normalizeGameType(selectedGameType)
      : null;

  useEffect(() => {
    const roomsCollectionRef = collection(db, "rooms");
    const unsubscribe = onSnapshot(roomsCollectionRef, (snapshot) => {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      const rooms = snapshot.docs
        .map((docSnapshot) => {
          const data = docSnapshot.data();
          const createdAtValue = data.createdAt;
          const createdAtDate =
            createdAtValue && typeof createdAtValue.toDate === "function"
              ? createdAtValue.toDate()
              : createdAtValue instanceof Date
              ? createdAtValue
              : null;

          return {
            id: docSnapshot.id,
            ...data,
            createdAtDate,
            gameType: normalizeGameType(data?.gameType),
          };
        })
        .filter(
          (room) =>
            room.isJoinable !== false &&
            room.createdAtDate &&
            room.createdAtDate > oneHourAgo,
        )
        .sort((a, b) => (b.createdAtDate?.getTime() || 0) - (a.createdAtDate?.getTime() || 0));
      setRoomsList(rooms);
    });

    return () => unsubscribe();
  }, []);

  const handleRoomClick = (room) => () => {
    navigate("/join-room", {
      state: { roomIdToJoin: room.id, gameType: room.gameType },
    });
  };

  return (
    <div className="mt-2">
      <div className="mb-4 rounded-2xl bg-secondary p-4">
        <h3 className="text-lg font-bold mb-2">
          {roomsList.length} Active {roomsList.length === 1 ? "Room" : "Rooms"}
        </h3>
        {roomsList.map((room) => {
          const gameOption = getGameOptionById(room.gameType);
          const gameLabel = gameOption ? gameOption.title : "Broadcast";
          return (
            <div className="mt-2" key={room.id}>
              <button
                type="button"
                className={`btn btn-primary w-full text-left ${
                  preferredGameType && room.gameType === preferredGameType
                    ? "ring-2 ring-accent"
                    : ""
                }`}
                onClick={handleRoomClick(room)}
              >
                <span className="block text-lg font-semibold">
                  {room.roomName || "Unnamed Room"}
                </span>
                <span className="mt-1 block text-sm opacity-80">
                  {gameLabel} Game
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
