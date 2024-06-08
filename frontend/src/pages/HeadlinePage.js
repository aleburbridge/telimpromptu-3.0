import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { isHeadlineWriter, getPlayerDataFromPlayerId } from '../utils/player-utils';
import { getRoomDataFromRoomId, setRoomHeadline } from '../utils/room-utils';
import { getRandomIdea } from '../utils/mappings/headline-ideas';
import { getRandomEmoji } from '../utils/mappings/topic-to-emoji';
import PlayersAndRoles from '../components/PlayersAndRoles';

export default function HeadlinePage() {
    const navigate = useNavigate();
    const [isUserHeadlineWriter, setIsUserHeadlineWriter] = useState(false);
    const [headlineWriterName, setHeadlineWriterName] = useState('');
    const [topic, setTopic] = useState('');
    const [headline, setHeadline] = useState('');
    const [idea, setIdea] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [roomName, setRoomName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [topicEmoji, setTopicEmoji] = useState('');

    useEffect(() => {
        const initializeRoom = async () => {
            setIsLoading(true);
            try {
                const playerId = localStorage.getItem('playerId');
                const playerData = await getPlayerDataFromPlayerId(playerId);
                const roomId = playerData.roomId;
                setRoomId(roomId)
                const roomData = await getRoomDataFromRoomId(roomId);
                const fetchedIsHeadlineWriter = await isHeadlineWriter(playerId);
                setIsUserHeadlineWriter(fetchedIsHeadlineWriter);
                const fetchedHeadlineWriterData = await getPlayerDataFromPlayerId(roomData.headlineWriterId);
                setHeadlineWriterName(fetchedHeadlineWriterData.playerName);
                setTopic(roomData.topic);
                setTopicEmoji(getRandomEmoji(roomData.topic));
                setRoomName(roomData.roomName);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeRoom();
    }, []);

    useEffect(() => {
        if (!roomId) return;

        const roomDocRef = doc(db, 'rooms', roomId);
        const unsubscribe = onSnapshot(roomDocRef, (docSnapshot) => {
            const roomData = docSnapshot.data();
            console.log("Room data: ", roomData);

            if (roomData && roomData.headline) {
                console.log("Navigating to /prompt-answering");
                navigate('/prompt-answering');
                console.log("navigated to prompt page");
            }
        });

        return () => unsubscribe();
    }, [roomId, navigate])

    const handleInputChange = (event) => {
        setHeadline(event.target.value);
    };

    const handleSubmit = async (e) => {
        const playerId = localStorage.getItem('playerId');
        const playerData = await getPlayerDataFromPlayerId(playerId);
        const roomId = playerData.roomId;
        await setRoomHeadline(roomId, headline);
    };

    const handleIdeaRequest = () => {
        const newIdea = getRandomIdea(topic);
        setIdea(newIdea);
    };

    return isLoading ? (
        <div className="flex-center">
            <p className='text-xl'>Setting things up</p>
            <div className="lds-spinner">
                <div></div><div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div><div></div>
                <div></div><div></div>
            </div>
        </div>
    ) : (
        <div>
            <p className='mt-4'>{roomName}</p>
            <p className='mt-2'>Topic: {topicEmoji} {topic}</p>
            <PlayersAndRoles roomId={roomId} />

            {!isUserHeadlineWriter && (
            <div className="flex-center mt-4">
                <p>{headlineWriterName} is writing the headline</p>
                <div className="typing-loader ml-3"></div>
            </div>
            )}

            {isUserHeadlineWriter && (
                <>
                    <p className='mt-2'>You are the headline writer. Write the headline of the big story below.</p>
                    <textarea
                        type="text"
                        placeholder=" "
                        onChange={handleInputChange}
                        className="text-black mt-2"
                    />
                    <br/>
                    <button className='btn btn-primary mt-2' onClick={handleSubmit}>Submit</button>
                    <br/>
                    <button className="mt-6 text-accent" onClick={handleIdeaRequest}>💡 Want an idea?</button>
                    {idea && <p className='mt-2'>Idea: {idea}</p>}
                </>
            )}
        </div>
    );
}
