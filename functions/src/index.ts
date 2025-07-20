import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import cors from "cors";
import axios from "axios";
import { segments } from "./segments";
import {
  Segment,
  ScriptLine,
  Player,
  Script,
  Prompt,
  PromptObject,
  RoomData,
} from "./types";
import { roleToLastNameList } from "./role-to-lastname";

const REGION = "us-central1";
const PROJECT_ID = "telimpromptu-backend";

admin.initializeApp();
const firestore = admin.firestore();
const playersCollectionRef = firestore.collection("players");
const roomsCollectionRef = firestore.collection("rooms");

const corsHandler = cors({ origin: true });

function containsAny(set: Set<string>, array: string[]): boolean {
  for (const item of array) {
    if (set.has(item)) {
      return true;
    }
  }
  return false;
}

export const getSegments = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      return res.status(200).send(segments);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send({ success: false, message: "Error getting segments" });
    }
  });
});

// ----------------- Player FUNCTIONS -------------------
async function isPlayerNameAvailable(
  playerName: string,
  roomId: string,
): Promise<boolean> {
  const querySnapshot = await playersCollectionRef
    .where("playerName", "==", playerName)
    .where("roomId", "==", roomId)
    .get();
  return querySnapshot.empty;
}

export const savePlayerToDb = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { playerName, roomId } = req.body;

      if (!playerName || !roomId) {
        return res
          .status(400)
          .send({
            success: false,
            message: "playerName and roomId are required",
          });
      }

      const available = await isPlayerNameAvailable(playerName, roomId);
      if (available) {
        const docRef = await playersCollectionRef.add({
          playerName: playerName,
          roomId: roomId,
          isReady: false,
          role: null,
          topicVote: null,
          prompts: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastActive: admin.firestore.FieldValue.serverTimestamp(),
        });

        const roomDocRef = roomsCollectionRef.doc(roomId);
        await roomDocRef.update({
          players: admin.firestore.FieldValue.arrayUnion(docRef.id),
        });

        return res.status(200).send({ success: true, playerId: docRef.id });
      } else {
        return res.status(409).send({ success: false, message: "Name taken" });
      }
    } catch (error) {
      console.error("Error in player creation process: ", error);
      return res
        .status(500)
        .send({
          success: false,
          message: "Failed to create player due to an error.",
        });
    }
  });
});

// ----------------- ROOM FUNCTIONS -------------------

const isRoomNameAvailable = async (roomName: string): Promise<boolean> => {
  const q = roomsCollectionRef.where(
    "roomNameLower",
    "==",
    roomName.toLowerCase(),
  );
  const docSnapshot = await q.get();
  return docSnapshot.empty;
};

export const getRoomDataFromRoomId = async (roomId: string) => {
  try {
    const docRef = roomsCollectionRef.doc(roomId);
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      return { id: docSnapshot.id, ...docSnapshot.data() } as RoomData;
    } else {
      console.error("Room not found:", roomId);
      return null;
    }
  } catch (error) {
    // CHRIS - i think standard practice is to re-throw the error
    console.error("Error getting room data from room ID:", error);
    return null;
  }
};

export const saveRoomToDb = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { roomName, password } = req.body;

      if (!roomName || !password) {
        return res
          .status(400)
          .send({
            success: false,
            message: "roomName and password are required",
          });
      }

      const available = await isRoomNameAvailable(roomName);
      if (!available) {
        return res
          .status(400)
          .send({ success: false, message: "Room name taken" });
      }

      const docRef = await roomsCollectionRef.add({
        roomName: roomName,
        roomNameLower: roomName.toLowerCase(),
        password: password,
        players: [],
        rolesAssigned: false,
        segmentIds: null,
        responses: [],
        headlineWriterId: null,
        headline: null,
        isJoinable: true,
        topic: null,
        teleprompterSpeed: 2,
        currentPage: null,
        gamesPlayed: 0,
        createdAt: new Date(),
      });

      return res.status(200).send({ success: true, roomId: docRef.id });
    } catch (error) {
      console.error("Could not save room", error);
      return res
        .status(500)
        .send({ success: false, message: "Error saving room to database" });
    }
  });
});

