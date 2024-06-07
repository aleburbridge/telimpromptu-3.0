import { useState } from "react";
import React from "react";
import { segments } from "../script-building/segments";


export default function TestPage() {
  const [outPut, setOutput] = useState('')

  const segmentTags = {
    introduction: 'introduction',
    segment: 'segment',
    closing: 'closing'
  };

  const getRandomElement = (array) => {
    return array[Math.floor(Math.random() * array.length)];
  };

  const segmentHasTopic = (segment, topic) => {
    return segment.topic === 'any' || segment.topic.includes(topic);
  };

  const segmentContainsOnlyTheseRoles = (segment, roles) => {
    const segmentRoles = segment.lines.map(l => l.speaker.toLowerCase());
    const lowerCaseRoles = roles.map(role => role.toLowerCase());
    return segmentRoles.every(role => lowerCaseRoles.includes(role));
  };
  

  function generateListOfSegmentIds(topic, maxNumSegments, roles) {
    const out = []
    console.log("Segements are...")
    console.log(segments);
    console.log("intro segements are...")

    const introSegments = segments.filter(s => s.tag === segmentTags.introduction && segmentHasTopic(s, topic) && segmentContainsOnlyTheseRoles(s, roles));
    console.log(introSegments)
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
    setOutput(out)
    return out;
  }

  return (
    <div>
      <button onClick={() => generateListOfSegmentIds('any', 3, ['host', 'cohost', 'player'])}>Test Segment generation</button>
      { outPut }
    </div>
  )
}