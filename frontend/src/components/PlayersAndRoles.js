import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { REGION, PROJECT_ID } from '../config/firebase';

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}

export default function PlayersAndRoles({ roomId }) {
    const [players, setPlayers] = useState([]);

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
            } catch (error) {
                console.error("Error fetching players: ", error);
                return
            }
        };

        fetchPlayers();
        console.log("fetched players");
    }, [roomId]);

    return (
        <div className='bg-[rgb(52,52,92)] p-2.5 rounded-md overflow-y-auto mt-2 inline-block'>
            <ul>
                {players.map(player => (
                    <li key={player.id}><span className='font-bold'>{capitalize(player.role) || ''}:</span> {player.playerName}</li>
                ))}
            </ul>
        </div>
    );
}