export const getPlayersInRoom = functions.https.onRequest((req, res) => {
  // returns list of player objects
  corsHandler(req, res, async () => {
    try {
      const { roomId } = req.query;

      if (!roomId) {
        return res
          .status(400)
          .send({ success: false, message: "roomId is required" });
      }

      const roomPlayersQuery = playersCollectionRef.where(
        "roomId",
        "==",
        roomId,
      );
      const querySnapshot = await roomPlayersQuery.get();
      const players = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).send(players);
    } catch (error) {
      console.error(`Error getting players from room`, error);
      return res
        .status(500)
        .send({ success: false, message: "Error getting players from room" });
    }
  });
});

export const setScriptSegmentsInRoom = async (
  roomId: string,
  segments: string[],
) => {
  try {
    const docRef = roomsCollectionRef.doc(roomId);
    await docRef.update({ segmentIds: segments });
    return { success: true };
  } catch (error) {
    console.error("Error adding value to map field: ", error);
    return { success: false };
  }
};

export async function getRolesInRoom(roomId: string) {
  let roles = [];
  try {
    const response = await axios.get(
      `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getPlayersInRoom`,
      {
        params: { roomId },
      },
    );
    const players = response.data;
    for (const player of players) {
      roles.push(player.role);
    }
  } catch (error) {
    console.error(`Error getting players from room ID ${roomId}:`, error);
  }
  return roles;
}

// ---------- GAME FUNCTIONS ---------------

enum Topics {
  Any = "any",
  Sports = "sports",
  Politics = "politics",
  Crime = "crime",
  Other = "any",
}

const topicToRolesMap = new Map<string, string[]>([
  [
    Topics.Any.toLowerCase(),
    [
      "fieldreporter",
      "guestexpert",
      "mother",
      "witness",
      "viewer",
      "bystander",
      "expert",
    ],
  ],
  [
    Topics.Sports.toLowerCase(),
    [
      "player",
      "coach",
      "fan",
      "analyst",
      "referee",
      "commentator",
      "sportscaster",
      "athlete",
    ],
  ],
  [
    Topics.Politics.toLowerCase(),
    [
      "politician",
      "politicalcorrespondent",
      "campaignstrategist",
      "voter",
      "pundit",
      "advisor",
      "lobbyist",
    ],
  ],
  [
    Topics.Crime.toLowerCase(),
    [
      "criminal",
      "detective",
      "witness",
      "criminologist",
      "guestexpert",
      "prosecutor",
      "defense",
      "victim",
    ],
  ],
]);

// checks if all topics are in then tallies the votes when they are
export const onTopicVoteSubmitted = functions.firestore
  .document("players/{playerId}")
  .onUpdate(async (change, context) => {
    const playerId = context.params.playerId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    console.log('🔍 [onTopicVoteSubmitted] Player', playerId, 'vote changed from', beforeData.topicVote, 'to', afterData.topicVote);

    const topicVotedOn = beforeData.topicVote !== afterData.topicVote;
    if (!topicVotedOn) {
      return null;
    }

    const isNewData = beforeData.topicVote !== afterData.topicVote;
    if (isNewData) {
      try {
        const roomId = afterData.roomId;
        console.log('🔍 [onTopicVoteSubmitted] Checking votes for roomId:', roomId);
        const roomDoc = await roomsCollectionRef.doc(roomId).get();
        if (!roomDoc.exists) {
          throw new Error(`Room with ID ${roomId} does not exist`);
        }

        const roomData = roomDoc.data();
        if (roomData) {
          const playerIds = roomData.players || [];
          console.log('🔍 [onTopicVoteSubmitted] PlayerIds in room:', playerIds);
          
          // Get actual player data to check topic votes
          const playerDocsQuery = playersCollectionRef.where("roomId", "==", roomId);
          const playerSnapshot = await playerDocsQuery.get();
          const players = playerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as (Player & { id: string })[];
          console.log('🔍 [onTopicVoteSubmitted] All players and their votes:', players.map(p => ({ id: p.id, name: p.playerName, vote: p.topicVote })));
          
          const isAllVotesIn = players.every(
            (player: any) => player.topicVote !== null,
          );
          console.log('🔍 [onTopicVoteSubmitted] All votes in?', isAllVotesIn);

          if (!isAllVotesIn) {
            return null;
          }

          console.log('🔍 [onTopicVoteSubmitted] Tallying votes');
          await tallyVotes(roomId);
        }
      } catch (error) {
        console.error("🔍 [onTopicVoteSubmitted] Error checking if all votes are in:", error);
        throw error;
      }
    }

    return null;
  });

