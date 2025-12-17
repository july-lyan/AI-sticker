
export interface StickerPrompt {
  id: string;
  label: string;
  prompt: string;
}

export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedSticker {
  id: string;
  url: string; // Base64 data URL
  status: GenerationStatus;
}

export type StickerCategory = 'female' | 'male' | 'child' | 'elder' | 'pet' | 'couple' | 'duo' | 'family' | 'human_pet';

export interface StickerTemplate {
  label: string;
  prompts: StickerPrompt[];
}

export type StickerStyleId = 'popart' | 'manga' | 'game' | 'ancient' | '3d' | 'pixel' | 'cyberpunk' | 'papercut';

export interface StyleDefinition {
  id: StickerStyleId;
  label: string;
  description: string; // Prompt instruction for the model
}

export type GenerationMode = 'random' | 'custom' | 'comic';
