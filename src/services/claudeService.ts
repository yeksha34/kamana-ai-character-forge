
import { CharacterField, Platform, TagMeta } from "../types";
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeService {
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.VITE_CLAUDE_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });
    }
  }

  private getModelId(pseudoId?: string) {
    if (pseudoId === 'claude-3-5-sonnet-latest') return 'claude-3-5-sonnet-20241022';
    if (pseudoId === 'claude-3-opus-20240229') return 'claude-3-opus-20240229';
    return 'claude-3-5-haiku-20241022';
  }

  private constructNSFWInstruction(isNSFW: boolean, tags: TagMeta[]): string {
    if (!isNSFW) return "";
    
    const coreLogic = tags.filter(t => t.id.startsWith('logic'));
    let instructions = "NSFW MODE: ACTIVE. Be visceral and explicit where the vision demands.";
    
    if (coreLogic.length > 0) {
      instructions += " BEHAVIORAL OVERRIDES: " + coreLogic.map(t => t.textGenerationRule).join(' ');
    }
    
    return instructions;
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId?: string }): Promise<string> {
    if (!this.anthropic) return params.prompt;
    const { prompt, tags, isNSFW, modelId } = params;
    
    const tagRules = tags.map(t => `${t.name}: ${t.textGenerationRule}`).join('; ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);

    const system = `You are a Master Prompt Engineer for Roleplay AI. 
    Transform the user vision into a high-fidelity, descriptive prompt. 
    INCORPORATE THESE SPECIFIC BEHAVIOR RULES: ${tagRules}.
    ${nsfwPart}
    Output ONLY the modified prompt text. No preamble.`;

    const response = await this.anthropic.messages.create({
      model: this.getModelId(modelId),
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: `User Vision: "${prompt}"` }]
    });
    return (response.content[0] as any).text.trim();
  }

  async generatePlatformContent(params: { 
    modifiedPrompt: string, 
    platforms: Platform[], 
    platformRequirements: { platform: string, fields: string[] }[],
    existingFields: CharacterField[],
    isNSFW: boolean,
    tags: TagMeta[],
    modelId?: string 
  }) {
    if (!this.anthropic) return { name: "Error", fields: [] };
    const { modifiedPrompt, platformRequirements, existingFields, isNSFW, tags, modelId } = params;

    const lockedContext = existingFields.filter(f => f.isLocked).map(f => `${f.label}:${f.value}`).join('|');
    const fieldMapping = platformRequirements.map(p => `For ${p.platform}, generate: [${p.fields.join(', ')}]`).join('. ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);
    
    const system = `Roleplay Character Architect. 
    GENERATE IMMERSIVE CONTENT BASED ON THIS REFINED VISION: "${modifiedPrompt}".
    FIELD ADHERENCE: ${fieldMapping}.
    RESPECT LOCKED DATA: ${lockedContext}.
    ${nsfwPart}
    Output JSON ONLY. Format: { "name": "...", "fields": [{ "label": "...", "value": "..." }] }`;

    const response = await this.anthropic.messages.create({
      model: this.getModelId(modelId),
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: "Construct character data." }]
    });
    const text = (response.content[0] as any).text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
  }

  async generateImagePrompt(params: { prompt: string, type: 'character' | 'scenario', isNSFW: boolean, modelId?: string }): Promise<string> {
    if (!this.anthropic) return `Atmospheric ${params.type} based on ${params.prompt}`;
    const { prompt, type, isNSFW, modelId } = params;

    const system = `You generate professional Midjourney-style image prompts for ${type === 'character' ? 'a portrait' : 'an environment'}. 
    Focus on cinematic lighting, style, and physical details based on this vision: "${prompt}".
    ${isNSFW ? 'ADULT CONTENT MODE: Be explicit and detailed with erotic or anatomical descriptors.' : ''}
    Output ONLY the image prompt string.`;

    const response = await this.anthropic.messages.create({
      model: this.getModelId(modelId),
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: `Create prompt for ${type}` }]
    });
    return (response.content[0] as any).text.trim();
  }

  async generateAIDungeonCards(params: { prompt: string, isNSFW: boolean, modelId?: string }) {
    if (!this.anthropic) return [];
    const { prompt, isNSFW, modelId } = params;

    const system = `Analyze this roleplay vision and identify key World Information Cards for AIDungeon.
    Create cards for: Characters, Locations, Factions, or Lore.
    ${isNSFW ? 'ADULT MODE: Do not omit mature lore details.' : ''}
    Output JSON ONLY: { "cards": [{ "label": "...", "content": "..." }] }`;

    const response = await this.anthropic.messages.create({
      model: this.getModelId(modelId),
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: `Identify cards for: "${prompt}"` }]
    });
    const text = (response.content[0] as any).text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{"cards":[]}').cards;
  }

  async generateSystemRules(params: { prompt: string, tags: TagMeta[], content: string, isNSFW: boolean, modelId?: string }): Promise<string> {
    if (!this.anthropic) return "";
    const { tags, content, isNSFW, modelId } = params;

    const tagSummary = tags.map(t => t.textGenerationRule).join('\n');
    const nsfwInstruction = this.constructNSFWInstruction(isNSFW, tags);

    const system = `You are a Bot Logic Architect.
    Construct a platform-agnostic SYSTEM INFORMATION block.
    This defines constraints, logic, and tone for the AI model playing the bot.
    BEHAVIOR RULES TO ENFORCE:
    ${tagSummary}
    
    ${nsfwInstruction}
    
    Output the block wrapped in [SYSTEM INFORMATION: ...].`;

    const response = await this.anthropic.messages.create({
      model: this.getModelId(modelId),
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: `Construct logic for character content: ${content.substring(0, 500)}...` }]
    });
    return (response.content[0] as any).text.trim();
  }

  async generateImage(params: any) { return null; }
}
