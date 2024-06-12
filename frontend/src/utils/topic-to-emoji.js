const topicToEmojiList = [
    { topic: 'sports', emojis: ['🏐', '🏀', '🏉'] },
    { topic: 'politics', emojis: ['🏛️'] },
    { topic: 'crime', emojis: ['🔪', '🕵️'] },
    { topic: 'other', emojis: ['🗣️', '📰'] }
  ];
  
export function getRandomEmoji(topic) {
    if (!topic) {
        return '';
    } else {
        const topicEntry = topicToEmojiList.find(entry => entry.topic.toLowerCase() === topic.toLowerCase());
        if (!topicEntry || topicEntry.emojis.length === 0) {
        return '';
        }
        const randomIndex = Math.floor(Math.random() * topicEntry.emojis.length);
        return topicEntry.emojis[randomIndex];
    }
}