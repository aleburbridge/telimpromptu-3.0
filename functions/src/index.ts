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
        return res.status(400).send({
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
      return res.status(500).send({
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
        return res.status(400).send({
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
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const topicVotedOn = beforeData.topicVote !== afterData.topicVote;
    if (!topicVotedOn) {
      return null;
    }

    const isNewData = beforeData.topicVote !== afterData.topicVote;
    if (isNewData) {
      try {
        const roomId = afterData.roomId;
        const roomDoc = await roomsCollectionRef.doc(roomId).get();
        if (!roomDoc.exists) {
          throw new Error(`Room with ID ${roomId} does not exist`);
        }

        const roomData = roomDoc.data();
        if (roomData) {
          const players = roomData.players || [];
          const isAllVotesIn = players.every(
            (player: any) => player.topicVote !== null,
          );

          if (!isAllVotesIn) {
            return null;
          }

          await tallyVotes(roomId);
        }
      } catch (error) {
        console.error("Error checking if all votes are in:", error);
        throw error;
      }
    }

    return null;
  });

async function tallyVotes(roomId: string) {
  try {
    const roomPlayersQuery = playersCollectionRef.where("roomId", "==", roomId);
    const querySnapshot = await roomPlayersQuery.get();
    const topicVotes: string[] = [];

    querySnapshot.docs.forEach((doc) => {
      const player = doc.data() as Player;
      topicVotes.push(player.topicVote);
    });

    for (let i = topicVotes.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [topicVotes[i], topicVotes[randomIndex]] = [
        topicVotes[randomIndex],
        topicVotes[i],
      ];
    }

    let topicToAssign = "other";

    if (topicVotes.length === 0) {
      await setRoomTopic(roomId, topicToAssign);
      return;
    }

    topicToAssign = topicVotes[Math.floor(Math.random() * topicVotes.length)];

    await setRoomTopic(roomId, topicToAssign);
  } catch (error) {
    throw new Error("Error tallying topic votes");
  }
}

async function setRoomTopic(roomId: string, topic: string): Promise<void> {
  try {
    const roomDocRef = roomsCollectionRef.doc(roomId);
    await roomDocRef.update({ topic: topic });
  } catch (error) {
    console.error("Error setting room topic:", error);
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

    const beforeData = change.before.data();
    const afterData = change.after.data();

    const topicChanged = beforeData.topic !== afterData.topic;
    if (!topicChanged) {
      return null;
    }

    try {
      await randomlyAssignHeadlineWriter(roomId);
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

      const roles = await getRolesInRoom(roomId);
      if (!roles || roles.length === 0) {
        throw new Error(`Roles are missing or empty for room ID ${roomId}`);
      }
      if (roomData.segments) {
        throw new Error(
          "should not re-generate while segments have already been assigned.",
        );
      }

      const script = await buildScript(roomId, topic, roles);

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

      const assignedPrompts = assignPrompts(
        script.lines,
        script.prompts,
        players,
      );
      for (const [player, assignment] of assignedPrompts.entries()) {
        const playerDocRef = playersCollectionRef.doc(player);
        const promptIds = assignment
          .map((a) => getPrompts(a))
          .flat()
          .map((p) => p.id);
        await playerDocRef.update({ prompts: promptIds });
      }
    } catch (error) {
      console.error("Error in API calls: ", error);
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

    let motherPlayer: Player | null = null;
    let randomPlayerName = "";

    for (const [index, player] of players.entries()) {
      let role = "";
      if (index === 0) {
        role = "host";
      } else if (index === 1) {
        role = "cohost";
      } else {
        role = roles[index - 2] || "viewer";
      }

      const playerDocRef = playersCollectionRef.doc(player.id);
      const lastName = getRandomLastName(role);

      if (role === "mother") {
        motherPlayer = player;
      }

      await playerDocRef.update({ role: role, lastName: lastName });
    }

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
  return "";
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

  // Get the order of prompts as they appear in the script
  const promptOrderInScript: string[] = [];
  for (const line of scriptLines) {
    const promptIds = getReferencedPrompts(line.content);
    for (const promptId of promptIds) {
      if (!promptOrderInScript.includes(promptId)) {
        promptOrderInScript.push(promptId);
      }
    }
  }

  // Sort promptObjects to match the order they appear in the script
  const sortedPromptObjects = promptObjects.sort((a, b) => {
    const aPrompts = getPrompts(a);
    const bPrompts = getPrompts(b);
    const aFirstPromptId = aPrompts[0]?.id || "";
    const bFirstPromptId = bPrompts[0]?.id || "";

    const aIndex = promptOrderInScript.indexOf(aFirstPromptId);
    const bIndex = promptOrderInScript.indexOf(bFirstPromptId);

    // If not found in script order, put at end
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });

  for (const promptObject of sortedPromptObjects) {
    const prompts = getPrompts(promptObject);

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

    if (eligiblePlayerIds.length === 0) {
      throw new Error(
        `For some reason, couldn't assign prompt ${promptObject.id}`,
      );
    }

    const playerIdToAssign = getRandomElement(eligiblePlayerIds);
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
  const out: string[] = [];

  const introSegments = segments.filter(
    (s) =>
      s.tag === segmentTags.introduction &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );
  const chosenIntroSegment = getRandomElement(introSegments);
  out.push(chosenIntroSegment.id);

  let numPromptsToFulfill = maxNumSegments;
  let availableStorySegments = segments.filter(
    (s) =>
      s.tag === segmentTags.segment &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );
  const usedSegmentIds: string[] = [];

  while (numPromptsToFulfill > 0 && availableStorySegments.length > 0) {
    // Filter out already used segments
    const unusedSegments = availableStorySegments.filter(
      (s) => !usedSegmentIds.includes(s.id),
    );

    if (unusedSegments.length === 0) {
      // If we've used all available segments, we can reuse them
      break;
    }

    const chosenSegment: Segment = getRandomElement(unusedSegments);
    out.push(chosenSegment.id);
    usedSegmentIds.push(chosenSegment.id);
    numPromptsToFulfill -= 1;
  }

  const closingSegments = segments.filter(
    (s) =>
      s.tag === segmentTags.closing &&
      segmentHasTopic(s, topic) &&
      segmentContainsOnlyTheseRoles(s, roles),
  );
  const chosenClosingSegment = getRandomElement(closingSegments);
  out.push(chosenClosingSegment.id);
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
