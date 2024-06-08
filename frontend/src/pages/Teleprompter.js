import React, { useEffect, useState, useRef } from 'react';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getRoomIdFromPlayerId } from '../utils/player-utils';
import { getRoomDataFromRoomId, getRoomIdFromRoomName } from '../utils/room-utils';
import { getSegmentData } from '../script-building/BasicScriptBuilder';
import { replacePlaceholdersInPrompts, replaceSpeakerInPrompts } from '../utils/scripts-utils';
import { useParams } from 'react-router-dom';

export default function Teleprompter() {
    const [script, setScript] = useState([]);
    const [speed, setSpeed] = useState(1);
    const [paused, setPaused] = useState(false);
    const [roomId, setRoomId] = useState('');
    const teleprompterRef = useRef(null);
    const scrollInterval = useRef(null);
    const { roomName } = useParams();

    useEffect(() => {
        const initializeRoom = async () => {
            let roomId;
            if (roomName) {
                console.log("room name is", roomName)
                roomId = await getRoomIdFromRoomName(roomName);
            } else {
                roomId = await getRoomIdFromPlayerId(localStorage.getItem('playerId'));
            }
            setRoomId(roomId);
            const roomData = await getRoomDataFromRoomId(roomId);
            const scriptSegments = await fetchScript(roomData.segmentIds, roomId);
            setScript(scriptSegments);

            const roomDocRef = doc(db, 'rooms', roomId);
            onSnapshot(roomDocRef, (docSnapshot) => {
                if (docSnapshot.exists()) {
                    const roomData = docSnapshot.data();
                    setSpeed(roomData.teleprompterSpeed || 1);
                }
            });
        };

        initializeRoom();
    }, [roomName]);

    useEffect(() => {
        if (teleprompterRef.current && !paused) {
            scrollInterval.current = setInterval(() => {
                teleprompterRef.current.scrollBy(0, speed);
            }, 50);
        } else {
            clearInterval(scrollInterval.current);
        }

        return () => clearInterval(scrollInterval.current);
    }, [speed, paused]);

    const fetchScript = async (segmentIds, roomId) => {
        const segments = await Promise.all(segmentIds.map(id => getSegmentData(id)));
        const lines = segments.flatMap(segment => segment.lines);
        const replacedLines = await replacePlaceholdersInPrompts(lines, roomId);
        const replacedSpeakersAndLines = await replaceSpeakerInPrompts(replacedLines, roomId);
        return replacedSpeakersAndLines;
    };

    const handleSpeedChange = async (newSpeed) => {
        if (newSpeed < -5) newSpeed = -5;
        if (newSpeed > 5) newSpeed = 5;
        setSpeed(newSpeed);
        if (roomId) {
            const roomDocRef = doc(db, 'rooms', roomId);
            await updateDoc(roomDocRef, { teleprompterSpeed: newSpeed });
        }
    };

    const handlePauseToggle = () => setPaused(!paused);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
            <div className="teleprompter-text overflow-hidden h-4/5 w-full max-w-4xl mx-auto p-4 text-2xl leading-loose" ref={teleprompterRef}>
                {script.map((line, index) => (
                    <div key={index}>
                        <span className="mb-20 text-accent">{line.speaker}</span>
                        <span className="mb-20">: {line.content}</span>
                        <br />
                        <br />
                    </div>
                ))}
            </div>
            <div className="controls mt-4 flex gap-4">
                <button className="hover:bg-red-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleSpeedChange(speed - 1)}>«</button>
                <button className="hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" onClick={handlePauseToggle}>{paused ? '▶︎' : '⏸︎'}</button>
                <button className="hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={() => handleSpeedChange(speed + 1)}>»</button>
            </div>
            <div className="mt-2 text-lg">
                {speed}
            </div>
        </div>
    );
}
