import React, { useEffect, useState, useCallback } from "react";
import { onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../config/firebase";
import {
  getAvailablePromptsForPlayer,
  getRoomIdFromPlayerId,
  getPlayerDataFromPlayerId,
} from "../utils/player-utils";
import { getRoomDataFromRoomId } from "../utils/room-utils";
import PlayersAndRoles from "../components/PlayersAndRoles";
import { replacePlaceholdersInPrompts } from "../utils/scripts-utils";

export default function PromptAnswering() {
  const [prompts, setPrompts] = useState([]);
  const [responses, setResponses] = useState({});
  const [roomId, setRoomId] = useState("");
  const [headline, setHeadline] = useState("");
  const [playerId] = useState(localStorage.getItem("playerId"));
  const navigate = useNavigate();
  const refreshShit = {};

  useEffect(() => {
    const initializeRoom = async () => {
      console.log('🔍 [PromptAnswering] Initializing room for playerId:', playerId);
      const roomId = await getRoomIdFromPlayerId(playerId);
      console.log('🔍 [PromptAnswering] Got roomId:', roomId);
      setRoomId(roomId);
      const roomData = await getRoomDataFromRoomId(roomId);
      console.log('🔍 [PromptAnswering] Room data:', roomData);
      setHeadline(roomData.headline);
    };

    initializeRoom();
  }, [playerId]);

      useEffect(() => {
    if (!roomId) {
      console.log('🔍 [PromptAnswering] No roomId yet, waiting...', roomId);
      return;
    }

    console.log('🔍 [PromptAnswering] Setting up room listener for roomId:', roomId);

    const roomDocRef = doc(db, "rooms", roomId);
    let previousPromptIds = new Set();

    // Load initial prompts immediately
    const loadInitialPrompts = async () => {
      try {
        console.log('🔍 [PromptAnswering] Loading initial prompts');
        const fetchedPrompts = await getAvailablePromptsForPlayer(playerId);
        console.log('🔍 [PromptAnswering] Initial fetched prompts:', fetchedPrompts);

        if (fetchedPrompts.length > 0) {
          const prefilledPrompts = await replacePlaceholdersInPrompts(
            fetchedPrompts,
            roomId,
          );
          console.log('🔍 [PromptAnswering] Initial prefilled prompts:', prefilledPrompts);
          setPrompts(prefilledPrompts);
          previousPromptIds = new Set(prefilledPrompts.map((p) => p.id));
        }
      } catch (error) {
        console.error('🔍 [PromptAnswering] Error loading initial prompts:', error);
      }
    };

    loadInitialPrompts();

        const unsubscribe = onSnapshot(
      roomDocRef,
      async (docSnapshot) => {
        try {
          if (docSnapshot.exists()) {
            console.log('🔍 [PromptAnswering] Room snapshot updated');
            const fetchedPrompts = await getAvailablePromptsForPlayer(playerId);
            console.log('🔍 [PromptAnswering] Fetched prompts for player:', fetchedPrompts);
            const prefilledPrompts = await replacePlaceholdersInPrompts(
              fetchedPrompts,
              roomId,
            );
            console.log('🔍 [PromptAnswering] Prefilled prompts:', prefilledPrompts);

            const newPrompts = prefilledPrompts.filter(
              (p) => !previousPromptIds.has(p.id),
            );
            console.log('🔍 [PromptAnswering] New prompts to add:', newPrompts);

            if (newPrompts.length > 0) {
              setPrompts((prevPrompts) => [...prevPrompts, ...newPrompts]);
              previousPromptIds = new Set([
                ...previousPromptIds,
                ...newPrompts.map((p) => p.id),
              ]);
            }

            const roomData = await getRoomDataFromRoomId(roomId);
            const allPlayerDataPromises = roomData.players.map((playerId) =>
              getPlayerDataFromPlayerId(playerId),
            );
            const allPlayerData = await Promise.all(allPlayerDataPromises);
            console.log('🔍 [PromptAnswering] All player data:', allPlayerData);
            const allPrompts = allPlayerData.flatMap((playerData) =>
              playerData ? playerData.prompts : [],
            );
            console.log('🔍 [PromptAnswering] All prompts across players:', allPrompts);
            const allPromptsAnswered = allPrompts.every(
              (promptId) => roomData.responses && roomData.responses[promptId],
            );
            console.log('🔍 [PromptAnswering] All prompts answered?', allPromptsAnswered);

            // TODO: this is a shitty cheat. We expect there to be at least 1 prompt, so if there's not, then
            // do not navigate to the teleprompter just yet.
            const isPromptsLoaded = allPrompts.length > 0;
            console.log('🔍 [PromptAnswering] Are prompts loaded?', isPromptsLoaded);
            if (allPromptsAnswered && isPromptsLoaded) {
              console.log('🔍 [PromptAnswering] Navigating to teleprompter');
              navigate("/teleprompter");
            }
          }
        } catch (error) {
          console.error('🔍 [PromptAnswering] Error in snapshot handler:', error);
        }
      },
      (error) => {
        console.error('🔍 [PromptAnswering] Firestore onSnapshot error:', error);

        // Handle specific Firebase errors
        if (error.code === 'unavailable') {
          console.log('🔍 [PromptAnswering] Firestore temporarily unavailable, will retry automatically');
        } else if (error.code === 'permission-denied') {
          console.error('🔍 [PromptAnswering] Permission denied - check Firestore rules');
        } else if (error.code === 'failed-precondition') {
          console.error('🔍 [PromptAnswering] Firestore connection failed, may need to refresh');
        } else {
          console.error('🔍 [PromptAnswering] Unknown Firestore error:', error.code, error.message);
        }
      }
    );

    return () => unsubscribe();
  }, [roomId, playerId, navigate]);

  const handleInputChange = useCallback((promptId, value) => {
    setResponses((prev) => ({ ...prev, [promptId]: value }));
  }, []);

    const handleSubmit = async (promptId, e) => {
    e.preventDefault();
    const roomId = await getRoomIdFromPlayerId(playerId);

    if (roomId && responses[promptId]) {
      try {
        const roomDocRef = doc(db, "rooms", roomId);
        await updateDoc(roomDocRef, {
          [`responses.${promptId}`]: responses[promptId],
        });

        //remove answered prompt
        setPrompts((prevPrompts) =>
          prevPrompts.filter((prompt) => prompt.id !== promptId),
        );
      } catch (error) {
        console.error("Error submitting response:", error);

        // Handle specific network errors
        if (error.code === 'unavailable' || error.message.includes('Failed to fetch')) {
          alert('Network connection issue. Please check your internet connection and try again.');
        } else {
          alert('Error submitting response. Please try again.');
        }
      }
    }
  };

  return (
    <>
      <PlayersAndRoles roomId={roomId} />
      <br />
      <p className="font-bold">Headline: {headline}</p>
      <div className="flex justify-center items-center">
        <div className="w-full max-w-2xl p-4">
          {prompts.length === 0 ? (
            <div className="flex-center mt-4">
              <p>Hold tight! Waiting on other players to submit answers</p>
              <div className="typing-loader ml-3"></div>
            </div>
          ) : (
            prompts.map((prompt, index) => {
              // cache the prompt ID so if the page refreshes we remember what it is and the contents
              if (!refreshShit[prompt.id]) {
                refreshShit[prompt.id] = (
                  <div
                    className="flex flex-col items-center mt-6"
                    key={prompt.id}
                  >
                    <p>{prompt.description}</p>
                    <div className="w-full">
                      <textarea
                        type="text"
                        placeholder=" "
                        value={responses[prompt.id] || ""}
                        onChange={(e) =>
                          handleInputChange(prompt.id, e.target.value)
                        }
                        className="text-black w-full md:w-1/2"
                      ></textarea>
                      <br />
                      <button
                        className="btn btn-accent btn-tall mt-1 w-full md:w-1/2"
                        onClick={(e) => handleSubmit(prompt.id, e)}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                );
              }
              return refreshShit[prompt.id];
            })
          )}
        </div>
      </div>
    </>
  );
}
