const ideas = [
    { topic: 'zoo', ideas: ['A ___ has just escaped from the zoo and is on the loose!', 'A talking ___ is causing chaos.'] },
    { topic: 'politics', ideas: ['Joe Biden makes a surprise announcement: ___', 'The government announces a new holiday dedicated to ___'] },
    { topic: 'crime', ideas: ['2 dead, 5 injured in ___', 'A mystery involving stolen ___ shakes the city.'] },
    { topic: 'other', ideas: ['Pockets stop working worldwide', 'The internet has decided to take a day off.'] },
    { topic: 'sports', ideas: ['A new sport is gaining popularity: ___', 'Competitive ___ makes its debut on the international stage.'] }
];

export function getRandomIdea(topic) {
    const topicIdeas = ideas.find(item => item.topic === topic.toLowerCase());
    if (!topicIdeas) {
        return 'No ideas available for this topic.';
    }
    const randomIndex = Math.floor(Math.random() * topicIdeas.ideas.length);
    return topicIdeas.ideas[randomIndex];
}