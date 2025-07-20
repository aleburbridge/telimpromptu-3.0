import { query, where, doc, getDocs, getDocFromServer, updateDoc, serverTimestamp } from 'firebase/firestore';
import { playerCollectionRef } from '../config/firebase';
import { getRoomDataFromRoomId } from './room-utils';
import axios from '../config/axios';
import { PROJECT_ID, REGION } from '../config/firebase';


export async function getPlayerDataFromPlayerId(playerId) {
    try {
        const docRef = doc(playerCollectionRef, playerId);
        const docSnapshot = await getDocFromServer(docRef);
        return {
            id: docSnapshot.id,
            ...docSnapshot.data()
        };
    } catch (error) {
        console.error('Error getting player data from player ID:', error);
        return null;
    }
}

export async function getPlayerNameFromPlayerId(playerId) {
    try {
        const data = await getPlayerDataFromPlayerId(playerId);
        return data.playerName
    } catch (error) {
        console.error('Error getting name', error)
    }
}

export async function getRoomIdFromPlayerId(playerId) {
    try {
        const data = await getPlayerDataFromPlayerId(playerId);
        return data.roomId;
    } catch (error) {
        console.error(`Could not get room id from player id: ${playerId}`)
    }
}

export async function isAllTopicVotesIn(roomId) {
    const q = query(playerCollectionRef, where('roomId', '==', roomId), where('topicVote', '==', null));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

export async function setPromptAssignments(playerId, promptIds) {
    try {
        const docRef = playerCollectionRef.doc(playerId);
        await updateDoc(docRef, {prompts: promptIds})
        return { success: true }
    } catch (error) {
        console.error("Error adding field to document: ", error);
        return { success: false }
    }
}

export async function playerSendHeartBeat(playerId) {
    const playerRef = doc(playerCollectionRef, playerId);
    const timestamp = serverTimestamp();

    try {
        await updateDoc(playerRef, {lastActive: timestamp});
    } catch (error) {
        console.error(error);
    }
}

export async function removePlayerFromRoom(playerId) {
    // TODO: implement this
    // TODO: check if the last player is leaving the room. If so, delete the room.
    const playerRef = doc(playerCollectionRef, playerId);
    //const docSnapshot = await getDoc(playerRef);

    try {
        await updateDoc(playerRef, { roomId: null});
    } catch(error) {
        console.error(error);
    }
}

export async function isPlayerNameAvailable(playerName, roomId) {
    try {
        const q = query(playerCollectionRef, where('roomId', '==', roomId));
        const querySnapshot = await getDocs(q);
        const isAvailable = !querySnapshot.docs.some(doc =>
            doc.data().playerName.toLowerCase() === playerName.toLowerCase());
        return isAvailable;
    } catch (error) {
        console.error('Error checking player name availability: ', error);
        return false;
    }
}

export async function getListOfPlayersFromRoomId(roomId) {
    const q = query(playerCollectionRef, where('roomId', '==', roomId));
    try {
        const querySnapshot = await getDocs(q);
        const players = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return players;
    } catch (error) {
        console.error('Error fetching players fr:', error);
        throw error
    }
}

export async function isHeadlineWriter(playerId) {
    try {
        const roomId = await getRoomIdFromPlayerId(playerId);
        const roomData = await getRoomDataFromRoomId(roomId);
        return roomData.headlineWriterId === playerId
    } catch (error) {
        console.error('Error in checking headline writer:', error);
        return false;
    }
}

export async function setPlayerPromptAssignments(playerId, promptIds) {
    try {
        const docRef = doc(playerCollectionRef, playerId);
        await updateDoc(docRef, {prompts: promptIds});
        return { success: true };
    } catch (error) {
        console.error("Error adding value to map field: ", error);
        return { success: false };
    }
}

export async function getAvailablePromptsForPlayer(playerId) {
    console.log('🔍 [getAvailablePromptsForPlayer] Called for playerId:', playerId);
    const response = await axios.get(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getSegments`);
    let segments = []
    if (response.data) {
        segments = (response.data);
    }
    console.log('🔍 [getAvailablePromptsForPlayer] Got segments:', segments.length);
    try {
        const playerData = await getPlayerDataFromPlayerId(playerId);
        console.log('🔍 [getAvailablePromptsForPlayer] Player data:', playerData);
        const roomId = await getRoomIdFromPlayerId(playerId);
        const roomData = await getRoomDataFromRoomId(roomId);
        console.log('🔍 [getAvailablePromptsForPlayer] Room data:', roomData);
        
        // Return empty array if script building hasn't completed yet
        if (!roomData.segmentIds) {
            console.log('🔍 [getAvailablePromptsForPlayer] No segmentIds in room data');
            return [];
        }
        
        const promptIds = playerData.prompts || [];
        console.log('🔍 [getAvailablePromptsForPlayer] Player prompt IDs:', promptIds);
        
        // Return empty array if no prompts assigned to player yet
        if (promptIds.length === 0) {
            console.log('🔍 [getAvailablePromptsForPlayer] Player has no prompt assignments');
            return [];
        }
        
        const allPrompts = segments.filter(s => roomData.segmentIds.includes(s.id)).reduce((acc, segment) => [...acc, ...segment.prompts.map(p => getAllPrompts(p)).flat()], []);
        console.log('🔍 [getAvailablePromptsForPlayer] All prompts from segments:', allPrompts);
        // Filter out prompts that have already been responded to
        const answeredPrompts = roomData.responses || {};
        console.log('🔍 [getAvailablePromptsForPlayer] Answered prompts:', answeredPrompts);

        const availablePrompts = allPrompts.filter(prompt => {
            if (!promptIds.includes(prompt.id)) return false;
            
            // Check if the prompt has already been responded to
            if (answeredPrompts[prompt.id]) return false;

            // Check for dependencies in the description ({!... })
            const dependencyMatches = prompt.description.match(/\{!(.*?)\}/g);
            if (!dependencyMatches) return true;
            
            return dependencyMatches.every(dependency => {
                const dependentPromptId = dependency.replace(/[{}!]/g, '');
                return answeredPrompts[dependentPromptId];
            });
        });
        console.log('🔍 [getAvailablePromptsForPlayer] Available prompts:', availablePrompts);
        return availablePrompts;
    } catch (error) {
        console.error('Error fetching available prompts for player:', error);
        return [];
    }
}

function getAllPrompts(prompt) {
    if (prompt.subPrompts) {
        return prompt.subPrompts;
    }
    return prompt;
}