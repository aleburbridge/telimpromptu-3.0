import {
  FUNNIES_IMAGE_PATHS,
  FUNNIES_ROUND_IMAGE_COUNT,
} from "../constants/funniesImages";

export function shuffleArray(items) {
  const cloned = [...items];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

const SLASH_TOKEN = "_sl_";
const DOT_TOKEN = "_dt_";

export function encodeImageKey(imageId) {
  if (typeof imageId !== "string") {
    return "";
  }
  return imageId.replace(/\//g, SLASH_TOKEN).replace(/\./g, DOT_TOKEN);
}

export function decodeImageKey(encodedKey) {
  if (typeof encodedKey !== "string") {
    return "";
  }
  return encodedKey.replace(new RegExp(SLASH_TOKEN, "g"), "/").replace(new RegExp(DOT_TOKEN, "g"), ".");
}

export function decodeResponsesMap(responses) {
  if (!responses || typeof responses !== "object") {
    return {};
  }
  const decoded = {};
  Object.entries(responses).forEach(([playerId, playerResponses]) => {
    if (!playerResponses || typeof playerResponses !== "object") {
      return;
    }
    const decodedEntries = {};
    Object.entries(playerResponses).forEach(([key, value]) => {
      const decodedKey = decodeImageKey(key);
      if (decodedKey) {
        decodedEntries[decodedKey] = value;
      }
    });
    decoded[playerId] = decodedEntries;
  });
  return decoded;
}

export function encodeResponsesMap(responses) {
  if (!responses || typeof responses !== "object") {
    return {};
  }
  const encoded = {};
  Object.entries(responses).forEach(([playerId, playerResponses]) => {
    if (!playerResponses || typeof playerResponses !== "object") {
      return;
    }
    const encodedEntries = {};
    Object.entries(playerResponses).forEach(([key, value]) => {
      const encodedKey = encodeImageKey(key);
      if (encodedKey) {
        encodedEntries[encodedKey] = value;
      }
    });
    encoded[playerId] = encodedEntries;
  });
  return encoded;
}

export function encodePlayerResponses(responses) {
  if (!responses || typeof responses !== "object") {
    return {};
  }
  const encoded = {};
  Object.entries(responses).forEach(([key, value]) => {
    const encodedKey = encodeImageKey(key);
    if (encodedKey) {
      encoded[encodedKey] = value;
    }
  });
  return encoded;
}

export function sanitizeImageSet(values, limit = FUNNIES_ROUND_IMAGE_COUNT) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }
  const unique = [];
  const seen = new Set();
  values.forEach((value) => {
    if (typeof value === "string" && !seen.has(value)) {
      seen.add(value);
      unique.push(value);
    }
  });
  return unique.slice(0, limit);
}

export function ensureImageSet(baseImages, pool = FUNNIES_IMAGE_PATHS) {
  const sanitized = sanitizeImageSet(baseImages);
  if (sanitized.length >= FUNNIES_ROUND_IMAGE_COUNT) {
    return sanitized;
  }
  const availablePool = Array.isArray(pool) ? pool : [];
  const remainingPool = availablePool.filter(
    (value) => typeof value === "string" && !sanitized.includes(value),
  );
  if (!remainingPool.length) {
    return sanitized;
  }
  const needed = FUNNIES_ROUND_IMAGE_COUNT - sanitized.length;
  const filler = selectRandomImages(remainingPool, needed);
  return sanitizeImageSet([...sanitized, ...filler]);
}

export function normalizeOrder(order, images) {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const imageSet = new Set(images);
  const normalized = [];
  const seen = new Set();

  if (Array.isArray(order)) {
    order.forEach((imageId) => {
      if (
        typeof imageId === "string" &&
        imageSet.has(imageId) &&
        !seen.has(imageId)
      ) {
        normalized.push(imageId);
        seen.add(imageId);
      }
    });
  }

  images.forEach((imageId) => {
    if (!seen.has(imageId)) {
      normalized.push(imageId);
      seen.add(imageId);
    }
  });

  return normalized.slice(0, images.length);
}

export function filterCaptionsByImages(captionsMap, images) {
  if (!captionsMap || typeof captionsMap !== "object") {
    return {};
  }

  const allowed = new Set(images);
  return Object.entries(captionsMap).reduce((accumulator, [imageId, caption]) => {
    if (allowed.has(imageId) && typeof caption === "string") {
      accumulator[imageId] = caption;
    }
    return accumulator;
  }, {});
}

export function selectRandomImages(pool, count = FUNNIES_ROUND_IMAGE_COUNT) {
  if (!Array.isArray(pool) || pool.length === 0) {
    return [];
  }
  const uniquePool = Array.from(new Set(pool));
  const target = Math.min(count, uniquePool.length);
  const shuffled = shuffleArray(uniquePool);
  return shuffled.slice(0, target);
}

export function calculateCompletionState({ images, responses, playerId }) {
  if (!Array.isArray(images) || images.length === 0) {
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      isComplete: false,
    };
  }

  const playerResponses = responses?.[playerId] || {};
  const completed = images.filter(
    (imageId) => typeof playerResponses[imageId] === "string" && playerResponses[imageId].trim().length > 0,
  ).length;

  return {
    total: images.length,
    completed,
    remaining: Math.max(images.length - completed, 0),
    isComplete: completed >= images.length,
  };
}

export function buildVoteKey(imageId, playerId) {
  const encodedImage = encodeImageKey(imageId);
  return `${encodedImage}__${playerId}`;
}

export function tallyVotesPerImage(votesMap) {
  if (!votesMap || typeof votesMap !== "object") {
    return {};
  }
  const tallies = {};
  Object.values(votesMap).forEach((vote) => {
    if (!vote || typeof vote !== "object") {
      return;
    }
    const { imageId, playerId } = vote;
    if (typeof imageId !== "string" || typeof playerId !== "string") {
      return;
    }
    if (!tallies[imageId]) {
      tallies[imageId] = new Set();
    }
    tallies[imageId].add(playerId);
  });
  const results = {};
  Object.entries(tallies).forEach(([imageId, voters]) => {
    results[imageId] = voters.size;
  });
  return results;
}

export function tallyVotesByCaption(votesMap) {
  if (!votesMap || typeof votesMap !== "object") {
    return {};
  }
  const tallies = {};
  Object.values(votesMap).forEach((vote) => {
    if (!vote || typeof vote !== "object") {
      return;
    }
    const { imageId, captionOwnerId } = vote;
    if (typeof imageId !== "string" || typeof captionOwnerId !== "string") {
      return;
    }
    if (!tallies[imageId]) {
      tallies[imageId] = {};
    }
    const imageTallies = tallies[imageId];
    imageTallies[captionOwnerId] = (imageTallies[captionOwnerId] || 0) + 1;
  });
  return tallies;
}
