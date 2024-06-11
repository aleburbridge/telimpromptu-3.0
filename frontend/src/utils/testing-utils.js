import { doc, updateDoc } from 'firebase/firestore';
import { roomsCollectionRef } from '../config/firebase';
import { saveRoomToDb } from './room-utils';
import { savePlayerToDb } from './player-utils';
import { assignHostToRoom } from './room-utils';

export async function setupTestEnvironment() {
    try {
        // create room
        const roomResponse = await saveRoomToDb(`Test Room ${Math.floor(Math.random() * (999 - 100 + 1) + 100)}`, 'dog');
        const roomId = roomResponse.roomId;

        // save players
        const result = await savePlayerToDb('Bob', roomId)
        localStorage.setItem('playerId', result.playerId);
        await assignHostToRoom(roomId, localStorage.getItem('playerId'));
        await savePlayerToDb('Joe', roomId)
        await savePlayerToDb('Prospero', roomId)

        // assign headline writer
        // await randomlyAssignHeadlineWriter(roomId)
        const roomDocRef = doc(roomsCollectionRef, roomId);
        await updateDoc(roomDocRef, {
            topic: 'sports',
            isJoinable: false,
            headlineWriterId: result.playerId,
            hostPlayerId: result.playerId
        });

    } catch (error) {
        console.error("Error setting up testing environment: ", error)
    }
}
