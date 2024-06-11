import { getPlayersInRoom, getRoomDataFromRoomId } from './room-utils';

// Dont delete this one 
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
