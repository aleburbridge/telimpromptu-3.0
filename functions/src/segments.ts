import { Segment } from "./types";

export const segmentTags = {
  introduction: "introduction",
  segment: "segment",
  closing: "closing"
};

// key:
// {!prompt} prompts that the players fill out
// {@name} names of players, pre-filled by the time prompts are displayed
// {#something} other data that is pre-filled and dynamic, like the topic or the headline

export const segments: Segment[] = [
  // ----------------- INTROS -------------------------
  /*
  {
    tag: segmentTags.introduction,
    id: 'intro-1',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'You\'re watching Telimpromptu News, I\'m your host, {@host} {@host-lastname}.' },
      { speaker: 'Cohost', content: 'And I\'m {@cohost} {@cohost-lastname}, tonight\'s story: {#headline}' },
      { speaker: 'Host', content: '{!host-reaction-to-headline}' },
      { speaker: 'Cohost', content: 'Telimpromptu News has some exclusive footage of the event, let\'s watch.\n\n{!youtube-video}\n\n' },
      { speaker: 'Host', content: '{!host-reaction-to-youtube-video}' }
    ],
    prompts: [
      { id: 'host-reaction-to-headline', description: 'The host ({@host})\'s reaction upon hearing the story for the first time ({#headline})' },
      { id: 'youtube-video', description: 'Paste a link to a YouTube video that portrays {#headline}\nLink to a timestamp if necessary' },
      { id: 'host-reaction-to-youtube-video', description: 'Write the host ({@host})\'s commentary upon seeing video footage of {#headline}' }
    ]
  },
  */
  {
    tag: segmentTags.introduction,
    id: 'intro-2',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'I\'m {@host} {@host-lastname} with Telimpropmtu news.' },
      { speaker: 'Cohost', content: 'And I\'m {@cohost} {@cohost-lastname}' },
      { speaker: 'Host', content: 'Our leading story tonight: {#headline}. Here\'s what we know so far: {!story-info-1}' },
      { speaker: 'Cohost', content: 'That\'s right, {@host}. We are also being told {!story-info-2}' },
    ],
    prompts: [
      { id: 'story-info-1', description: 'Initial details about the story, {#headline}' },
      { id: 'story-info-2', description: 'Details about the story, "{#headline}". We already know {!story-info-1}.' }
    ]
  },
  {
    tag: segmentTags.introduction,
    id: 'intro-3',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'I\'m {@host} {@host-lastname} with Telimpropmtu news.' },
      { speaker: 'Cohost', content: 'And I\'m {@cohost} {@cohost-lastname}. {!outburst-1}' },
      { speaker: 'Host', content: 'True. The hot topic tonight: {#headline}. We\'ve been told {!story-info-1}' },
      { speaker: 'Cohost', content: 'That\'s right, {@host}. We are also being told {!story-info-2}' },
    ],
    prompts: [
      { id: "outburst-1", description: "An outburst the cohost will have while introducing themselves."},
      { id: 'story-info-1', description: 'Initial details about the story, {#headline}' },
      { id: 'story-info-2', description: 'Details about the story, "{#headline}". We already know {!story-info-1}.' }
    ]
  },
  {
    tag: segmentTags.introduction,
    id: 'intro-4',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: '{!catchphrase}! I\'m {@host} {@host-lastname} with Telimpropmtu news.' },
      { speaker: 'Cohost', content: 'And I\'m {@cohost} {@cohost-lastname}.' },
      { speaker: 'Host', content: 'Tonight: {#headline}. We have sources that say {!story-info-1}' },
      { speaker: 'Cohost', content: 'That\'s right, {@host}. We also know {!story-info-2}' },
      { speaker: 'Host', content: '{!catchphrase}! Let\'s get it {@cohost}' },
    ],
    prompts: [
      { id: "catchphrase", description: "A catchphrase for the host"},
      { id: 'story-info-1', description: 'Initial details about the story, {#headline}' },
      { id: 'story-info-2', description: 'Details about the story, "{#headline}". We already know {!story-info-1}.' }
    ]
  },

  // ----------------- ANY -------------------------
  {
    tag: segmentTags.segment,
    id: 'crime-mother',
    topic: 'any',
    lines: [
      { speaker: 'Cohost', content: 'Now we want to hear from you all. Call in to the Telimpromptu News station with your thoughts on tonight\'s story and you may be featured live on the air. Lines are open.' },
      { speaker: 'Host', content: 'And it looks like we\'re getting our first caller. Caller, you\'re on the air. What\'s your name and where are you calling from?' },
      { speaker: 'mother', content: 'Oh hello, sweetie. I\'m {#mother-of}\'s mother and I\'m calling from {!mother-location}' },
      { speaker: 'Cohost', content: '{#mother-of}\'s mother, what are your reactions to tonight\'s story?'},
      { speaker: 'mother', content: '{!mother-reaction}'},
      { speaker: 'Host', content: 'Well said, {#mother-of}\'s mother.'},
      { speaker: 'mother', content: 'Oh, one more thing. {#mother-of}? {!mothers-plea-to-child}'},
      { speaker: 'Cohost', content: 'That\'s all the time we have for calls. Thank you for joining us {#mother-of}\'s mother.' },
      { speaker: 'mother', content: '{!mother-goodbye}'}

    ],
    prompts: [
      { id: 'mother-location', description: 'The location where {#mother-of}\'s mother is calling in from' },
      { id: 'mother-reaction', description: 'Write {#mother-of}\'s mother\'s thoughts on tonight\'s story.' },
      { id: 'mothers-plea-to-child', description: 'Write {#mother-of}\'s mother\'s plea to {#mother-of} that they give live on the air, i.e. \'Don\'t forget to wear a sweater\''},
      { id: 'mother-goodbye', description: 'Write {#mother-of}\'s mother\'s parting words.' },
    ]
  },

  // ----------------- GUEST EXPERT -------------------------
  {
    tag: segmentTags.segment,
    id: 'guestexpert-1',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'Joining us now is our guest expert {@guestexpert} {@guestexpert-lastname} who has a {!expert-credentials}.' },
      { speaker: 'Host', content: 'Thank you for joining us.' },
      { speaker: 'guestexpert', content: 'Thank you for having me on {@host}.' },
      { speaker: 'Host', content: 'First question, {!expert-question-1}?' },
      { speaker: 'guestexpert', content: '{!expert-initial-answer-1}, {@host}, {!expert-full-answer-1}' },
      { speaker: 'Cohost', content: 'Remarkable.' },
      { speaker: 'guestexpert', content: 'Maybe to some, but when you have a {!expert-credentials} like me, you see this kind of thing every day.' },
      { speaker: 'Cohost', content: 'Next question, {@guestexpert}, {!expert-question-2}?' },
      { speaker: 'guestexpert', content: '{!expert-initial-answer-2}, {@cohost}, and here I should add a relevant detail to the case: {!guestexpert-detail}, as I will now demonstrate. (Demonstrates)' },
      { speaker: 'Cohost', content: 'Final question, {!expert-question-3}?' },
      { speaker: 'guestexpert', content: 'I\'m sorry {@cohost}, I can\'t answer that question. When I obtained my {!expert-credentials}, I swore a solemn oath.\n(Places hand on heart)\n{!expert-oath}' },
      { speaker: 'Host', content: 'That\'s {@guestexpert} {@guestexpert-lastname}. Thank you for your time, {@guestexpert}.' },
      { speaker: 'guestexpert', content: 'Thank you.' }
    ],
    prompts: [
      { id: 'expert-credentials', description: 'The credentials that the expert ({@guestexpert}) has\ne.g. \'PhD in Rocks\'' },
      { id: 'expert-oath', description: 'Write the oath that the guest expert ({@guestexpert}) who has a {!expert-credentials} had to swear upon entering their field.' },
      {
        groupId: 'expert_initialanswers',
        subPrompts: [
          { id: 'expert-initial-answer-1', description: 'The guest expert ({@guestexpert})\'s first answer to a question that hasn\'t been written yet\ne.g. \'Yes\', \'I can\'t answer that\', \'No\'' },
          { id: 'expert-initial-answer-2', description: 'The guest expert ({@guestexpert})\'s second answer to a question that hasn\'t been written yet' }
        ]
      },
      {
        groupId: 'expert_questions',
        subPrompts: [
          { id: 'expert-question-1', description: 'The first question the host asks to the guest expert ({@guestexpert}). The guest expert\'s answer starts with {!expert-initial-answer-1}' },
          { id: 'expert-question-2', description: 'The second question the host asks to the guest expert ({@guestexpert}). The guest expert\'s answer starts with {!expert-initial-answer-2}' },
          { id: 'expert-question-3', description: 'The third question the host asks to the guest expert ({@guestexpert}). The guest expert will say they can\'t answer it.' }
        ]
      },
      {
        groupId: 'expert_full_answers',
        subPrompts: [
          { id: 'expert-full-answer-1', description: 'The answer to {!expert-question-1} which starts with {!expert-initial-answer-1}' },
          { id: 'guestexpert-detail', description: 'Write a detail for the guest expert ({@guestexpert}) to present that they will have to demonstrate themself.' }
        ]
      }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'guestexpert-2',
    topic: 'any',
    lines: [
      { speaker: 'Cohost', content: '{@guestexpert} {@guestexpert-lastname} has agreed to an exclusive interview with Telimpromptu News. He is a distinguished professional and has a {!expert-credentials}. {@guestexpert} {@guestexpert-lastname}, thank you for joining us.' },
      { speaker: 'guestexpert', content: 'It\'s a pleasure to be here.' },
      { speaker: 'Cohost', content: '{@guestexpert}, in your professional opinion, what do you make of this story?' },
      { speaker: 'guestexpert', content: 'Well, {!phony-expert-answer1}.' },
      { speaker: 'Cohost', content: '(Listening on ear piece) ...I\'ve just received word from our sources that {!cohost-contradiction1}. {@guestexpert}, how do you respond to that?' },
      { speaker: 'guestexpert', content: 'Well, ..I uh, (clears throat). It\'s clear that your \'sources\' don\'t have a {!expert-credentials} like me, or they wouldn\'t even be asking such questions.' },
      { speaker: 'Cohost', content: '(Talking softly into ear piece)\nReally? I don\'t believe this.\n(Talking to guest expert) I\'ve just gotten word that {!cohost-contradiction2}. {@guestexpert}, what do you have to say for yourself?' },
      { speaker: 'guestexpert', content: 'Uh....I...{!guestexpert-plea}.' },
      { speaker: 'Cohost', content: 'Alright, I\'m afraid we\'ll have to cut our interview short. I\'m sorry about that, folks.' }
    ],
    prompts: [
      { id: 'expert-credentials', description: 'The credentials that the expert ({@guestexpert}) has. i.e.: \'PHD in Rocks\'' },
      { id: 'phony-expert-answer1', description: 'An expert account of the story for the guest expert ({@guestexpert}), who claims to have a {!expert-credentials}. Make the guest expert\'s account unbelievable.' },
      { id: 'cohost-contradiction1', description: 'The information the cohost receives that contradicts the guest expert ({@guestexpert})\'s claim that {!phony-expert-answer1}.' },
      { id: 'cohost-contradiction2', description: 'A piece of information that reveals that the guest expert ({@guestexpert}) does not really have a {!expert-credentials}. E.g. \'The University of Hampburgshire is not a real university\'.' },
      { id: 'guestexpert-plea', description: 'The guest expert ({@guestexpert}) has been found out to be a phony. Write his desperate plea that reveals his real reason for wanting to get on TV.' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'fieldreporter-1',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'We go now to field reporter {@fieldreporter} {@fieldreporter-lastname}. {@fieldreporter} thank you for joining us.' },
      { speaker: 'fieldreporter', content: 'Thank you, {@host}.' },
      { speaker: 'Cohost', content: 'Whats going on at the scene of the incident?' },
      { speaker: 'fieldreporter', content: 'Well, {!fieldreporter-fieldreport1}.' },
      { speaker: 'Host', content: 'Anything else?' },
      { speaker: 'fieldreporter', content: 'Yes, we have a quote from a witness who saw the incident firsthand. Quote, {!fieldreporter-quote}.' },
      { speaker: 'Cohost', content: '{!host-exclamation}!' },
      { speaker: 'Host', content: '{!host-exclamation} is right {@cohost}.' },
      { speaker: 'Cohost', content: 'One last thing, {@fieldreporter}. Do you have a message for the families at home?' },
      { speaker: 'fieldreporter', content: 'Yes, {!fieldreporter-familyanswer}.' },
      { speaker: 'Host', content: 'That\'s field reporter {@fieldreporter} {@fieldreporter-lastname}. {@fieldreporter}, thank you.' },
      { speaker: 'fieldreporter', content: 'Thank you.' }
    ],
    prompts: [
      { id: 'fieldreporter-fieldreport1', description: 'Write 1+ sentences on what the field reporter ({@fieldreporter}) sees at the scene of the incident.' },
      { id: 'host-exclamation', description: 'An exclamation the host says. i.e. \'Holy moly\'' },
      { id: 'fieldreporter-quote', description: 'Write a quote for the field reporter ({@fieldreporter}) to present on something said by a witness who saw the incident firsthand.' },
      { id: 'fieldreporter-familyanswer', description: 'Write a message for the field reporter ({@fieldreporter}) to give to the families at home.' }
    ]
  },

  // ------------- CRIME ---------------
  {
    tag: segmentTags.segment,
    id: 'crime-1',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'Turning back now to the scene of the incident where I\'m being told reporters have managed to get a few words with a witness who saw the event.' },
      { speaker: 'Witness', content: '(In a {!witness-voice} voice.)\n\n{!witness-account1}\n\n{!witness-account2}' },
      { speaker: 'Cohost', content: 'Enlightening.' }
    ],
    prompts: [
      { id: 'witness-voice', description: 'Write a silly voice for the witness to talk in, it should be a voice that the person reading can do. Ex. \'British\', \'Mickey Mouse\' The prompt will show up as: \'(in a your-text-here voice)\'' },
      { id: 'witness-account1', description: 'Write the first half of a witness\' firsthand account of the scene in as many words as you like. They will be speaking in a {!witness-voice} voice.' },
      { id: 'witness-account2', description: 'Write the second half half of a firsthand account of the scene in as many words as you like. It starts with: {!witness-account1}' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'crime-2',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'This just in, I\'m getting word that we\'ve managed to get an exclusive interview with Detective {@detective} Gumshoe who is live on the scene. Detective, what can you share with us?' },
      { speaker: 'Detective', content: 'Well, the situation is worse than we thought, my team has just discovered that {!detective-info1}.' },
      { speaker: 'Host', content: 'Horrific.' },
      { speaker: 'Detective', content: 'It gets worse. In all my years as a detective never before have I seen {!detective-info2}.' },
      { speaker: 'Host', content: 'Well detective, do you have any clues as to why this happened?' },
      { speaker: 'Detective', content: 'Indeed I do. A note was discovered at the scene of the incident, it reads: {!detective-note}.' },
      { speaker: 'Host', content: 'Detective, thank you for your time.' }
    ],
    prompts: [
      { id: 'detective-info1', description: 'Write a discovery for the detective to present. Context: \'Well, the situation is worse than we thought. My team has just discovered that (Your text here).' },
      { id: 'detective-info2', description: 'Write a discovery for the detective to present. Context: \'It gets worse, in all my years as a detective never before have I seen (your text here)\'' },
      { id: 'detective-note', description: 'The detective will present a note that was discovered at the scene. Write what the note says.' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'crime-3',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'We have a special guest today, renowned criminologist {@criminologist} joining us to shed some light on this baffling case. What can you tell us about the situation?' },
      { speaker: 'Criminologist', content: 'Thank you for having me. Based on my analysis, it appears that {!criminologist-analysis1}.' },
      { speaker: 'Cohost', content: 'Fascinating. Can you elaborate further on your findings?' },
      { speaker: 'Criminologist', content: 'Certainly. My detailed examination reveals that {!criminologist-analysis2}.' },
      { speaker: 'Host', content: 'This is quite alarming. Do you have any theories on the motive behind this?' },
      { speaker: 'Criminologist', content: 'I do. The patterns suggest that {!criminologist-theory}.' },
      { speaker: 'Cohost', content: 'Thank you for your insights, criminologist {@criminologist}.' }
    ],
    prompts: [
      { id: 'criminologist-analysis1', description: 'Write part of the criminologist\'s analysis of the crime scene. Context: \'Based on my analysis, it appears that (your text here)\'' },
      { id: 'criminologist-analysis2', description: 'Write some of the criminologist\'s detailed findings. Context: \'My detailed examination reveals that (your text here)\'' },
      { id: 'criminologist-theory', description: 'Write the criminologist\'s theory on the motive behind the crime. Context: \'The patterns suggest that (your text here)\'' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'crime-4',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'In an unexpected turn of events, we have an exclusive interview with the perpetrator of the crime themself, {@criminal} who has agreed to speak with us. {@criminal}, why did you commit this crime?' },
      { speaker: 'Criminal', content: 'Well, it all started when {!criminal-reason}.' },
      { speaker: 'Cohost', content: 'That is quite a story. What do you have to say to the people watching this?' },
      { speaker: 'Criminal', content: 'To everyone out there, I want to say {!criminal-message}.' },
      { speaker: 'Host', content: 'Do you have any regrets about what you did?' },
      { speaker: 'Criminal', content: 'Honestly, {!criminal-regret}.' },
      { speaker: 'Cohost', content: 'Thank you for sharing your side of the story. Well everyone, that was known criminal, {@criminal}.' }
    ],
    prompts: [
      { id: 'criminal-reason', description: 'Write the reason the criminal gives for committing the crime. Context: \'Well, it all started when (your text here)\'' },
      { id: 'criminal-message', description: 'Write a message from the criminal to the audience. Context: \'To everyone out there, I want to say (your text here)\'' },
      { id: 'criminal-regret', description: 'Write whether the criminal regrets their actions and why. Context: \'Honestly, (your text here)\'' }
    ]
  },

  // ------------------ POLITICS ------------------
  {
    tag: segmentTags.segment,
    id: 'campaignstrategist-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'Let\'s connect with our campaign strategist, {@campaignstrategist}, at the national convention. How\'s it going?' },
      { speaker: 'campaignstrategist', content: 'Well, {@host}, it\'s going wildly. We\'ve just unveiled our plan to improve national security. {!national-security-plan}' },
      { speaker: 'CoHost', content: '{!national-security-plan} ...for national security?' },
      { speaker: 'campaignstrategist', content: 'Yes, it\'s part of our new initiative we call {!security-initiative-name}' },
      { speaker: 'CoHost', content: '{!host-exclamation}! Quite the innovative approach. How do you foresee this improving national security?' },
      { speaker: 'campaignstrategist', content: 'Well that\'s simple, really. {!security-initative-explanation}' },
      { speaker: 'Host', content: 'Thanks for the update, {@campaignstrategist}.' },
      { speaker: 'campaignstrategist', content: 'Anytime, {@host}.' }
    ],
    prompts: [
      { id: 'national-security-plan', description: '{@campaignstrategist}\'s new plan for national security. i.e. \'Training squirrels\''},
      { id: 'security-initiative-name', description: 'A catchy name for a new national security initiative: {!national-security-plan}.' },
      { id: 'host-exclamation', description: 'An exclamation the host says. i.e. \'Holy toledo\'' },
      { id: 'security-initative-explanation', description: 'An explanation for how {!national-security-plan} will improve national security'}
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'politician-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'Joining us live from the campaign trail, we have politician {@politician}. What\'s the latest from your campaign?' },
      { speaker: 'Politician', content: 'Thank you, {@host}. Our campaign is gaining momentum. We just announced our plan to {!politician-plan}.' },
      { speaker: 'CoHost', content: 'That\'s a bold move. How do you plan to implement this?' },
      { speaker: 'Politician', content: 'It\'s all about {!implementation-strategy}.' },
      { speaker: 'Cohost', content: 'Do you think this will resonate with the voters?' },
      { speaker: 'Politician', content: 'Absolutely. Our polls show that {!voter-response}.' },
      { speaker: 'Host', content: 'Thank you for your time, {@politician}.' },
      { speaker: 'Politician', content: 'Thank you, {@host}.' }
    ],
    prompts: [
      { id: 'politician-plan', description: 'Write the politician\'s new plan or initiative. Context: \'Our campaign is gaining momentum. We just announced our plan to (your text here)\'' },
      { id: 'implementation-strategy', description: 'Explain how the politician plans to implement their new plan. Context: \'It\'s all about (your text here)\'' },
      { id: 'voter-response', description: 'Write how the voters are responding to the politician\'s plan. Context: \'Our polls show that (your text here)\'' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'politicalcorrespondent-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'We now go live to our political correspondent {@politicalcorrespondent} for an update on the current political climate. What\'s the latest?' },
      { speaker: 'politicalcorrespondent', content: 'Thanks, {@host}. The atmosphere here is electric as {!political-event} unfolds.' },
      { speaker: 'Host', content: 'How are people reacting to this event?' },
      { speaker: 'politicalcorrespondent', content: 'Well, reactions are mixed. Some people are saying {!public-reaction1}, while others believe {!public-reaction2}.' },
      { speaker: 'Host', content: 'That\'s quite a divide. Any predictions on the outcome?' },
      { speaker: 'politicalcorrespondent', content: 'It\'s hard to say, but many experts think that {!expert-prediction}.' },
      { speaker: 'Host', content: 'Thank you for the update, {@politicalcorrespondent}.' },
      { speaker: 'politicalcorrespondent', content: 'My pleasure, {@host}.' }
    ],
    prompts: [
      { id: 'political-event', description: 'Describe the political event currently unfolding. Context: \'The atmosphere here is electric as (your text here) unfolds.\'' },
      {
        groupId: 'political-reactions',
        subPrompts: [
          { id: 'public-reaction1', description: 'Write the first public reaction to the political event. Context: \'Some people are saying (your text here)\'' },
          { id: 'public-reaction2', description: 'Write a contrasting reaction. Context: \'while others believe (your text here)\'' },
        ]
      },
      { id: 'expert-prediction', description: 'Write the expert prediction about the outcome of the political event. Context: \'many experts think that (your text here)\'' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'guestexpert-politics-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'We\'re pleased to welcome our guest expert, {@guestexpert}, to provide some insights on the current political scenario. What are your thoughts?' },
      { speaker: 'guestexpert', content: 'Thank you, {@host}. I believe that {!expert-opinion1}.' },
      { speaker: 'Host', content: 'That\'s interesting. Can you expand on that?' },
      { speaker: 'guestexpert', content: 'Of course. The data shows that {!expert-opinion2}.' },
      { speaker: 'Cohost', content: 'What impact do you think this will have on the upcoming elections?' },
      { speaker: 'guestexpert', content: 'It\'s likely that {!election-impact}.' },
      { speaker: 'Host', content: 'Thank you for your valuable insights, {@guestexpert}.' },
      { speaker: 'guestexpert', content: 'Happy to share, {@host}.' }
    ],
    prompts: [
      { id: 'expert-opinion1', description: 'Write the guest expert\'s initial opinion on the current political scenario. Context: \'I believe that (your text here)\'' },
      { id: 'expert-opinion2', description: 'Write a detailed expansion of the guest expert\'s opinion. Context: \'The data shows that (your text here)\'' },
      { id: 'election-impact', description: 'Write the expert\'s prediction on the impact of the current political scenario on the upcoming elections. Context: \'It\'s likely that (your text here)\'' }
    ]
  },

  // ----------------- SPORTS -------------------------
  {
    tag: segmentTags.segment,
    id: 'analyst-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re live with our sports analyst, {@analyst}. What\'s the atmosphere like at today\'s game?' },
      { speaker: 'Analyst', content: 'Thanks, {@host}. It\'s electric here! The coach just introduced a new team mascot, {!mascot}, to boost morale!' },
      { speaker: 'Host', content: 'A ... {!mascot}? That\'s a new one.' },
      { speaker: 'Analyst', content: 'Absolutely, and it seems to be working. The players are loving it and even the fans are joining in by {!fan-mascot-action}' },
      { speaker: 'Host', content: '{!host-exclamation}, that sounds like a good time in the stands!' },
      { speaker: 'Analyst', content: 'Yup, it\'s all about the fun today.' },
      { speaker: 'Cohost', content: 'Keep us in the loop, {@analyst}. Thanks for the update.' },
      { speaker: 'Analyst', content: 'Will do, {@cohost}!' }
    ],
    prompts: [
      { id: 'mascot', description: 'A new mascot for the sports team that the coach is unveiling' },
      { id: 'fan-mascot-action', description: 'A description of what fans are doing in reaction to the unveiling of the team\'s new mascot, {!mascot}' },
      { id: 'host-exclamation', description: 'An exclamation the host says. i.e. \'That\'s spicy!\'' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: 'coach-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re live with Coach {@coach}. How are things shaking up at the stadium today?' },
      { speaker: 'Coach', content: 'Exciting times, {@host}! I\'m happy to unveil a new cheer to rally the fans! I call it {!new-cheer-name}' },
      { speaker: 'Host', content: '{!new-cheer-name}? What do fans do?' },
      { speaker: 'Coach', content: '{!cheer-description}' },
      { speaker: 'Host', content: '{!host-exclamation}, that must be quite the sight!' },
      { speaker: 'Coach', content: 'Oh, it is.' },
      { speaker: 'Cohost', content: 'Could you give us a demonstration?' },
      { speaker: 'Coach', content: 'I\'d be happy to. (demonstrates)\n\n\n\n\n\n\n' },
      { speaker: 'Host', content: 'I think I\'ll give it a try! (demonstrates)' },
      { speaker: 'Cohost', content: 'Coach {@coach}, thank you for your time.' },
    ],
    prompts: [
      { id: 'new-cheer-name', description: 'The name of a new cheer that the coach will introduce for the fans to perform at the game.' },
      { id: 'cheer-description', description: 'Describe what a cheer called {!new-cheer-name} involves. E.g. \'Fans beat their chest and chant \'HOOT GROWL HOOT GROWL\'' },
      { id: 'host-exclamation', description: 'An exclamation the host says.' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: "player-1",
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re live with Player {@player}. How\'s it hanging {!player-nickname-1}?' },
      { speaker: 'Player', content: '{!player-one-liner}! How did you know I\'m called {!player-nickname-1}?' },
      { speaker: 'Cohost', content: 'Everyone knows you\'re called {!player-nickname-1} because {!player-nickname-origin}' },
      { speaker: 'Player', content: '{!player-one-liner}! You\'re alright man.' },
      { speaker: 'Host', content: 'Hah, yeah, {!cool-phrase}!' },
      { speaker: 'Cohost', content: '{!player-nickname-1}, how did you prepare for today\'s massive game?' },
      { speaker: 'Player', content: 'So first I {!preparation-1}?' },
      { speaker: 'Host', content: 'No way.' },
      { speaker: 'Player', content: 'That\'s just the start. I followed it up by {!preparation-2}' },
      { speaker: 'Host', content: 'Wow.' },
      { speaker: 'Cohost', content: 'Incredible. Thanks for your time {!player-nickname-1}' },
      { speaker: 'Player', content: 'Totally. {!player-one-liner}' },
    ],
    prompts: [
      {
        groupId: 'nickname',
        subPrompts: [
          { id: 'player-nickname-1', description: 'A nickname for {@player}, a player in the sports story tonight.' },
          { id: 'player-nickname-origin', description: 'The reason the player is called {!player-nickname-1}.\nContext: "Everyone knows you\'re called {!player-nickname-1} because (your text here)."' }
        ]
      },
      { id: 'player-one-liner', description: 'A one-liner the player will say' },
      { id: 'cool-phrase', description: "A cool phrase." },
      { id: 'preparation-1', description: 'What did the player to do to prepare for the game today?' },
      { id: 'preparation-2', description: 'What did the player to do to prepare for the game today? We already know he\'ll say "{!preparation-1}"' }
    ]
  },
  {
    tag: segmentTags.segment,
    id: "fan-1",
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re here now with a fan of the event tonight, {@fan}. How are you liking the event?' },
      { speaker: 'Fan', content: 'How do I like it?! {!reaction}' },
      { speaker: 'Cohost', content: 'Sounds like you\'re getting in the spirit! What was the most memorable part of the game tonight?' },
      { speaker: 'Fan', content: 'Oh, it was definitely when {!memorable-event-1}' },
      { speaker: 'Cohost', content: 'Rad! Mine was {!memorable-event-2}' },
      { speaker: 'Host', content: 'Sounds like we have a fan right here in the studio!' },
      { speaker: 'Cohost', content: 'Me? I\'ve been waiting for this event for over {!time-amount}' },
      { speaker: 'Fan', content: 'No way. You are a fake fan.' },
      { speaker: 'Cohost', content: 'Listen pal. Nobody is a bigger fan of this event than me.' },
      { speaker: 'Fan', content: 'Oh yeah? Who are your favorite players then?' },
      { speaker: 'Cohost', content: 'Ummm... {!fake-name-1}, {!fake-name-2}, ... definitely {!fake-name-3}' },
      { speaker: 'Fan', content: 'Woah.. you know about {!fake-name-3}?' },
      { speaker: 'Cohost', content: 'Fo sho.' },
      { speaker: 'Host', content: 'Get a room you two!' },
    ],
    prompts: [
      { id: 'reaction', description: 'A fan\'s reaction to the event tonight. Context: "How do I like it?! (your text here)"' },
      { id: 'memorable-event-1', description: "An event that happened during tonight's game" },
      { id: 'memorable-event-2', description: "An event that happened during tonight's game" },
      { id: 'time-amount', description: 'An amount of time (e.g. "1 minute", "1 year")' },
      { id: 'fake-name-1', description: 'An obviously fake player name' },
      { id: 'fake-name-2', description: 'An obviously fake player name. Previous names: {!fake-name-1}' },
      { id: 'fake-name-3', description: 'An obviously fake player name. Previous names: {!fake-name-1}, {!fake-name-2}' },
    ]
  },

    // ----------------- CLOSING -------------------------
  {
    tag: segmentTags.closing,
    id: 'closing-1',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'Well, there you have it folks. A story like this you only see once in a lifetime. {!host-story-description} {@cohost} its an unbelievable story isn\'t it?' },
      { speaker: 'Cohost', content: 'Well, it shouldn\'t be all that surprising given that {!cohost-statistic}.' },
      { speaker: 'Host', content: 'That\'s for sure. Well folks, that\'s all the time we have for tonight. Goodbye.' }
    ],
    prompts: [
      { id: 'host-story-description', description: 'A few words for the closing remarks of the story\nContext: "Well, there you have it folks. A story like this you only see once in a lifetime. (Your text here)"' },
      { id: 'cohost-statistic', description: 'A fake fact or statistic for the CoHost to present\nContext: "Perhaps this story shouldn\'t be all that surprising given that (Your text here)"' }
    ]
  },
  {
    tag: segmentTags.closing,
    id: 'closing-2',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'Well that\'s all we have for tonight everyone. Truly something special isn\'t it, {@cohost}?' },
      { speaker: 'Cohost', content: 'It\'s like the old {!musical-artist} line, {!cohost-lyric}.' },
      { speaker: 'Host', content: 'You\'re right about that one. Well folks, that\'s all we\'ve got for tonight. Telimpromptu news, signing off.' }
    ],
    prompts: [
      {
        groupId: 'musical-reference',
        subPrompts: [
          { id: 'cohost-lyric', description: 'A quote that {@cohost} will say that somehow relates to tonight\'s story' },
          { id: 'musical-artist', description: 'The person who the quote is attributed to.' }
        ]
      }
    ]
  },
  {
    tag: segmentTags.closing,
    id: 'closing-mother',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'Here to close the story out with us is {#mother-of}\'s mother! {#mother-of}\'s mother, thank you for joining us on Telimpromptu News.' },
      { speaker: 'mother', content: '{!mother-greeting}' },
      { speaker: 'Cohost', content: 'Haha. {#mother-of}\'s mother, what did you think of tonight\'s story?' },
      { speaker: 'mother', content: 'Well young man, I have to say I especially liked the part when {!mothers-favorite-part}' },
      { speaker: 'Host', content: 'That was my favorite part too. {#mother-of}\'s mother, I was hoping you could tell us what we can all take away from this story' },
      { speaker: 'mother', content: '{!mother-moral}'}
    ],
    prompts: [
      { id: 'mother-greeting', description: 'Write {#mother-of}\'s mother\'s greeting upon going live on air.' },
      { id: 'mothers-favorite-part', description: 'Write {#mother-of}\'s mother\'s favorite part of the story. Context: \'I especially liked the part when (your text here)\'' },
      { id: 'mother-moral', description: 'Write the moral of the story that {#mother-of}\'s mother will say at the end of the broadcast.'}
        ]
  },

  // ----------------- BYSTANDER -------------------------
  {
    tag: segmentTags.segment,
    id: 'bystander-1',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'We\'re here with {@bystander} {@bystander-lastname}, who happened to be in the area when this all went down. {@bystander}, can you tell us what you saw?' },
      { speaker: 'bystander', content: 'Well, I was just {!bystander-activity} when suddenly {!bystander-observation}' },
      { speaker: 'Cohost', content: 'That must have been quite a sight! Did you do anything to help?' },
      { speaker: 'bystander', content: 'Oh absolutely! I immediately {!bystander-action}' },
      { speaker: 'Host', content: 'Wow, that\'s... that\'s something alright.' },
      { speaker: 'bystander', content: 'Yeah, my {!relative-type} always told me "{!family-wisdom}"' },
      { speaker: 'Cohost', content: 'Words to live by! Thank you {@bystander}.' },
      { speaker: 'bystander', content: 'No problem! Oh, and tell my {!relative-type} I said hi!' }
    ],
    prompts: [
      { id: 'bystander-activity', description: 'What the bystander ({@bystander}) was doing when the incident occurred' },
      { id: 'bystander-observation', description: 'What the bystander ({@bystander}) claims to have witnessed' },
      { id: 'bystander-action', description: 'The bystander ({@bystander})\'s attempt to help during the incident' },
      { id: 'relative-type', description: 'A family member (e.g. grandmother, uncle, cousin)' },
      { id: 'family-wisdom', description: 'Advice that the bystander\'s {!relative-type} gave them' }
    ]
  },

  // ----------------- EXPERT -------------------------
  {
    tag: segmentTags.segment,
    id: 'expert-specialized',
    topic: 'any',
    lines: [
      { speaker: 'Host', content: 'Joining us now is {@expert} {@expert-lastname}, who specializes in {!expert-specialty}. Thank you for being here.' },
      { speaker: 'expert', content: 'Happy to be here, {@host}. This is exactly the kind of situation I\'ve been studying for {!study-duration}' },
      { speaker: 'Cohost', content: 'In your expert opinion, what should people know about this situation?' },
      { speaker: 'expert', content: 'Well, the most important thing is {!expert-advice}. I cannot stress this enough.' },
      { speaker: 'Host', content: 'That\'s fascinating. Are there any warning signs people should watch for?' },
      { speaker: 'expert', content: 'Absolutely. If you ever notice {!warning-sign}, you need to immediately {!emergency-action}' },
      { speaker: 'Cohost', content: 'What about prevention?' },
      { speaker: 'expert', content: 'Prevention is key. I always recommend {!prevention-method}. It\'s saved countless lives.' },
      { speaker: 'Host', content: 'Incredible insights. Thank you {@expert}!' }
    ],
    prompts: [
      { id: 'expert-specialty', description: 'What the expert ({@expert}) specializes in' },
      { id: 'study-duration', description: 'How long the expert has been studying their field' },
      { id: 'expert-advice', description: 'The most important advice the expert ({@expert}) can give about tonight\'s story' },
      { id: 'warning-sign', description: 'A warning sign that people should watch for related to tonight\'s story' },
      { id: 'emergency-action', description: 'What people should do if they notice the warning sign: {!warning-sign}' },
      { id: 'prevention-method', description: 'The expert\'s recommended prevention method' }
    ]
  },

  // ----------------- REFEREE -------------------------
  {
    tag: segmentTags.segment,
    id: 'referee-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re here with referee {@referee} {@referee-lastname}. {@referee}, there\'s been some controversy about your calls tonight. How do you respond?' },
      { speaker: 'referee', content: 'Look, {@host}, I\'ve been officiating for {!referee-experience} and I stand by every call I made tonight.' },
      { speaker: 'Cohost', content: 'Even the one where you called a {!controversial-call}?' },
      { speaker: 'referee', content: 'Especially that one! The rule clearly states that {!made-up-rule}' },
      { speaker: 'Host', content: 'But fans are saying {!fan-complaint}' },
      { speaker: 'referee', content: 'Fans can say whatever they want, but I saw {!referee-justification} clear as day!' },
      { speaker: 'Cohost', content: 'What about when you {!referee-mistake}?' },
      { speaker: 'referee', content: 'That wasn\'t a mistake! That was {!referee-explanation}. I had to maintain order!' },
      { speaker: 'Host', content: 'Well, you certainly kept things interesting tonight, {@referee}.' }
    ],
    prompts: [
      { id: 'referee-experience', description: 'How long the referee ({@referee}) has been officiating' },
      { id: 'controversial-call', description: 'A controversial call the referee made during the game' },
      { id: 'made-up-rule', description: 'A ridiculous rule the referee claims justifies their controversial call' },
      { id: 'fan-complaint', description: 'What the fans are complaining about regarding the referee\'s performance' },
      { id: 'referee-justification', description: 'What the referee claims they saw to justify their call' },
      { id: 'referee-mistake', description: 'An obvious mistake the referee made during the game' },
      { id: 'referee-explanation', description: 'The referee\'s absurd explanation for their obvious mistake' }
    ]
  },

  // ----------------- COMMENTATOR -------------------------
  {
    tag: segmentTags.segment,
    id: 'commentator-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re joined by sports commentator {@commentator} {@commentator-lastname}. {@commentator}, you had quite the evening calling tonight\'s game!' },
      { speaker: 'commentator', content: 'Oh {@host}, what a night! I\'ve never seen anything like {!amazing-play} in my {!commentator-years} years of commentary!' },
      { speaker: 'Cohost', content: 'Your commentary during that moment was legendary. What exactly did you say?' },
      { speaker: 'commentator', content: 'I believe my exact words were: "{!memorable-call-out}"' },
      { speaker: 'Host', content: 'Classic! Do you have a signature catchphrase for moments like that?' },
      { speaker: 'commentator', content: 'Absolutely! Whenever something incredible happens, I always shout "{!signature-catchphrase}"' },
      { speaker: 'Cohost', content: 'And what about when things go wrong?' },
      { speaker: 'commentator', content: 'Well, when things get messy, I like to say "{!disaster-catchphrase}" It keeps the energy up!' },
      { speaker: 'Host', content: 'You really know how to keep the audience engaged, {@commentator}!' }
    ],
    prompts: [
      { id: 'amazing-play', description: 'An incredible play that happened during tonight\'s game' },
      { id: 'commentator-years', description: 'How many years the commentator ({@commentator}) has been doing commentary' },
      { id: 'memorable-call-out', description: 'The commentator\'s exciting call during the amazing play: {!amazing-play}' },
      { id: 'signature-catchphrase', description: 'The commentator\'s signature catchphrase for incredible moments' },
      { id: 'disaster-catchphrase', description: 'The commentator\'s catchphrase for when things go wrong during a game' }
    ]
  },

  // ----------------- SPORTSCASTER -------------------------
  {
    tag: segmentTags.segment,
    id: 'sportscaster-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'Let\'s go to sportscaster {@sportscaster} {@sportscaster-lastname} for the latest updates. {@sportscaster}, what\'s the word from the field?' },
      { speaker: 'sportscaster', content: 'Thanks {@host}! I\'m here where the energy is absolutely {!energy-description}! The players are {!player-state}' },
      { speaker: 'Cohost', content: 'Any breaking news from your end?' },
      { speaker: 'sportscaster', content: 'Actually yes! I\'ve just learned that {!breaking-sports-news}. This could change everything!' },
      { speaker: 'Host', content: 'Wow! What do the stats tell us about tonight?' },
      { speaker: 'sportscaster', content: 'The numbers are incredible! We\'re looking at {!fake-statistic-1} and {!fake-statistic-2}' },
      { speaker: 'Cohost', content: 'Those are some impressive figures!' },
      { speaker: 'sportscaster', content: 'And get this - the last time we saw numbers like this was {!historical-comparison}!' },
      { speaker: 'Host', content: 'Keep us posted, {@sportscaster}. Great work out there!' }
    ],
    prompts: [
      { id: 'energy-description', description: 'How to describe the energy at the sporting event' },
      { id: 'player-state', description: 'What the players are doing or how they\'re feeling right now' },
      { id: 'breaking-sports-news', description: 'Breaking news from the sporting event' },
      { id: 'fake-statistic-1', description: 'An impressive but absurd sports statistic' },
      { id: 'fake-statistic-2', description: 'Another impressive but absurd sports statistic' },
      { id: 'historical-comparison', description: 'When these kinds of numbers were last seen (make it ridiculous)' }
    ]
  },

  // ----------------- ATHLETE -------------------------
  {
    tag: segmentTags.segment,
    id: 'athlete-1',
    topic: 'sports',
    lines: [
      { speaker: 'Host', content: 'We\'re here with star athlete {@athlete} {@athlete-lastname}. {@athlete}, how did you prepare for tonight?' },
      { speaker: 'athlete', content: 'Well {@host}, my training regimen is pretty intense. Every morning I {!morning-routine}' },
      { speaker: 'Cohost', content: 'That sounds rigorous! What about your diet?' },
      { speaker: 'athlete', content: 'Nutrition is everything! I only eat {!weird-diet} because it gives me {!diet-benefit}' },
      { speaker: 'Host', content: 'Interesting approach! What\'s your secret to success?' },
      { speaker: 'athlete', content: 'The secret is {!success-secret}. My coach always says "{!coach-quote}"' },
      { speaker: 'Cohost', content: 'Any superstitions or pre-game rituals?' },
      { speaker: 'athlete', content: 'Oh absolutely! Before every game, I have to {!pre-game-ritual}. It\'s worked for {!ritual-duration}!' },
      { speaker: 'Host', content: 'Well, whatever you\'re doing, keep it up {@athlete}!' }
    ],
    prompts: [
      { id: 'morning-routine', description: 'The athlete\'s intense morning training routine' },
      { id: 'weird-diet', description: 'The athlete\'s unusual diet' },
      { id: 'diet-benefit', description: 'What benefit the athlete claims to get from their weird diet' },
      { id: 'success-secret', description: 'The athlete\'s secret to success' },
      { id: 'coach-quote', description: 'Motivational advice the athlete\'s coach always gives' },
      { id: 'pre-game-ritual', description: 'The athlete\'s pre-game superstition or ritual' },
      { id: 'ritual-duration', description: 'How long the athlete has been doing their pre-game ritual' }
    ]
  },

  // ----------------- VOTER -------------------------
  {
    tag: segmentTags.segment,
    id: 'voter-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'We\'re here with local voter {@voter} {@voter-lastname}. {@voter}, what are your thoughts on tonight\'s political developments?' },
      { speaker: 'voter', content: 'Well {@host}, I\'ve been voting for {!voting-duration} and I\'ve never seen anything like this!' },
      { speaker: 'Cohost', content: 'What issues matter most to you as a voter?' },
      { speaker: 'voter', content: 'The most important issue is definitely {!top-issue}. Nobody talks about it enough!' },
      { speaker: 'Host', content: 'How do you stay informed about the candidates?' },
      { speaker: 'voter', content: 'I get all my news from {!news-source}. They tell it like it is!' },
      { speaker: 'Cohost', content: 'Any advice for other voters?' },
      { speaker: 'voter', content: 'My advice is simple: {!voting-advice}. That\'s what democracy is all about!' },
      { speaker: 'Host', content: 'What would you tell the politicians watching tonight?' },
      { speaker: 'voter', content: 'I\'d tell them "{!message-to-politicians}"' },
      { speaker: 'Cohost', content: 'Strong words! Thank you {@voter}!' }
    ],
    prompts: [
      { id: 'voting-duration', description: 'How long the voter ({@voter}) has been voting' },
      { id: 'top-issue', description: 'The most important political issue according to the voter' },
      { id: 'news-source', description: 'Where the voter gets their political news (make it unusual)' },
      { id: 'voting-advice', description: 'The voter\'s advice for other voters' },
      { id: 'message-to-politicians', description: 'What the voter wants to tell politicians' }
    ]
  },

  // ----------------- PUNDIT -------------------------
  {
    tag: segmentTags.segment,
    id: 'pundit-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'We\'re joined by political pundit {@pundit} {@pundit-lastname}. {@pundit}, what\'s your take on this story?' },
      { speaker: 'pundit', content: 'This is exactly what I predicted in my book "{!book-title}" which came out {!book-timing}' },
      { speaker: 'Cohost', content: 'Really? You saw this coming?' },
      { speaker: 'pundit', content: 'Oh absolutely! The signs were all there: {!political-signs}. Anyone could have seen this!' },
      { speaker: 'Host', content: 'What do you think happens next?' },
      { speaker: 'pundit', content: 'Mark my words, within {!prediction-timeframe}, we\'ll see {!bold-prediction}' },
      { speaker: 'Cohost', content: 'That\'s quite a prediction! What\'s your confidence level?' },
      { speaker: 'pundit', content: 'I\'d stake my reputation on it! I\'ve been right about {!past-predictions}% of my predictions!' },
      { speaker: 'Host', content: 'And if you\'re wrong?' },
      { speaker: 'pundit', content: 'I\'m never wrong! But hypothetically, I\'d {!if-wrong-promise}' }
    ],
    prompts: [
      { id: 'book-title', description: 'The title of the pundit\'s book' },
      { id: 'book-timing', description: 'When the pundit\'s book came out (relative to current events)' },
      { id: 'political-signs', description: 'The signs that the pundit claims predicted tonight\'s political story' },
      { id: 'prediction-timeframe', description: 'How long until the pundit\'s prediction comes true' },
      { id: 'bold-prediction', description: 'The pundit\'s bold prediction about what will happen in {!prediction-timeframe}' },
      { id: 'past-predictions', description: 'What percentage of predictions the pundit claims to get right' },
      { id: 'if-wrong-promise', description: 'What the pundit promises to do if their prediction is wrong' }
    ]
  },

  // ----------------- ADVISOR -------------------------
  {
    tag: segmentTags.segment,
    id: 'advisor-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'We have political advisor {@advisor} {@advisor-lastname} here with us. {@advisor}, you\'ve advised {!advisee-type}. What\'s your take?' },
      { speaker: 'advisor', content: 'Well {@host}, in my {!advisor-experience} years of experience, the key is always {!political-strategy}' },
      { speaker: 'Cohost', content: 'What would you advise in this situation?' },
      { speaker: 'advisor', content: 'The smart move here is to {!strategic-advice}. It\'s Political Strategy 101!' },
      { speaker: 'Host', content: 'Have you ever dealt with a situation like this before?' },
      { speaker: 'advisor', content: 'Oh yes! Back in {!past-year}, I helped {!past-client} when they faced {!past-crisis}' },
      { speaker: 'Cohost', content: 'How did that turn out?' },
      { speaker: 'advisor', content: 'Complete success! We {!past-solution} and their approval rating went up {!approval-increase}%!' },
      { speaker: 'Host', content: 'Any final thoughts for our viewers?' },
      { speaker: 'advisor', content: 'Remember folks, in politics {!political-wisdom}. That\'s the only way forward!' }
    ],
    prompts: [
      { id: 'advisee-type', description: 'What type of politicians the advisor has worked with (mayors, senators, etc.)' },
      { id: 'advisor-experience', description: 'How many years of political advising experience they have' },
      { id: 'political-strategy', description: 'The advisor\'s key to political success' },
      { id: 'strategic-advice', description: 'What the advisor recommends for the current situation' },
      { id: 'past-year', description: 'A year when the advisor handled a similar situation' },
      { id: 'past-client', description: 'A politician the advisor previously helped' },
      { id: 'past-crisis', description: 'The crisis the advisor helped their past client with' },
      { id: 'past-solution', description: 'How the advisor solved the past crisis' },
      { id: 'approval-increase', description: 'How much the approval rating increased (make it absurd)' },
      { id: 'political-wisdom', description: 'The advisor\'s political wisdom for viewers' }
    ]
  },

  // ----------------- LOBBYIST -------------------------
  {
    tag: segmentTags.segment,
    id: 'lobbyist-1',
    topic: 'politics',
    lines: [
      { speaker: 'Host', content: 'Joining us now is lobbyist {@lobbyist} {@lobbyist-lastname}, representing the {!organization-name}. {@lobbyist}, how does tonight\'s story affect your interests?' },
      { speaker: 'lobbyist', content: 'Thanks for having me, {@host}. This story directly impacts our mission to {!organization-mission}' },
      { speaker: 'Cohost', content: 'What changes would you like to see?' },
      { speaker: 'lobbyist', content: 'We\'re pushing for legislation that would {!proposed-law}. It\'s common sense!' },
      { speaker: 'Host', content: 'Some people say lobbyists have too much influence. How do you respond?' },
      { speaker: 'lobbyist', content: 'That\'s ridiculous! We\'re just concerned citizens who happen to {!lobbyist-activity}. There\'s nothing wrong with that!' },
      { speaker: 'Cohost', content: 'What\'s next for your organization?' },
      { speaker: 'lobbyist', content: 'Next week we\'re meeting with {!politician-target} to discuss {!meeting-topic}' },
      { speaker: 'Host', content: 'Any message for lawmakers watching tonight?' },
      { speaker: 'lobbyist', content: 'Remember, {!lobbyist-message}. The people are counting on you!' }
    ],
    prompts: [
      { id: 'organization-name', description: 'The name of the organization the lobbyist represents' },
      { id: 'organization-mission', description: 'The mission of the lobbyist\'s organization' },
      { id: 'proposed-law', description: 'What legislation the lobbyist wants to see passed' },
      { id: 'lobbyist-activity', description: 'What the lobbyist claims they do (instead of admitting to lobbying)' },
      { id: 'politician-target', description: 'A politician the lobbyist is meeting with next week' },
      { id: 'meeting-topic', description: 'What the lobbyist will discuss in their upcoming meeting' },
      { id: 'lobbyist-message', description: 'The lobbyist\'s message to lawmakers' }
    ]
  },

  // ----------------- PROSECUTOR -------------------------
  {
    tag: segmentTags.segment,
    id: 'prosecutor-1',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'We\'re here with prosecutor {@prosecutor} {@prosecutor-lastname}. {@prosecutor}, what charges are you considering?' },
      { speaker: 'prosecutor', content: 'We\'re looking at {!charge-list}. This is a serious matter, {@host}' },
      { speaker: 'Cohost', content: 'How strong is your case?' },
      { speaker: 'prosecutor', content: 'We have {!evidence-type} that clearly shows {!evidence-claim}. It\'s an open and shut case!' },
      { speaker: 'Host', content: 'What\'s the most damning piece of evidence?' },
      { speaker: 'prosecutor', content: 'I can\'t reveal everything, but let\'s just say we found {!key-evidence} at the scene' },
      { speaker: 'Cohost', content: 'When will this go to trial?' },
      { speaker: 'prosecutor', content: 'We expect to be in court within {!trial-timeline}. Justice will be served!' },
      { speaker: 'Host', content: 'Any message for the community?' },
      { speaker: 'prosecutor', content: 'This sends a clear message: {!prosecutor-message}. We will not tolerate this behavior!' }
    ],
    prompts: [
      { id: 'charge-list', description: 'The charges the prosecutor is considering' },
      { id: 'evidence-type', description: 'What type of evidence the prosecutor has' },
      { id: 'evidence-claim', description: 'What the prosecutor claims the evidence proves' },
      { id: 'key-evidence', description: 'The most important piece of evidence found at the scene' },
      { id: 'trial-timeline', description: 'When the case will go to trial' },
      { id: 'prosecutor-message', description: 'The prosecutor\'s message to the community' }
    ]
  },

  // ----------------- DEFENSE -------------------------
  {
    tag: segmentTags.segment,
    id: 'defense-1',
    topic: 'crime',
    lines: [
      { speaker: 'Host', content: 'Now we hear from defense attorney {@defense} {@defense-lastname}. {@defense}, how do you plan to defend your client?' },
      { speaker: 'defense', content: 'My client is {!innocence-claim}, {@host}. The real story here is {!alternative-theory}' },
      { speaker: 'Cohost', content: 'But what about the evidence the prosecution has?' },
      { speaker: 'defense', content: 'That so-called evidence is {!evidence-dismissal}. Any competent investigation would show {!counter-evidence}' },
      { speaker: 'Host', content: 'Do you have an alibi for your client?' },
      { speaker: 'defense', content: 'Absolutely! At the time of the incident, my client was {!alibi-claim} with {!alibi-witness}' },
      { speaker: 'Cohost', content: 'What\'s your strategy going into trial?' },
      { speaker: 'defense', content: 'We\'re going to prove that {!defense-strategy}. The jury will see the truth!' },
      { speaker: 'Host', content: 'Confident words! Any final thoughts?' },
      { speaker: 'defense', content: 'In America, {!legal-principle}. My client deserves justice, not a witch hunt!' }
    ],
    prompts: [
      { id: 'innocence-claim', description: 'How the defense attorney claims their client is innocent' },
      { id: 'alternative-theory', description: 'The defense attorney\'s alternative explanation for what really happened' },
      { id: 'evidence-dismissal', description: 'How the defense attorney dismisses the prosecution\'s evidence' },
      { id: 'counter-evidence', description: 'Evidence the defense claims supports their client\'s innocence' },
      { id: 'alibi-claim', description: 'What the client was allegedly doing during the crime' },
      { id: 'alibi-witness', description: 'Who can allegedly verify the client\'s alibi' },
      { id: 'defense-strategy', description: 'The defense attorney\'s strategy for proving innocence' },
      { id: 'legal-principle', description: 'A legal principle the defense attorney invokes' }
    ]
  },
]
