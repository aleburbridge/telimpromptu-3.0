import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { REGION, PROJECT_ID } from '../config/firebase';

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}

export default function PlayersAndRoles({ roomId }) {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (roomId === null || roomId === "") {
            return
        }

        const fetchPlayers = async () => {
            try {
                const response = await axios.get(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getPlayersInRoom`, {
                    params: { "roomId": roomId },
                });
                if (response.data) {
                    setPlayers(response.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching players: ", error);
                setIsLoading(false);
                return
            }
        };

        fetchPlayers();
    }, [roomId]);

    return (
        <div className='bg-[rgb(52,52,92)] p-2.5 rounded-md overflow-y-auto mt-2 inline-block'>
            {
            isLoading ?         
            <div className="flex-center">
            <div className="lds-spinner">
                <div></div><div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div><div></div>
                <div></div><div></div>
            </div>
            </div> 
            :             
            <ul>
                {players.map(player => (
                    <li key={player.id}><span className='font-bold'>{capitalize(player.role) || ''}:</span> {player.playerName}</li>
                ))}
            </ul>
            }
        </div>
    );
}