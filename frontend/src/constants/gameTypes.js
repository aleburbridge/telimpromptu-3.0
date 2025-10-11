export const GAME_TYPES = {
  BROADCAST: "broadcast",
  FUNNIES: "funnies",
};

export const DEFAULT_GAME_TYPE = GAME_TYPES.BROADCAST;

export const GAME_OPTIONS = [
  {
    id: GAME_TYPES.BROADCAST,
    title: "Broadcast",
    summary: "Create a madlibs style teleprompter script and present it to the audience",
  },
  {
    id: GAME_TYPES.FUNNIES,
    title: "Funnies",
    summary: "Caption comic strips",
  },
];

export const SUPPORTED_GAME_TYPES = GAME_OPTIONS.map((option) => option.id);

export function getGameOptionById(gameType) {
  return GAME_OPTIONS.find((option) => option.id === gameType);
}

export function normalizeGameType(gameType) {
  if (typeof gameType === "string") {
    const lowered = gameType.toLowerCase();
    if (SUPPORTED_GAME_TYPES.includes(lowered)) {
      return lowered;
    }
  }
  return DEFAULT_GAME_TYPE;
}
