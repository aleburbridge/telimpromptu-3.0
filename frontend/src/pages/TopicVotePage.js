import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc, query, where, onSnapshot } from 'firebase/firestore';
import { playerCollectionRef, roomsCollectionRef } from '../config/firebase.js';
import { getRoomIdFromPlayerId, isAllTopicVotesIn } from '../utils/player-utils.js';

export default function TopicVotePage() {
    const [voteSubmitted, setVoteSubmitted] = useState(false);
    const [isSettingUp, setIsSettingUp] = useState(false);
    const [roomId, setRoomId] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const initializeVote = async () => {
            const playerId = localStorage.getItem('playerId');
            const fetchedRoomId = await getRoomIdFromPlayerId(playerId);
            setRoomId(fetchedRoomId);
        };
        initializeVote();
    }, []);

    useEffect(() => {
        if (!roomId) return;

        const q = query(playerCollectionRef, where("roomId", "==", roomId));
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const allVotesIn = await isAllTopicVotesIn(roomId);
            if (allVotesIn) {
                setIsSettingUp(true);

                const roomDocRef = doc(roomsCollectionRef, roomId);
                const unsubscribeRoom = onSnapshot(roomDocRef, (roomDoc) => {
                    const roomData = roomDoc.data();
                    if (roomData && roomData.rolesAssigned) {
                        unsubscribeRoom();
                        navigate('/headline');
                    }
                });

                return () => unsubscribeRoom();
            }
        });

        return () => unsubscribe();
    }, [roomId, navigate]);

    const submitVote = async (vote) => {
        const playerId = localStorage.getItem('playerId');
        if (playerId) {
            const playerDocRef = doc(playerCollectionRef, playerId);
            try {
                await updateDoc(playerDocRef, {
                    topicVote: vote
                });
                setVoteSubmitted(true);
            } catch (error) {
                console.error('Error updating vote:', error);
            }
        } else {
            console.error('No playerId found');
        }
    };

    return isSettingUp ?        
    <div className="flex-center">
        <p className='text-xl'>Setting things up</p>
        <div className="lds-spinner">
            <div></div><div></div><div></div><div></div><div></div>
            <div></div><div></div><div></div><div></div><div></div>
            <div></div><div></div>
        </div>
    </div> : (
        <div className='container container-md'>
               {voteSubmitted && !isSettingUp ? (
                <div className="flex-center">
                    <p className='text-xl'>Waiting for other players</p><div className="typing-loader ml-3"></div>
                </div>
                ) : (
                    <>
                        <p className='text-xl'>Vote on a Story Topic</p>
                        <p className='text-l'>Each vote increases its topic's chance of being randomly selected</p>
                    </>
                )}  
            <div className="flex flex-col space-y-4 sm:w-full md:w-1/2 lg:w-1/3 mx-auto mt-4">
                {['Sports', 'Politics', 'Crime', 'Other'].map(topic => (
                    <button 
                        key={topic}
                        className='btn btn-accent btn-tall w-full'
                        disabled={voteSubmitted}
                        onClick={() => submitVote(topic)}
                    >
                        {topic}
                    </button>
                ))}
            </div>
        </div>
    );
}
