
export enum Platform {
  CRUSHON_AI = 'CrushonAI',
  AI_DUNGEON = 'AIDungeon',
  JANITOR_AI = 'JanitorAI',
  GENERIC = 'Generic'
}

export enum AIProvider {
  GEMINI = 'Gemini',
  CLAUDE = 'Claude',
  OPENAI = 'OpenAI',
  MISTRAL = 'Mistral',
  GROQ = 'Groq',
  TOGETHER = 'Together',
  FIREWORKS = 'Fireworks',
  HUGGINGFACE = 'HuggingFace',
  STABILITY = 'Stability',
  REPLICATE = 'Replicate',
  RUNPOD = 'RunPod'
}

export enum Theme {
  DEFAULT = 'default',
  SOFTCORE = 'softcore',
  HARDCORE = 'hardcore'
}

export enum Context {
  DESIRE = 'desire',
  IMAGINATION = 'imagination',
  STUDIO = 'studio',
  CANVAS = 'canvas'
}

export enum Target {
  BODY = 'body',
  MIND = 'mind',
  LINEAGE = 'lineage',
  GOD = 'god',
  STATUS = 'status',
  OBJECTIFICATION = 'objectification',
  SOCIAL = 'social',
  SELF = 'self'
}

export interface ProfanityWord {
  word: string;
  // Fix: Added 'hi' to the permitted language types
  language: 'en' | 'mr' | 'hi';
  contexts: Context[];
  themes: Theme[];
  targets: Target[];
  weight?: number;
}

export interface AIModelMeta {
  id: string;
  name: string;
  isFree: boolean;
  provider: AIProvider;
  type: 'text' | 'image';
}

export interface AISecret {
  id: string;
  provider: AIProvider;
  encryptedKey: string;
  lastFour: string;
  updatedAt: number; // For rotation tracking
}

export interface TagMeta {
  id: string;
  name: string;
  textGenerationRule: string;
  imageGenerationRule: string;
  isNSFW: boolean;
}

export interface CharacterField {
  id: string;
  label: string;
  value: string;
  isLocked: boolean;
  format: 'markdown' | 'html' | 'plaintext';
  placeholder?: string;
}

export interface AIDungeonCard {
  label: string;
  content: string;
}

export type CharacterStatus = 'draft' | 'finalized';

export interface CharacterData {
  id?: string;
  parentBotId?: string;
  version: number;
  status: CharacterStatus;
  name: string;
  fields: CharacterField[];
  characterImageUrl: string;
  scenarioImageUrl: string;
  isCharacterImageLocked: boolean;
  isScenarioImageLocked: boolean;
  tags: string[];
  isNSFW: boolean;
  createdAt?: number;
  originalPrompt: string; 
  modifiedPrompt?: string; 
  characterImagePrompt?: string; 
  scenarioImagePrompt?: string; 
  worldInfo?: AIDungeonCard[];
  systemRules?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
}

export interface PlatformConfig {
  name: Platform;
  fields: string[];
}

export const PLATFORMS_CONFIG: Record<Platform, PlatformConfig> = {
  [Platform.CRUSHON_AI]: {
    name: Platform.CRUSHON_AI,
    fields: ['Personality', 'Description', 'Scenario', 'First Message', 'Example Dialogue']
  },
  [Platform.AI_DUNGEON]: {
    name: Platform.AI_DUNGEON,
    fields: ['World Info', 'Plot', 'Character Description', 'Initial Prompt']
  },
  [Platform.JANITOR_AI]: {
    name: Platform.JANITOR_AI,
    fields: ['Personality', 'Scenario', 'Initial Message', 'Global Context']
  },
  [Platform.GENERIC]: {
    name: Platform.GENERIC,
    fields: ['Summary', 'Backstory', 'Traits', 'Core Loop']
  }
};