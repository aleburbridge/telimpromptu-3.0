import { segments, segmentTags } from './segments';

// Script generation is like 
// generateListOfSegmentIds -> aggregateScriptData(segmentIds)


// outputs a list of segment tags
/* i.e. 
0: "intro-1"
1: "crime-1"
2: "field-reporter-1"
3: "guest-expert-2"
4:  "closing-2"
*/
export function generateListOfSegmentIds(topic, maxNumSegments, roles) {
    // TODO: Make sure every role gets one segment
    const out = [];

    const introSegments = segments.filter(s => s.tag === segmentTags.introduction && segmentHasTopic(s, topic) && segmentContainsOnlyTheseRoles(s, roles));
    const chosenIntroSegment = getRandomElement(introSegments);
    out.push(chosenIntroSegment.id);

    let numPromptsToFulfill = maxNumSegments;
    let availableStorySegments = segments.filter(s => s.tag === segmentTags.segment && segmentHasTopic(s, topic) && segmentContainsOnlyTheseRoles(s, roles));
    while (numPromptsToFulfill > 0 && availableStorySegments.length > 0) {
        const chosenSegment = getRandomElement(availableStorySegments);
        out.push(chosenSegment.id);

        availableStorySegments = availableStorySegments.filter(s => s.id !== chosenSegment.id);
        numPromptsToFulfill -= 1;
    }

    const closingSegments = segments.filter(s => s.tag === segmentTags.closing && segmentHasTopic(s, topic) && segmentContainsOnlyTheseRoles(s, roles));
    const chosenClosingSegment = getRandomElement(closingSegments);
    out.push(chosenClosingSegment.id);
    return out;
}

// Scripts have the schema:
// {
//  lines: list<ScriptLine>
//  prompts: list<PromptObject>
// }
export function aggregateScriptData(segmentIds) {
    const script = {
        lines: [],
        prompts: [],
    };

    for (const segmentId of segmentIds) {
        const eligibleSegments = segments.filter(s => s.id === segmentId);
        if (eligibleSegments.length !== 1) {
            throw new Error(`CAN'T BUILD THE SCRIPT (basic script builder), ${segmentId} does not exist`);
        }
        script.lines.push(...eligibleSegments[0].lines);
        script.prompts.push(...eligibleSegments[0].prompts);
    }
    return script;
}

export async function getSegmentData(segmentId) {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) {
        throw new Error(`Segment with ID ${segmentId} not found`);
    }
    return segment;
}

function getRandomElement(list) {
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

function segmentHasTopic(segment, topic) {
    return segment.topic === topic || segment.topic === "any";
}

function segmentContainsOnlyTheseRoles(segment, roles) {
    const segmentRoles = segment.lines.map(line => line.speaker.toLowerCase());
    return segmentRoles.every(role => roles.includes(role));
}