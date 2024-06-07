import axios from 'axios';
import { query, where, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { roomsCollectionRef, playerCollectionRef, PROJECT_ID, REGION } from '../config/firebase';

// keeping this around for testing
export async function saveRoomToDb(roomName, password) {
    try {
        const response = await axios.post(`https://${REGION}-${PROJECT_ID}.cloudfunctions.net/saveRoomToDb`, {
            roomName,
            password
        });
        return response.data;
    } catch (error) {
        console.error(`Could not save room with name ${roomName}`, error);
        return { success: false, message: 'Error saving room to database' };
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
export async function setRoomTopic(roomId, topic) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    await updateDoc(roomDocRef, {topic: topic});
}

//TODO: REPLACE W API CALL
export async function updateRoomProperty(roomId, propertyName, propertyValue) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    try {
        await updateDoc(roomDocRef, { [propertyName]: propertyValue });
    } catch (error) {
        console.error('Error updating document: ', error);
    }
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

//TODO: REPLACE W API CALL
export async function getRolesInRoom(roomId) {
    let roles = []
    try {
        const players = await getPlayersInRoom(roomId)
        for (const player of players) {
            roles.push(player.role);
        }
        return roles;
    } catch (error) {
        console.error(`Error getting players from room ID ${roomId}:`, error);
        return {}
    }
}

//TODO: REPLACE W API CALL
export async function setScriptSegments(roomId, segments) {
    try {
        const docRef = doc(roomsCollectionRef, roomId);
        await updateDoc(docRef, {
            segmentIds: segments
        });
        console.log(`Value "${segments}" added to map field "segmentIds" in document "${roomId}" successfully.`);
        return { success: true }
    } catch (error) {
        console.error("Error adding value to map field: ", error);
        return { success: false }
    }
}

//TODO: REPLACE W API CALL
export async function addPromptResponse(roomId, promptId, promptResponse) {
    try {
        const docRef = doc(roomsCollectionRef, roomId);
        await updateDoc(docRef, {
            [`responses.${promptId}`]: promptResponse
        });
        console.log(`Value "${promptResponse}" added to map field "responses.${promptId}" in document "${roomId}" successfully.`);
        return { success: true }
    } catch (error) {
        console.error("Error adding value to map field: ", error);
        return { success: false }
    }
}