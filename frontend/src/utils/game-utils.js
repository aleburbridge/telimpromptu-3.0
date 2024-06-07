import { query, where, doc, getDocs, updateDoc } from 'firebase/firestore';
import { roomsCollectionRef, playerCollectionRef } from '../config/firebase';
import { getPlayersInRoom, getRoomDataFromRoomId, setRoomTopic } from './room-utils';
import { getListOfPlayersFromRoomId } from './player-utils';
import { getTopicToRolesMap } from './role-assignment';

export async function tallyVotes(roomId) {
    const q = query(playerCollectionRef, where('roomId', '==', roomId));
    try {
        const querySnapshot = await getDocs(q);
        const voteCount = {};

        querySnapshot.forEach(doc => {
            const player = doc.data();
            voteCount[player.topicVote] = (voteCount[player.topicVote] || 0) + 1;
        });

        let maxVotes = 0;
        let topicsWithMaxVotes = [];
        for (const topic in voteCount) {
            if (voteCount[topic] > maxVotes) {
                maxVotes = voteCount[topic];
                topicsWithMaxVotes = [topic];
            } else if (voteCount[topic] === maxVotes) {
                topicsWithMaxVotes.push(topic);
            }
        }

        let topicToAssign = ''
        if (topicsWithMaxVotes.length > 1) {
            topicToAssign = topicsWithMaxVotes[Math.floor(Math.random() * topicsWithMaxVotes.length)]
        } else if (topicsWithMaxVotes.length === 1) {
            topicToAssign = topicsWithMaxVotes[0];
        }
        await setRoomTopic(roomId, topicToAssign)
    } catch (error) {
        console.error('Error tallying topic votes: ', error);
        return 'Error tallying votes';
    }
}

export async function startGameFromWaitingRoom(roomId) {
    const roomDocRef = doc(roomsCollectionRef, roomId);
    try {
        await updateDoc(roomDocRef, { isAvailableToJoin: false });
        await randomlyAssignHeadlineWriter(roomId);
        return { success: true };
    } catch (error) {
        console.error('error updating room doc: ' + error)
        return { success: false, errorMessage: error };
    }
}

export async function randomlyAssignHeadlineWriter(roomId) {
    if (roomId === null || roomId === "") {
        return { success: false, message: `room does not exist`}
    }

    const roomData = await getRoomDataFromRoomId(roomId);
    if (roomData && roomData.headlineWriterId && roomData.gamesPlayed < 1) {
        return;
    }

    try {
        const players = await getListOfPlayersFromRoomId(roomId);
        const luckyGuy = players[Math.floor(Math.random() * players.length)];
        const roomDocRef = doc(roomsCollectionRef, roomId);
        await updateDoc(roomDocRef, {
            headlineWriterId: luckyGuy.id,
        });

        return { success: true, message: `Headline writer assigned as ${luckyGuy.id}`}
    } catch (error) {
        console.error('Error in assigning headline writer:', error);
        return { success: false, message: `Headline writer not assigned`}
    }
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export async function assignRoles(roomId) {
    try {
        const roomData = await getRoomDataFromRoomId(roomId);
        if (!roomData || !roomData.topic) {
            console.error('Room data is incomplete or topic is missing:', roomData);
            return; 
        }

        const topic = roomData.topic;
        const topicToRolesMap = getTopicToRolesMap(); 
        const roles = topicToRolesMap.get(topic.toLowerCase()) || []; 

        shuffleArray(roles); 

        const roomPlayersQuery = query(playerCollectionRef, where('roomId', '==', roomId));
        const querySnapshot = await getDocs(roomPlayersQuery);
        const players = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (players.length && players[0].role) {
            return; // Stops reassigning roles on page refresh
        }

        for (const [index, player] of players.entries()) {
            let role = '';
            if (index === 0) {
                role = 'host';
            } else if (index === 1) {
                role = 'cohost';
            } else {
                role = roles[index - 2] || 'viewer';
            }

            const playerDocRef = doc(playerCollectionRef, player.id);
            await updateDoc(playerDocRef, { role: role });
        }
    } catch (error) {
        console.error('Error assigning roles:', error);
    }
}

/*
0: {speaker: 'Host', content: "You're watching Telimpromptu News, I'm your host, {@host} {@hostlastname}."}
1: {speaker: 'Cohost', content: "And I'm {@cohost} {@cohostlastname} 
...
*/
export async function prefillScriptData(roomId, script) {
    const namesMapping = {};
    const players = await getPlayersInRoom(roomId);

    players.forEach(player => {
        namesMapping[player.role] = player.playerName;
    });
    console.log("namesmapping", namesMapping);

    const replacePlaceholders = (content) => {
        if (!content) return content;
        return content.replace(/\{@(\w+)\}/g, (_, role) => {
            return namesMapping[role] || `{@${role}}`;
        });
    };

    script.lines = script.lines.map(line => ({
        ...line,
        content: replacePlaceholders(line.content)
    }));

    // prefilling prompt data actually doesnt matter here bc prompts are saved based on id
    script.prompts = script.prompts.map(prompt => ({
        ...prompt,
        description: replacePlaceholders(prompt.description)
    }));
    console.log('prefilled script:', script)
    return script;
}

export async function replacePlaceholders(content, roomId) {
    const roomData = await getRoomDataFromRoomId(roomId); // Ensure to await this call
    const headline = roomData.headline;
    
    const namesMapping = {};
    const players = await getPlayersInRoom(roomId);

    players.forEach(player => {
        namesMapping[player.role] = player.playerName;
    });

    if (!content) return content;

    content = content.replace(/\{@(\w+)\}/g, (_, role) => {
        return namesMapping[role] || `{@${role}}`;
    });

    return content.replace(/{#headline}/g, headline);
}
