import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { savePlayerToDb } from '../utils/player-utils.js';
import { generateSlug } from 'random-word-slugs';
import { REGION, PROJECT_ID } from '../config/firebase.js';

export default function CreateRoomForm() {
    const navigate = useNavigate();
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [initialRoomName, setInitialRoomName] = useState('');

    useEffect(() => {
        let wordSlug = generateSlug(2, { format: 'title' });

        if (wordSlug.endsWith('y')) {
            wordSlug = wordSlug.slice(0, -1) + 'ies';
        } else {
            wordSlug = wordSlug + 's';
        }

        setInitialRoomName(wordSlug);
    }, []);

    const handleSubmit = async (e) => {
        setIsLoading(true);
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData);
    
        try {
            const response = await axios.post(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/saveRoomToDb`, {
                roomName: payload.roomName,
                password: payload.password
            });
    
            const roomResult = response.data;
    
            if (roomResult.success) {
                const playerResult = await savePlayerToDb(payload.playerName, roomResult.roomId);
                localStorage.setItem('playerId', playerResult.playerId);
                navigate('/waiting-room');
            } else {
                setError(roomResult.message || 'Could not create room. Please try again.');
                setIsLoading(false);
            }
        } catch (e) {
            setError('Error creating room. Check console for details.');
            console.error('Error creating room: ', e);
            setIsLoading(false);
        }
    };


    return (
        <form className='container-inner mx-auto' onSubmit={handleSubmit}>
            {error && <p className='text-red-500'>{error}</p>}
            <div>
                <input
                    className='input w-full mt-1'
                    type='text'
                    name='playerName'
                    placeholder='Your Name'
                    required
                />
            </div>
            <div>
                <input
                    className='input w-full mt-2 text-black'
                    type='text'
                    name='roomName'
                    defaultValue={initialRoomName}
                    placeholder='Room Name'
                    required
                />
            </div>
            <div>
                <input
                    className='input w-full mt-2'
                    type='password'
                    name='password'
                    placeholder='Room Password'
                    required
                />
            </div>
            <button
                className='btn btn-accent btn-tall w-full mt-2 mb-6 flex items-center justify-center'
                type='submit'
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        Creating room
                        <div className="flex items-center ml-2">
                            <div className="lds-spinner">
                                <div></div><div></div><div></div><div></div><div></div>
                                <div></div><div></div><div></div><div></div><div></div>
                                <div></div><div></div>
                            </div>
                        </div>
                    </>
                ) : "Create Room"}
            </button>
        </form>
    );
}