async function tallyVotes(roomId: string) {
  try {
    console.log('🔍 [tallyVotes] Starting vote tally for roomId:', roomId);
    const roomPlayersQuery = playersCollectionRef.where("roomId", "==", roomId);
    const querySnapshot = await roomPlayersQuery.get();
    const topicVotes: string[] = [];

    querySnapshot.docs.forEach((doc) => {
      const player = doc.data() as Player;
      console.log('���� [tallyVotes] Player', player.playerName, 'voted for:', player.topicVote);
      topicVotes.push(player.topicVote);
    });

    console.log('🔍 [tallyVotes] All votes:', topicVotes);

    for (let i = topicVotes.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [topicVotes[i], topicVotes[randomIndex]] = [
        topicVotes[randomIndex],
        topicVotes[i],
      ];
    }

    let topicToAssign = "other";

    if (topicVotes.length === 0) {
      console.log('🔍 [tallyVotes] No votes found, assigning default topic:', topicToAssign);
      await setRoomTopic(roomId, topicToAssign);
      return;
    }

    topicToAssign = topicVotes[Math.floor(Math.random() * topicVotes.length)];
    console.log('🔍 [tallyVotes] Selected topic:', topicToAssign);

    await setRoomTopic(roomId, topicToAssign);
  } catch (error) {
    console.error('🔍 [tallyVotes] Error:', error);
    throw new Error("Error tallying topic votes");
  }
}

async function setRoomTopic(roomId: string, topic: string): Promise<void> {
  try {
    console.log('🔍 [setRoomTopic] Setting topic', topic, 'for roomId:', roomId);
    const roomDocRef = roomsCollectionRef.doc(roomId);
    await roomDocRef.update({ topic: topic });
    console.log('🔍 [setRoomTopic] Successfully set topic:', topic);
  } catch (error) {
    console.error("🔍 [setRoomTopic] Error setting room topic:", error);
  }
}

export async function randomlyAssignHeadlineWriter(roomId: string) {
  if (roomId === null || roomId === "") {
    return { success: false, message: `room does not exist` };
  }

  const roomData = await getRoomDataFromRoomId(roomId);
  let players = [];
  if (roomData && roomData.headlineWriterId && roomData.gamesPlayed < 1) {
    return;
  }

  try {
    if (roomData) {
      players = roomData.players;
      console.log("players are", players);
    }
    const luckyGuy = players[Math.floor(Math.random() * players.length)];
    const roomDocRef = roomsCollectionRef.doc(roomId);
    await roomDocRef.update({ headlineWriterId: luckyGuy });

    return {
      success: true,
      message: `Headline writer assigned as ${luckyGuy.id}`,
    };
  } catch (error) {
    console.error("Error in assigning headline writer:", error);
    return { success: false, message: `Headline writer not assigned` };
  }
}

