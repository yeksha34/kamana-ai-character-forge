
export enum Platform {
  CRUSHON_AI = 'CrushonAI',
  AI_DUNGEON = 'AIDungeon',
  JANITOR_AI = 'JanitorAI',
  GENERIC = 'Generic'
}

export type ContentFormat = 'markdown' | 'html' | 'plaintext';

export interface CharacterField {
  id: string;
  label: string;
  value: string;
  isLocked: boolean;
  format: ContentFormat;
  placeholder?: string;
}

export interface CharacterData {
  id?: string;
  name: string;
  fields: CharacterField[];
  characterImageUrl: string;
  scenarioImageUrl: string;
  isCharacterImageLocked: boolean;
  isScenarioImageLocked: boolean;
  tags: string[];
  isNSFW: boolean;
  createdAt?: number;
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
