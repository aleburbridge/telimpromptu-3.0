const topicToRolesMap = new Map();

// every topic has a host and cohost, and optionally a guest expert and field reporter
topicToRolesMap.set('sports', ['player', 'coach', 'fan', 'analyst'])
topicToRolesMap.set('politics', ['politician', 'political-correspondent', 'campaign-strategist', 'local-person'])
topicToRolesMap.set('crime', ['criminal', 'detective', 'witness', 'criminologist'])
topicToRolesMap.set('other', ['players mother', 'man', 'lad'])

export function getTopicToRolesMap() {
    return topicToRolesMap;
}