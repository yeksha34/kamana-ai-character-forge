
import { CharacterField, Platform, TagMeta } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private constructNSFWInstruction(isNSFW: boolean, tags: TagMeta[]): string {
    if (!isNSFW) return "";
    
    // Core behavior modifiers integrated into the tag system (IDs starting with 'logic')
    const coreLogic = tags.filter(t => t.id.startsWith('logic'));
    let instructions = "NSFW MODE: ACTIVE. Be uninhibited, visceral, and explicit where the vision demands.";
    
    if (coreLogic.length > 0) {
      instructions += " BEHAVIORAL OVERRIDES: " + coreLogic.map(t => t.textGenerationRule).join(' ');
    }
    
    return instructions;
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId?: string }): Promise<string> {
    const { prompt, tags, isNSFW, modelId } = params;
    const ai = this.getClient();
    
    const tagRules = tags.map(t => `${t.name}: ${t.textGenerationRule}`).join('; ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);

    const systemInstruction = `You are a Master Prompt Engineer for Roleplay AI. 
    Transform the user vision into a high-fidelity, descriptive prompt. 
    INCORPORATE THESE SPECIFIC BEHAVIOR RULES: ${tagRules}.
    ${nsfwPart}
    Output ONLY the modified prompt text. No preamble.`;

    const response = await ai.models.generateContent({
      model: modelId || 'gemini-3-flash-preview',
      contents: `User Vision: "${prompt}"`,
      config: { systemInstruction, temperature: 0.9 }
    });

    return response.text?.trim() || prompt;
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
    const { modifiedPrompt, platforms, platformRequirements, existingFields, isNSFW, tags, modelId } = params;
    const ai = this.getClient();

    const lockedContext = existingFields.filter(f => f.isLocked).map(f => `${f.label}:${f.value}`).join('|');
    const fieldMapping = platformRequirements.map(p => `For ${p.platform}, generate: [${p.fields.join(', ')}]`).join('. ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);

    const systemInstruction = `Roleplay Character Architect. 
    GENERATE IMMERSIVE CONTENT BASED ON THIS REFINED VISION: "${modifiedPrompt}".
    FIELD ADHERENCE: ${fieldMapping}.
    RESPECT LOCKED DATA: ${lockedContext}.
    ${nsfwPart}
    Output JSON ONLY.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        fields: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING }
            }
          }
        }
      },
      required: ["name", "fields"]
    };

    const response = await ai.models.generateContent({
      model: modelId || 'gemini-3-flash-preview',
      contents: `Generate data for platforms: ${platforms.join(',')}`,
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
    });

    return JSON.parse(response.text || '{}');
  }

  async generateImagePrompt(params: { prompt: string, type: 'character' | 'scenario', isNSFW: boolean, modelId?: string }): Promise<string> {
    const { prompt, type, isNSFW, modelId } = params;
    const ai = this.getClient();
    const systemInstruction = `You generate professional Midjourney-style image prompts for ${type === 'character' ? 'a portrait' : 'an environment'}. 
    Focus on cinematic lighting, style, composition, and physical details based on this vision: "${prompt}".
    ${isNSFW ? 'ADULT CONTENT MODE: Be explicit and detailed with erotic or anatomical descriptors.' : ''}
    Output ONLY the image prompt string.`;

    const response = await ai.models.generateContent({
      model: modelId || 'gemini-3-flash-preview',
      contents: `Create prompt for ${type}`,
      config: { systemInstruction }
    });

    return response.text?.trim() || `Atmospheric ${type} based on ${prompt}`;
  }

  async generateImage(params: { prompt: string, isNSFW: boolean, modelId?: string }) {
    const { prompt, isNSFW, modelId } = params;
    const ai = this.getClient();
    const modelToUse = modelId || 'gemini-2.5-flash-image';
    const nsfwTag = isNSFW ? 'NSFW allowed' : ''; // Mention only if true

    if (modelToUse.startsWith('imagen-')) {
      const response = await ai.models.generateImages({
        model: modelToUse,
        prompt: `${prompt}. ${nsfwTag}. Cinematic, masterpiece.`,
        config: { numberOfImages: 1, aspectRatio: '1:1' },
      });
      const base64EncodeString: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64EncodeString}`;
    }

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts: [{ text: `${prompt}. ${nsfwTag}. Cinematic, masterpiece.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }

  async generateAIDungeonCards(params: { prompt: string, isNSFW: boolean, modelId?: string }) {
    const { prompt, isNSFW, modelId } = params;
    const ai = this.getClient();
    const systemInstruction = `Analyze this roleplay vision and identify key World Information Cards for AIDungeon.
    Create cards for: Characters, Locations, Factions, or Lore.
    ${isNSFW ? 'ADULT MODE: Do not omit mature lore details.' : ''}
    Output JSON ONLY.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        cards: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              content: { type: Type.STRING }
            }
          }
        }
      },
      required: ["cards"]
    };

    const response = await ai.models.generateContent({
      model: modelId || 'gemini-3-flash-preview',
      contents: `Identify cards for: "${prompt}"`,
      config: { systemInstruction, responseMimeType: "application/json", responseSchema: schema }
    });

    return JSON.parse(response.text || '{"cards":[]}').cards;
  }

  async generateSystemRules(params: { prompt: string, tags: TagMeta[], content: string, isNSFW: boolean, modelId?: string }): Promise<string> {
    const { tags, content, isNSFW, modelId } = params;
    const ai = this.getClient();
    
    const tagSummary = tags.map(t => t.textGenerationRule).join('\n');
    const nsfwInstruction = this.constructNSFWInstruction(isNSFW, tags);

    const systemInstruction = `You are a Bot Logic Architect.
    Construct a platform-agnostic SYSTEM INFORMATION block.
    This defines constraints, logic, and tone for the AI model playing the bot.
    BEHAVIOR RULES TO ENFORCE:
    ${tagSummary}
    
    ${nsfwInstruction}
    
    Output the block wrapped in [SYSTEM INFORMATION: ...].`;

    const response = await ai.models.generateContent({
      model: modelId || 'gemini-3-flash-preview',
      contents: `Construct logic for character content: ${content.substring(0, 500)}...`,
      config: { systemInstruction }
    });

    return response.text?.trim() || "";
  }
}
