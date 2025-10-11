import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isRoomJoinable, isRoomPasswordCorrect, getRoomDataFromRoomId } from '../utils/room-utils.js';
import { getPlayerDataFromPlayerId } from '../utils/player-utils.js';
import axios from '../config/axios';
import { REGION, PROJECT_ID } from '../config/firebase.js';
import { DEFAULT_GAME_TYPE, getGameOptionById, normalizeGameType } from '../constants/gameTypes';

export default function JoinRoomPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isJoinable, setIsJoinable] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [error, setError] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [gameType, setGameType] = useState(() => normalizeGameType(location.state?.gameType || DEFAULT_GAME_TYPE));
    const [formData, setFormData] = useState({
        playerName: '',
        password: ''
    });

    const roomId = location.state ? location.state.roomIdToJoin : undefined;
    const playerId = localStorage.getItem('playerId') ? localStorage.getItem('playerId') : undefined;

    const fallbackGameOption = getGameOptionById(DEFAULT_GAME_TYPE);
    const gameOption = getGameOptionById(gameType);
    const gameLabel = gameOption ? gameOption.title : (fallbackGameOption ? fallbackGameOption.title : 'Broadcast');

    useEffect(() => {
        const initializePage = async () => {
            if (!roomId) {
                setError('Room not found');
                setIsJoinable(false);
                return;
            }

            const roomData = await getRoomDataFromRoomId(roomId);
            if (!roomData) {
                setError('Unable to find this room');
                setIsJoinable(false);
                return;
            }

            setIsJoinable(roomData.isJoinable !== false);
            setRoomName(roomData.roomName || '');
            const resolvedGameType = normalizeGameType(roomData.gameType);
            setGameType(resolvedGameType);

            if (playerId) {
                const playerData = await getPlayerDataFromPlayerId(playerId);
                if (playerData.roomId === roomId) {
                    navigate('/waiting-room');
                }
            }
        };
        initializePage();
    }, [roomId, navigate, playerId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('gameType', gameType);
        }
    }, [gameType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roomId) {
            setError('Room not found');
            return;
        }
        setIsJoining(true);
        const fetchedIsRoomPasswordCorrect = await isRoomPasswordCorrect(roomId, formData.password);
        const fetchedIsRoomAvailableToJoin = await isRoomJoinable(roomId);
        if (!fetchedIsRoomPasswordCorrect) {
            setError('Wrong password');
            setIsJoining(false);
            return;
        }
        if (!fetchedIsRoomAvailableToJoin) {
            setError('You can no longer join this room');
            setIsJoining(false);
            return;
        }
        try {
            const playerResponse = await axios.post(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/savePlayerToDb`, {
                playerName: formData.playerName,
                roomId: roomId
            });

            const playerResult = playerResponse.data

            if (playerResult.success) {
                localStorage.setItem('playerId', playerResult.playerId);
                localStorage.setItem('gameType', gameType);
                navigate('/waiting-room');
            } else {
                setError(playerResult.message);
                setIsJoining(false);
            }
        } catch (error) {
            setError('Failed saving player to database');
            setIsJoining(false);
        }
    };

    return !isJoinable ? (
        <div className='grid grid-cols-1 justify-items-center mt-8'>
            <img src='/error.png' alt='tv error' className='rounded-lg' />
            <p className='mt-3 text-lg font-semibold text-white'>{roomName}</p>
            <p className='text-sm text-white opacity-80'>{gameLabel} Game</p>
            <p className='mt-2 text-white'>This room has started the game and is no longer joinable</p>
        </div>
    ) : (
        <form className='container-inner w-11/12 sm:w-1/3 mx-auto mt-6 text-black' onSubmit={handleSubmit}>
            <h3 className='mt-1 text-white'>Joining {roomName}</h3>
            <p className='mt-1 text-sm text-white opacity-80'>{gameLabel} Game</p>
            {error && <p className='text-red-500'>{error}</p>}
            <div>
                <input
                    className='input w-full mt-1'
                    type='text'
                    name='playerName'
                    value={formData.playerName}
                    onChange={handleChange}
                    placeholder='Your Name'
                    required
                />
            </div>
            <div>
                <input
                    className='input w-full mt-2'
                    type='password'
                    name='password'
                    value={formData.password}
                    onChange={handleChange}
                    placeholder='Room Password'
                    required
                />
            </div>
            <button 
                className='btn btn-accent btn-tall w-full mt-2' 
                type='submit'
                disabled={isJoining}
            >
                Join Room
            </button>
        </form>
    );
}
