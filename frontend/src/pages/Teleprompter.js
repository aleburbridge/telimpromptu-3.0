import React, { useEffect, useState, useRef } from 'react';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getRoomIdFromPlayerId } from '../utils/player-utils';
import { getRoomDataFromRoomId, getRoomIdFromRoomName } from '../utils/room-utils';
import { getSegmentData } from '../utils/scripts-utils';
import { replacePlaceholdersInPrompts, replaceSpeakerInPrompts } from '../utils/scripts-utils';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import axios from '../config/axios';
import { PROJECT_ID, REGION } from '../config/firebase';

export default function Teleprompter() {
    const [script, setScript] = useState([]);
    const [speed, setSpeed] = useState(2);
    const [paused, setPaused] = useState(false);
    const [roomId, setRoomId] = useState('');
    const [link, setLink] = useState('')
    const teleprompterRef = useRef(null);
    const scrollInterval = useRef(null);
    const { roomName } = useParams();

    useEffect(() => {
        const initializeRoom = async () => {
            try {
                let roomId;
                if (roomName) {
                    roomId = await getRoomIdFromRoomName(roomName);
                    const formattedRoomName = roomName.replace(/ /g, '%20');
                    setLink(`https://telimpromptu.net/teleprompter/${formattedRoomName}`);
                } else {
                    const playerId = localStorage.getItem('playerId');
                    if (playerId) {
                        roomId = await getRoomIdFromPlayerId(playerId);
                    }
                }

                if (roomId) {
                    setRoomId(roomId);
                    const roomData = await getRoomDataFromRoomId(roomId);
                    if (roomData && roomData.segmentIds) {
                        const scriptSegments = await fetchScript(roomData.segmentIds, roomId);
                        setScript(scriptSegments);
                        let roomName = roomData.roomName;
                        const formattedRoomName = roomName.replace(/ /g, '%20');
                        setLink(`https://telimpromptu.net/teleprompter/${formattedRoomName}`);
                    }

                    const roomDocRef = doc(db, 'rooms', roomId);
                    onSnapshot(roomDocRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const roomData = docSnapshot.data();
                            if (roomData && roomData.teleprompterSpeed !== undefined) {
                                setSpeed(roomData.teleprompterSpeed);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing room:', error);
            }
        };

        initializeRoom();
    }, [roomName]);

    useEffect(() => {
        if (teleprompterRef.current && !paused) {
            scrollInterval.current = setInterval(() => {
                if (teleprompterRef.current) {
                    teleprompterRef.current.scrollBy(0, speed);
                }
            }, 40);
        } else {
            clearInterval(scrollInterval.current);
        }

        return () => clearInterval(scrollInterval.current);
    }, [speed, paused]);

    const fetchScript = async (segmentIds, roomId) => {
        const response = await axios.get(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getSegments`);
        let segments = []
        if (response.data) {
            segments = (response.data);
        }
        segments = await Promise.all(segmentIds.map(id => getSegmentData(id)));
        console.log("Segments are ", segments)
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
            <div className="teleprompter-text overflow-hidden h-4/5 w-full max-w-4xl mx-auto p-4 text-4xl leading-loose" ref={teleprompterRef}>
                <div style={{ height: '100vh' }}></div>
                {script.map((line, index) => (
                    <div key={index}>
                        <span className="mb-20 text-accent">{line.speaker}</span>
                        <span className="mb-20">: {line.content}</span>
                        <br />
                        <br />
                    </div>
                ))}
                {/*
                <p className='text-accent text-3xl'>
                    Thanks for playing! You can access this teleprompter again by going to this link: {link}
                    <br/>
                    <br/>
                    <Link to='/' className='text-primary'>← Return to home page</Link>
                </p>
                */}
            
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
