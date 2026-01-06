import { CharacterField, Platform, TagMeta, AIDungeonCard, MessageLength } from "../../types";

export interface ForgeProvider {
  setApiKey(key: string): void;

  refinePrompt(params: { 
    prompt: string, 
    tags: TagMeta[], 
    isNSFW: boolean, 
    modelId: string,
    useWebResearch?: boolean,
    responseLength?: MessageLength
  }): Promise<any>;

  generatePlatformContent(params: { 
    modifiedPrompt: string, 
    platforms: Platform[], 
    platformRequirements: { platform: string, fields: string[] }[],
    existingFields: CharacterField[],
    isNSFW: boolean,
    tags: TagMeta[],
    modelId: string,
    useWebResearch?: boolean
  }): Promise<any>;

  generateImagePrompt(params: { 
    prompt: string, 
    type: 'character' | 'scenario', 
    isNSFW: boolean, 
    modelId: string 
  }): Promise<string>;

  generateImage(params: { 
    prompt: string, 
    isNSFW: boolean, 
    modelId: string 
  }): Promise<string | null>;

  generateAIDungeonCards(params: { 
    prompt: string, 
    isNSFW: boolean, 
    modelId: string 
  }): Promise<AIDungeonCard[]>;

  generateSystemRules(params: { 
    prompt: string, 
    tags: TagMeta[], 
    content: string, 
    isNSFW: boolean, 
    modelId: string 
  }): Promise<string>;
}