export const onTopicAssigned = functions.firestore
  .document("rooms/{roomId}")
  .onUpdate(async (change, context) => {
    const roomId = context.params.roomId;
    console.log('🔍 [onTopicAssigned] Triggered for roomId:', roomId);

    const beforeData = change.before.data();
    const afterData = change.after.data();

    const topicChanged = beforeData.topic !== afterData.topic;
    console.log('🔍 [onTopicAssigned] Topic changed?', topicChanged, 'from', beforeData.topic, 'to', afterData.topic);
    if (!topicChanged) {
      return null;
    }

    try {
      console.log('🔍 [onTopicAssigned] Assigning headline writer');
      await randomlyAssignHeadlineWriter(roomId);
      
      console.log('🔍 [onTopicAssigned] Assigning roles');
      await assignRoles(roomId);

      const roomRef = roomsCollectionRef.doc(roomId);
      await roomRef.update({ isAvailableToJoin: false });
      await roomRef.update({ rolesAssigned: true }); // for navigating from topicvotepage to headlinepage

      const roomDoc = await roomsCollectionRef.doc(roomId).get();
      if (!roomDoc.exists) {
        throw new Error(`Room with ID ${roomId} does not exist`);
      }

      const roomData = roomDoc.data();
      if (!roomData) {
        throw new Error(`Room data is missing for room ID ${roomId}`);
      }

      const { topic } = roomData;
      if (!topic) {
        throw new Error(`Topic missing from room data for room ID ${roomId}`);
      }

      console.log('🔍 [onTopicAssigned] Getting roles for topic:', topic);
      const roles = await getRolesInRoom(roomId);
      console.log('🔍 [onTopicAssigned] Roles:', roles);
      if (!roles || roles.length === 0) {
        throw new Error(`Roles are missing or empty for room ID ${roomId}`);
      }
      if (roomData.segments) {
        throw new Error(
          "should not re-generate while segments have already been assigned.",
        );
      }

      console.log('🔍 [onTopicAssigned] Building script');
      const script = await buildScript(roomId, topic, roles);
      console.log('🔍 [onTopicAssigned] Script built with', script.lines.length, 'lines and', script.prompts.length, 'prompts');

      console.log('🔍 [onTopicAssigned] Getting players');
      const response = await axios.get(
        `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/getPlayersInRoom`,
        {
          params: { roomId },
        },
      );

      if (response.status !== 200) {
        throw new Error(`Failed to get players from room ID ${roomId}`);
      }

      const players: Player[] = response.data;
      console.log('🔍 [onTopicAssigned] Got players:', players.length);

      console.log('🔍 [onTopicAssigned] Assigning prompts');
      const assignedPrompts = assignPrompts(
        script.lines,
        script.prompts,
        players,
      );
      console.log('🔍 [onTopicAssigned] Prompts assigned to', assignedPrompts.size, 'players');
      
      for (const [player, assignment] of assignedPrompts.entries()) {
        const playerDocRef = playersCollectionRef.doc(player);
        const promptIds = assignment
          .map((a) => getPrompts(a))
          .flat()
          .map((p) => p.id);
        console.log('🔍 [onTopicAssigned] Updating player', player, 'with', promptIds.length, 'prompts');
        await playerDocRef.update({ prompts: promptIds });
      }
      console.log('🔍 [onTopicAssigned] Successfully completed prompt assignment');
    } catch (error) {
      console.error("🔍 [onTopicAssigned] Error in API calls: ", error);
    }

    return null;
  });

