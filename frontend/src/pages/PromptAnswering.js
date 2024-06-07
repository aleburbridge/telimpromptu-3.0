import React, { useEffect, useState } from 'react';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { getAvailablePromptsForPlayer, getRoomIdFromPlayerId } from '../utils/player-utils';
import { getRoomDataFromRoomId } from '../utils/room-utils';
import PlayersAndRoles from '../components/PlayersAndRoles';
import { replacePlaceholdersInPrompts } from '../utils/scripts-utils';

export default function PromptAnswering() {
    const [prompts, setPrompts] = useState([]);
    const [responses, setResponses] = useState({});
    const [roomId, setRoomId] = useState('');
    const [headline, setHeadline] = useState('');
    const [playerId, setPlayerId] = useState(localStorage.getItem('playerId'));
    const navigate = useNavigate();

    useEffect(() => {
        const initializeRoom = async () => {
            const roomId = await getRoomIdFromPlayerId(playerId);
            setRoomId(roomId);
            const roomData = await getRoomDataFromRoomId(roomId);
            setHeadline(roomData.headline);
        };

        let unsubscribe;

        async function setupListener() {
            const roomId = await getRoomIdFromPlayerId(playerId);

            if (roomId) {
                const roomDocRef = doc(db, 'rooms', roomId);
                unsubscribe = onSnapshot(roomDocRef, async (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const fetchedPrompts = await getAvailablePromptsForPlayer(playerId);
                        const prefilledPrompts = await replacePlaceholdersInPrompts(fetchedPrompts, roomId);
                        setPrompts(prefilledPrompts);
                    }
                });
            }
        }

        initializeRoom();
        setupListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [playerId]);

    const handleInputChange = (promptId, value) => {
        setResponses(prev => ({ ...prev, [promptId]: value }));
    };

    const handleSubmit = async (promptId) => {
        const roomId = await getRoomIdFromPlayerId(playerId);

        if (roomId && responses[promptId]) {
            try {
                const roomDocRef = doc(db, 'rooms', roomId);
                await updateDoc(roomDocRef, {
                    [`responses.${promptId}`]: responses[promptId]
                });

                setPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== promptId));

                const roomData = await getRoomDataFromRoomId(roomId);

                const allPrompts = roomData.players.flatMap(playerId => {
                    const playerData = roomData.playersData[playerId];
                    return playerData ? playerData.prompts : [];
                });

                const allPromptsAnswered = allPrompts.every(promptId => roomData.responses && roomData.responses[promptId]);
                
                if (allPromptsAnswered) {
                    navigate('/teleprompter');
                }
            } catch (error) {
                console.error('Error submitting response:', error);
            }
        }
    };

    return (
        <>
            <PlayersAndRoles roomId={roomId} />
            <br />
            <p className='font-bold'>Headline: {headline}</p>
            <div className="flex justify-center items-center">
                <div className="w-full max-w-2xl p-4">
                    {prompts.length === 0 ? (
                                <div className="flex-center mt-4">
                                <p>Hold tight! Waiting on other players to submit answers</p>
                                <div className="typing-loader ml-3"></div>
                            </div>
                    ) : (
                        prompts.map((prompt, index) => (
                            <div className='flex flex-col items-center mt-6' key={index}>
                                <p>{prompt.description}</p>
                                <div className="w-full">
                                    <textarea
                                        type="text"
                                        placeholder=" "
                                        value={responses[prompt.id] || ''}
                                        onChange={(e) => handleInputChange(prompt.id, e.target.value)}
                                        className="text-black w-full md:w-1/2"
                                    ></textarea>
                                    <br />
                                    <button className='btn btn-accent btn-tall mt-1 w-full md:w-1/2' onClick={() => handleSubmit(prompt.id)}>Submit</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
