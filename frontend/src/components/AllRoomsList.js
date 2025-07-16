import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../config/firebase";

export default function AllRoomsList() {
  const navigate = useNavigate();
  const [roomsList, setRoomsList] = useState([]);

  useEffect(() => {
    const roomsCollectionRef = collection(db, "rooms");
    const unsubscribe = onSnapshot(roomsCollectionRef, (snapshot) => {
      const oneHourAgo = new Date(Date.now() - 3600 * 1000);
      const rooms = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (room) =>
            room.isJoinable !== false && room.createdAt.toDate() > oneHourAgo,
        )
        .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
      setRoomsList(rooms);
    });

    return () => unsubscribe();
  }, []);

  const handleRoomClick = (room) => () => {
    navigate("/join-room", { state: { roomIdToJoin: room.id } });
  };

  return (
    <div className="mt-2">
      <div className="bg-secondary p-4 rounded-md overflow-y-auto max-h-64">
        <h3 className="text-xl font-bold mb-2">
          {roomsList.length} Active {roomsList.length === 1 ? "Room" : "Rooms"}
        </h3>
        {roomsList.map((room) => (
          <div className="mt-2" key={room.id}>
            <p
              className="btn btn-primary cursor-pointer w-full"
              onClick={handleRoomClick(room)}
            >
              {room.roomName || "Unnamed Room"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
