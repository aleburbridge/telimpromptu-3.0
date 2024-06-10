import React, { useEffect, useState, useCallback } from 'react';
import { onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { getAvailablePromptsForPlayer, getRoomIdFromPlayerId, getPlayerDataFromPlayerId } from '../utils/player-utils';
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
    const refreshShit = {};

    useEffect(() => {
        const initializeRoom = async () => {
            const roomId = await getRoomIdFromPlayerId(playerId);
            setRoomId(roomId);
            const roomData = await getRoomDataFromRoomId(roomId);
            setHeadline(roomData.headline);
        };

        initializeRoom();
    }, [playerId]);

    useEffect(() => {
        if (!roomId) return;

        const roomDocRef = doc(db, 'rooms', roomId);
        let previousPromptIds = new Set();

        const unsubscribe = onSnapshot(roomDocRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
                const fetchedPrompts = await getAvailablePromptsForPlayer(playerId);
                const prefilledPrompts = await replacePlaceholdersInPrompts(fetchedPrompts, roomId);

                const newPrompts = prefilledPrompts.filter(p => !previousPromptIds.has(p.id));

                if (newPrompts.length > 0) {
                    setPrompts(prevPrompts => [...prevPrompts, ...newPrompts]);
                    previousPromptIds = new Set([...previousPromptIds, ...newPrompts.map(p => p.id)]);
                }

                const roomData = await getRoomDataFromRoomId(roomId);
                const allPlayerDataPromises = roomData.players.map(playerId => getPlayerDataFromPlayerId(playerId));
                const allPlayerData = await Promise.all(allPlayerDataPromises);
                const allPrompts = allPlayerData.flatMap(playerData => playerData ? playerData.prompts : []);
                const allPromptsAnswered = allPrompts.every(promptId => roomData.responses && roomData.responses[promptId]);

                // TODO: this is a shitty cheat. We expect there to be at least 1 prompt, so if there's not, then
                // do not navigate to the teleprompter just yet.
                const isPromptsLoaded = allPrompts.length > 0;
                if (allPromptsAnswered && isPromptsLoaded) {
                    navigate('/teleprompter');
                }
            }
        });

        return () => unsubscribe();
    }, [roomId, playerId, navigate]);

    const handleInputChange = useCallback((promptId, value) => {
        setResponses(prev => ({ ...prev, [promptId]: value }));
    }, []);

    const handleSubmit = async (promptId, e) => {
        e.preventDefault();
        const roomId = await getRoomIdFromPlayerId(playerId);

        if (roomId && responses[promptId]) {
            try {
                const roomDocRef = doc(db, 'rooms', roomId);
                await updateDoc(roomDocRef, {
                    [`responses.${promptId}`]: responses[promptId]
                });
                
                //remove answered prompt
                setPrompts(prevPrompts => prevPrompts.filter(prompt => prompt.id !== promptId));
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
                        prompts.map((prompt, index) => {
                            // cache the prompt ID so if the page refreshes we remember what it is and the contents
                            if (!refreshShit[prompt.id]) {
                                refreshShit[prompt.id] = (<div className='flex flex-col items-center mt-6' key={prompt.id}>
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
                                        <button className='btn btn-accent btn-tall mt-1 w-full md:w-1/2' onClick={(e) => handleSubmit(prompt.id, e)}>Submit</button>
                                    </div>
                                </div>);
                            }
                            return refreshShit[prompt.id];
                        })
                    )}
                </div>
            </div>
        </>
    );
}