const assignRoles = async (roomId: string) => {
  try {
    const roomData = await getRoomDataFromRoomId(roomId);
    if (!roomData || !roomData.topic) {
      throw new Error("Room data is incomplete or topic is missing");
    }

    const topic = roomData.topic as Topics;
    const specificRoles = topicToRolesMap.get(topic.toLowerCase()) || [];
    const anyRoles = topicToRolesMap.get(Topics.Any.toLowerCase()) || [];
    const rolesSet = new Set([...specificRoles, ...anyRoles]);
    const roles = Array.from(rolesSet);

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[randomIndex]] = [roles[randomIndex], roles[i]];
    }

    const roomPlayersQuery = playersCollectionRef.where("roomId", "==", roomId);
    const querySnapshot = await roomPlayersQuery.get();
    const players: Player[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Player[];

    console.log('🔍 [assignRoles] Assigning roles to', players.length, 'players');
    console.log('🔍 [assignRoles] Available roles:', roles);

    let motherPlayer: Player | null = null;
    let randomPlayerName = "";

        for (const [index, player] of players.entries()) {
      let role = "";
      if (index === 0) {
        role = "host";
      } else if (index === 1) {
        role = "cohost";
      } else {
        // Ensure we cycle through available roles instead of falling back to "viewer"
        if (roles.length > 0) {
          const roleIndex = (index - 2) % roles.length;
          role = roles[roleIndex];
        } else {
          // Emergency fallback if no roles available
          role = "guestexpert";
        }
      }

      console.log('🔍 [assignRoles] Assigning role', role, 'to player', player.playerName, 'at index', index);

      const playerDocRef = playersCollectionRef.doc(player.id);
      const lastName = getRandomLastName(role);

      if (role === "mother") {
        motherPlayer = player;
      }

      try {
        await playerDocRef.update({ role: role, lastName: lastName });
        console.log('🔍 [assignRoles] Successfully updated player', player.playerName, 'with role:', role, 'lastName:', lastName);
      } catch (updateError) {
        console.error('🔍 [assignRoles] Failed to update player', player.playerName, 'with role:', role, 'Error:', updateError);
        throw updateError; // Re-throw to be caught by outer catch
      }
    }

    console.log('🔍 [assignRoles] Successfully assigned roles to all players');

    if (motherPlayer) {
      const otherPlayers = players.filter(
        (player) => player.id !== motherPlayer!.id,
      );
      const randomPlayer =
        otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
      randomPlayerName = randomPlayer ? randomPlayer.playerName : "";

      if (randomPlayerName) {
        const roomDocRef = roomsCollectionRef.doc(roomId);
        await roomDocRef.update({ motherOf: randomPlayerName });
      }
    }
  } catch (error) {
    console.error("Error assigning roles:", error);
  }
};

export default assignRoles;
const getRandomLastName = (role: string) => {
  const roleEntry = roleToLastNameList.find((entry) => entry.role === role);
  if (roleEntry) {
    const lastNames = roleEntry.lastNames;
    return lastNames[Math.floor(Math.random() * lastNames.length)];
  }
  console.warn(`🔍 [getRandomLastName] No last names found for role: ${role}, using fallback`);
  return "Unknown"; // Fallback last name instead of empty string
};

function assignPrompts(
  scriptLines: ScriptLine[],
  promptObjects: PromptObject[],
  players: Player[],
): Map<string, PromptObject[]> {
  const speakerToReferencedVariables =
    mapSpeakersToPromptsReferenced(scriptLines);

  const playerToAssignedPrompts = new Map<string, PromptObject[]>();
  for (const player of players) {
    playerToAssignedPrompts.set(player.id, []);
  }

  for (const promptObject of promptObjects) {
    const prompts = getPrompts(promptObject);
    console.log('🔍 [assignPrompts] Processing prompt object:', promptObject.id || promptObject.groupId);

    let curMinPrompts = Infinity;
    let eligiblePlayerIds: string[] = [];
    for (const player of players) {
      // todo this should error or something
      const playerRole = player.role ?? "";
      const playerId = player.id;
      const promptIds = prompts.map((p) => p.id!);
      const playerSpeaksPromptValue =
        speakerToReferencedVariables[playerRole] &&
        containsAny(speakerToReferencedVariables[playerRole], promptIds);
      const isPlayerEligibleForPrompt = !playerSpeaksPromptValue;
      console.log('🔍 [assignPrompts] Player', player.playerName, '(', playerRole, ') eligible for prompt?', isPlayerEligibleForPrompt, 'speaks prompt?', playerSpeaksPromptValue);
      if (!isPlayerEligibleForPrompt) {
        continue;
      }

      const numPromptsAssignedToPlayer =
        playerToAssignedPrompts.get(playerId)?.length ?? 0;
      if (numPromptsAssignedToPlayer <= curMinPrompts) {
        if (numPromptsAssignedToPlayer < curMinPrompts) {
          curMinPrompts = numPromptsAssignedToPlayer;
          eligiblePlayerIds = [];
        }
        eligiblePlayerIds.push(playerId);
      }
    }

    console.log('🔍 [assignPrompts] Eligible players for prompt:', eligiblePlayerIds);
    if (eligiblePlayerIds.length === 0) {
      console.warn(`No eligible players for prompt ${promptObject.id}, assigning to random player`);
      eligiblePlayerIds = players.map(p => p.id);
    }

    const playerIdToAssign = getRandomElement(eligiblePlayerIds);
    console.log('🔍 [assignPrompts] Assigned prompt to player:', playerIdToAssign);
    const assignedPrompts = playerToAssignedPrompts.get(playerIdToAssign)!;

    if (promptObject.groupId) {
      if (!assignedPrompts.some((p) => p.groupId === promptObject.groupId)) {
        assignedPrompts.push(promptObject);
      }
    } else {
      assignedPrompts.push(promptObject);
    }
  }
  return playerToAssignedPrompts;
}

