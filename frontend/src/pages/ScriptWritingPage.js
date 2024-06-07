import React, { useState } from 'react';

export const ScriptWritingPage = () => {
    const [segments, setSegments] = useState([]);
    const [showDependentPromptInstructions, setShowDependentPromptInstructions] = useState(false);
    const [topic, setTopic] = useState('Sports');

    const roles = {
        Sports: ['Player', 'Coach', 'Referee'],
        Politics: ['Politician', 'Spokesperson', 'Voter'],
        Crime: ['Detective', 'Suspect', 'Witness'],
        Other: ['Character', 'Narrator', 'Observer']
    };

    const addSegment = () => {
        setSegments([...segments, { role: roles[topic][0], line: '', description: '' }]);
    };

    const updateSegment = (index, field, value) => {
        const newSegments = [...segments];
        newSegments[index][field] = value;
        if (field === 'line' && value.includes('{')) {
            newSegments[index].description = '';
        }
        setSegments(newSegments);
    };

    const handleTopicChange = (event) => {
        setTopic(event.target.value);
        setSegments([]);
    };

    const handleDependentPromptsClick = () => {
        setShowDependentPromptInstructions(true);
    }

    return (
        <div>
            <h3>Script Writing Page</h3>
            <p>Instructions:<br/>
            In Telimpromptu, scripts are divided into segments, like "opening", "crime-1", "crime-2", "conclusion". Segments with these tags are randomly selected and assembled to form a complete script. You can use this form to create one of these segments. Segments can be however long you want but are generally contain 5-10 prompts for the players. Wherever there is a place for a player to input text, wrap a unique identifier in curly brackets &#123;&#125;. So a line line like 'Hello, welcome to a &#123;news-descriptor&#125; night of news!' will render as 'Hello welcome to a stupendous night of news!'

Try to keep in mind that players can create any headline for the category you select, so the dialogue shouldn't be too specific. Any place where you feel there should be specific dialogue, consider making it a prompt for players to make sense of it themselves.
            </p>
            <a href='clicky' onClick={handleDependentPromptsClick}>Show advanced instructions</a>
            {showDependentPromptInstructions && 
            <p>Oh so you want to know some advanced instructions? Let me tell you about dependent prompts. Did you know that you can reference the bracketed identifier in any of your previous lines in future prompts? So a player can fill out one prompt and it could show up multiple times in other lines. But did you also know that if you put a curly-bracketed-prompt-identifier in the DESCRIPTION of a line, that will become a DEPENDENT PROMPT? How that works is, the line with a dependent prompt will not be shown to a player until the curly-bracketed-prompt-identifier has already been filled out by another player, meaning you can chain jokes, chain hilarity, and make some pretty awesome stuff.</p>
            }
            <br/>
            <select className="topic-select" onChange={handleTopicChange} value={topic}>
                <option value="Sports">Sports</option>
                <option value="Politics">Politics</option>
                <option value="Crime">Crime</option>
                <option value="Other">Other</option>
            </select>
            <br/>
            {segments.map((segment, index) => (
                <div key={index} className="segment">
                    <select className="role-select" value={segment.role} onChange={e => updateSegment(index, 'role', e.target.value)}>
                        {roles[topic].map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    <div className="inputs-container">
                        <textarea
                            className="script-line-input"
                            placeholder="Write your script line"
                            value={segment.line}
                            onChange={e => updateSegment(index, 'line', e.target.value)}
                            rows={4}
                        />
                        {segment.line.includes('{') && (
                            <textarea
                                className="description-input"
                                placeholder="Description of the placeholder"
                                value={segment.description}
                                onChange={e => updateSegment(index, 'description', e.target.value)}
                                rows={1}
                            />
                        )}
                    </div>
                </div>
            ))}
            <button className="add-line-button" onClick={addSegment}>Add a Line</button>
        </div>
    );
};