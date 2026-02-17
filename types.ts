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
  changeLog: string; 
  roadmap: string[]; // Future milestones and feature steps
  marketAnalysis?: string; // Competitive landscape or user demographic
  uiUxDirection?: string; // Visual style and motion guidelines
}