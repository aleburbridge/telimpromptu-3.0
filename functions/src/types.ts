export interface RoomData {
    id: string;
    roomName: string;
    roomNameLower: string;
    password: string;
    segmentIds: string[] | null;
    responses: any[];
    headlineWriterId: string | null;
    headline: string | null;
    isJoinable: boolean;
    topic: string | null;
    teleprompterSpeed: number;
    currentPage: number | null;
    gamesPlayed: number;
    createdAt: FirebaseFirestore.Timestamp | Date;
    [key: string]: any;
  }
  
  export interface Segment {
    id: string;
    tag: string;
    topic: string;
    lines: ScriptLine[];
    prompts: PromptObject[];
  }
  
  export interface Script {
    lines: ScriptLine[];
    prompts: PromptObject[];
  }
  
  export interface Player {
    id: string;
    name: string;
    topicVote: string;
    role?: string;
  }
  
  export interface Prompt {
    id?: string;
    text?: string;
    groupId?: string;
  }
  
  export interface PromptObject {
    id?: string;
    description?: string;
    subPrompts?: PromptObject[];
    groupId?: string;
  }
  
  export interface ScriptLine {
    speaker: string;
    content: string;
  }