// ----------- SCRIPT FUNCTIONS -----------------

const segmentTags = {
  introduction: "introduction",
  segment: "segment",
  closing: "closing",
};

const getRandomElement = (array: any[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

const segmentHasTopic = (segment: Segment, topic: string) => {
  return (
    segment.topic === "any" ||
    segment.topic.toLowerCase() === topic.toLowerCase()
  );
};

const segmentContainsOnlyTheseRoles = (segment: Segment, roles: string[]) => {
  const segmentRoles = segment.lines.map((l) => l.speaker.toLowerCase());
  const lowerCaseRoles = roles.map((role) => role.toLowerCase());
  return segmentRoles.every((role) => lowerCaseRoles.includes(role));
};

function generateListOfSegmentIds(
  topic: string,
  maxNumSegments: number,
  roles: string[],
) {
  console.log('🔍 [generateListOfSegmentIds] Building script for topic:', topic, 'with roles:', roles);
  const out: string[] = [];

  // Add introduction segment
  const introSegments = segments.filter(
    (s) =>
      s.tag === segmentTags.introduction &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );
  const chosenIntroSegment = getRandomElement(introSegments);
  out.push(chosenIntroSegment.id);

  // Get all available story segments
  let availableStorySegments = segments.filter(
    (s) =>
      s.tag === segmentTags.segment &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );

  console.log('🔍 [generateListOfSegmentIds] Available story segments:', availableStorySegments.length);

  // Track which roles have been covered and which segments have been used
  const rolesCovered = new Set(['host', 'cohost']); // Host and cohost always have lines
  const usedSegmentIds: string[] = [];

  // Get roles that need segments (excluding host/cohost)
  const rolesNeedingSegments = roles.filter(role =>
    !['host', 'cohost'].includes(role.toLowerCase())
  );

  console.log('🔍 [generateListOfSegmentIds] Roles needing segments:', rolesNeedingSegments);

  // First pass: Ensure every role gets at least one segment
  for (const role of rolesNeedingSegments) {
    if (rolesCovered.has(role)) continue;

    // Find segments that include this role
    const segmentsForRole = availableStorySegments.filter(segment => {
      const segmentRoles = segment.lines.map(l => l.speaker.toLowerCase());
      return segmentRoles.includes(role.toLowerCase()) && !usedSegmentIds.includes(segment.id);
    });

    console.log('🔍 [generateListOfSegmentIds] Segments available for role', role + ':', segmentsForRole.length);

    if (segmentsForRole.length > 0) {
      const chosenSegment = getRandomElement(segmentsForRole);
      out.push(chosenSegment.id);
      usedSegmentIds.push(chosenSegment.id);

            // Mark all roles in this segment as covered
      const segmentRoles = chosenSegment.lines.map((l: any) => l.speaker.toLowerCase());
      segmentRoles.forEach((segmentRole: string) => rolesCovered.add(segmentRole));

      console.log('🔍 [generateListOfSegmentIds] Added segment', chosenSegment.id, 'for role', role);
    } else {
      console.warn('🔍 [generateListOfSegmentIds] No segments found for role:', role);
    }
  }

  // Second pass: Fill remaining slots with random segments
  let remainingSlots = Math.max(0, maxNumSegments - out.length + 1); // +1 because we'll subtract intro later

  while (remainingSlots > 0 && availableStorySegments.length > 0) {
    const unusedSegments = availableStorySegments.filter(
      (s) => !usedSegmentIds.includes(s.id),
    );

    if (unusedSegments.length === 0) {
      // If we've used all available segments, we can reuse them
      break;
    }

    const chosenSegment = getRandomElement(unusedSegments);
    out.push(chosenSegment.id);
    usedSegmentIds.push(chosenSegment.id);
    remainingSlots -= 1;
  }

  // Add closing segment
  const closingSegments = segments.filter(
    (s) =>
      s.tag === segmentTags.closing &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );
  const chosenClosingSegment = getRandomElement(closingSegments);
  out.push(chosenClosingSegment.id);

  console.log('🔍 [generateListOfSegmentIds] Final segment list:', out);
  console.log('🔍 [generateListOfSegmentIds] Roles covered:', Array.from(rolesCovered));

  return out;
}

function aggregateScriptData(segmentIds: string[]): Script {
  const script: Script = { lines: [], prompts: [] };
  for (const segmentId of segmentIds) {
    const eligibleSegments = segments.filter(
      (s) => s.id.toLowerCase() === segmentId.toLowerCase(),
    );
    if (eligibleSegments.length !== 1) {
      throw new Error(`CAN'T BUILD THE SCRIPT, ${segmentId} does not exist`);
    }
    script.lines.push(...eligibleSegments[0].lines);
    script.prompts.push(...eligibleSegments[0].prompts);
  }
  return script;
}

async function buildScript(
  roomId: string,
  topic: string,
  roles: string[],
): Promise<Script> {
  try {
    const scriptSegments = generateListOfSegmentIds(topic, roles.length, roles);
    const setSegmentsResult = await setScriptSegmentsInRoom(
      roomId,
      scriptSegments,
    );
    if (!setSegmentsResult.success) {
      throw new Error("Failed to set script segments");
    }
    return aggregateScriptData(scriptSegments);
  } catch (error) {
    throw new Error(`Error building script: ${error}`);
  }
}

function mapSpeakersToPromptsReferenced(
  scriptLines: ScriptLine[],
): Record<string, Set<string>> {
  const speakerToReferencedVariables: Record<string, Set<string>> = {};
  for (const line of scriptLines) {
    const lineSpeaker = line.speaker;
    if (!(lineSpeaker in speakerToReferencedVariables)) {
      speakerToReferencedVariables[lineSpeaker] = new Set<string>();
    }

    const promptIdsReferenced = getReferencedPrompts(line.content);
    for (const promptId of promptIdsReferenced) {
      speakerToReferencedVariables[lineSpeaker].add(promptId);
    }
  }
  return speakerToReferencedVariables;
}

function getReferencedPrompts(scriptText: string) {
  // match against {!TOKEN}
  const promptIdRegex = /{!([^\s{}]+)}/g;
  const promptIds = [];
  let match;

  // Loop through all matches and extract tokens
  while ((match = promptIdRegex.exec(scriptText)) !== null) {
    promptIds.push(match[1]); // Add the matched token to the tokens array
  }
  return promptIds;
}

function getPrompts(promptObject: PromptObject): Prompt[] {
  // guaranteed every prompt object has subprompts or is itself a prompt
  return promptObject.subPrompts ?? [promptObject];
}
