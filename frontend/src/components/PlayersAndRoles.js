import React, { useState, useEffect } from 'react';
import { onSnapshot, query, where } from 'firebase/firestore';
import { db, playerCollectionRef } from '../config/firebase';

function capitalize(s)
{
    return s && s[0].toUpperCase() + s.slice(1);
}

export default function PlayersAndRoles({ roomId }) {
    const [players, setPlayers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

            useEffect(() => {
        if (!roomId || roomId === null || roomId === "") {
            console.log('🔍 [PlayersAndRoles] No roomId yet, waiting...', roomId);
            return;
        }

        console.log('🔍 [PlayersAndRoles] Setting up real-time listener for roomId:', roomId);
        setIsLoading(true); // Reset loading state when roomId changes

        const playersQuery = query(playerCollectionRef, where('roomId', '==', roomId));

                const unsubscribe = onSnapshot(
            playersQuery,
            (querySnapshot) => {
                console.log('🔍 [PlayersAndRoles] Players updated, count:', querySnapshot.docs.length);
                const playersData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log('🔍 [PlayersAndRoles] Players data:', playersData);
                setPlayers(playersData);
                setIsLoading(false);
            },
            (error) => {
                console.error("🔍 [PlayersAndRoles] Error listening to players:", error);
                setIsLoading(false);

                // Handle specific Firebase errors
                if (error.code === 'unavailable') {
                    console.log('🔍 [PlayersAndRoles] Firestore temporarily unavailable, will retry automatically');
                } else if (error.code === 'permission-denied') {
                    console.error('🔍 [PlayersAndRoles] Permission denied - check Firestore rules');
                } else {
                    console.error('🔍 [PlayersAndRoles] Unknown Firestore error:', error.code, error.message);
                }
            }
        );

        return () => {
            console.log('🔍 [PlayersAndRoles] Cleaning up listener');
            unsubscribe();
        };
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
