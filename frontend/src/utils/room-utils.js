import axios from 'axios';
import { query, where, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { roomsCollectionRef, playerCollectionRef } from '../config/firebase';

export async function getRoomIdFromRoomName(roomName) {
    const roomQuery = query(roomsCollectionRef, where('roomNameLower', '==', roomName));
    const querySnapshot = await getDocs(roomQuery);
    
    if (!querySnapshot.empty) {
        const roomDoc = querySnapshot.docs[0];
        return roomDoc.id;
    } else {
        return { success: false, message: `Could not find room with name ${roomName}` };
    }
}

//TODO: REPLACE W API CALL
export async function getRoomDataFromRoomId(roomId) {
    try {
        const docRef = doc(roomsCollectionRef, roomId);
        const docSnapshot = await getDoc(docRef);
        return {
            id: docSnapshot.id,
            ...docSnapshot.data()
        };
    } catch (error) {
        console.error('Error getting room data from room ID:', error);
        return null;
    }
}

//TODO: REPLACE W API CALL
export async function assignHostToRoom(roomId, playerId) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    try {
        await updateDoc(roomDocRef, {
            hostPlayerId: playerId
        });
        return { success: true, message: 'Host assigned successfully' };
    } catch (error) {
        console.error(`Could not assign host to room with id ${roomId}}`, error)
        return { success: false, message: 'Could not assign host' }
    }
}

// TODO: Change from passwords to access tokens. Share links to join with token in url
// something like const accessToken = uuidv4(); and const roomLink = `https:/telimpromptu.com/join?token=${accessToken}`;
// then use a useEffect hook to get the url params and authenticate
//TODO: REPLACE W API CALL
export async function isRoomPasswordCorrect(roomId, password) {
    try {
        const data = await getRoomDataFromRoomId(roomId);
        return data.password === password;
    } catch (error) {
        console.error(`Could not check password for room with id ${roomId}}`, error)
        return false;
    }
}

export async function isRoomNameAvailable(roomName) {
    try {
        const response = await axios.get(`https://us-central1-telimpromptu-backend.cloudfunctions.net/isRoomNameAvailable`, {
            params: { roomName }
        });
        return response.data.available;
    } catch (error) {
        console.error(`Could not check availability of room name ${roomName}`, error);
        return false;
    }
}

//TODO: REPLACE W API CALL
export async function getRoomNameById(roomId) {
    try {
        const data = await getRoomDataFromRoomId(roomId);
        return data.roomName;
    } catch (error) {
        console.error(`Could not get room name from room id ${roomId}}`, error)
    }
}

//TODO: REPLACE W API CALL
export async function isRoomJoinable(roomId) {
    try {
        const data = await getRoomDataFromRoomId(roomId);
        return data.isJoinable;
    } catch (error) {
        console.error(`Could not get room join status from room id ${roomId}}`, error)
    }
}

//TODO: REPLACE W API CALL
export async function setIsRoomJoinable(roomId, bool) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    await updateDoc(roomDocRef, { isJoinable: bool });
}

//TODO: REPLACE W API CALL
export async function setRoomHeadline(roomId, headline) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    await updateDoc(roomDocRef, { headline: headline });
}

//TODO: REPLACE W API CALL
export async function getPlayersInRoom(roomId) {
    try {
        const roomPlayersQuery = query(playerCollectionRef, where('roomId', '==', roomId));
        const querySnapshot = await getDocs(roomPlayersQuery);
        const players = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return players;
    } catch (error) {
        console.error(`Error getting players from room ID ${roomId}:`, error);
        return {}
    }
}