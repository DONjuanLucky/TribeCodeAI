export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  CONVERSATION = 'CONVERSATION',
  BUILDING = 'BUILDING', // The "Lock-In" phase
  PREVIEW = 'PREVIEW',
}

export interface PrdStructure {
  projectName: string;
  tagline: string;
  summary: string;
  features: string[];
  techStack: string[];
  colorPalette: string[];
  version: number;
  changeLog: string; // "Added dark mode", "Initial Draft", etc.
}