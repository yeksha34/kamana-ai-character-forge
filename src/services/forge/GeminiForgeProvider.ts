
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class GeminiForgeProvider implements ForgeProvider {
  // Guidelines: Obtaining the API key exclusively from process.env.API_KEY.
  // The client initialization strictly uses process.env.API_KEY.

  setApiKey(key: string): void {
    // Guidelines: Gemini API key must be obtained exclusively from process.env.API_KEY.
    // External key setting is ignored for Gemini to maintain strict environmental compliance.
  }

  private getClient() {
    // Guidelines: Always use process.env.API_KEY directly for initializing the GoogleGenAI instance.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private constructNSFWInstruction(isNSFW: boolean, tags: TagMeta[]): string {
    if (!isNSFW) return "";
    const coreLogic = tags.filter(t => t.id.startsWith('logic'));
    let instructions = "NSFW MODE: ACTIVE. Be visceral and explicit.";
    if (coreLogic.length > 0) {
      instructions += " BEHAVIORAL OVERRIDES: " + coreLogic.map(t => `[${t.textGenerationRule}]`).join(' ');
    }
    return instructions;
  }

  // Updated to support useWebResearch via googleSearch tool and return grounding chunks
  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string, useWebResearch?: boolean }): Promise<any> {
    const { prompt, tags, isNSFW, modelId, useWebResearch } = params;
    const ai = this.getClient();
    const tagRules = tags.map(t => `[${t.textGenerationRule}]`).join(' ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);
    const systemInstruction = `Prompt Engineer. Incorporate behavior logic: ${tagRules}. ${nsfwPart}. Output ONLY refined text.`;

    const config: any = { systemInstruction, temperature: 0.9 };
    // Inject googleSearch tool if web research is enabled
    if (useWebResearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `User Vision: "${prompt}"`,
      config
    });

    const text = response.text?.trim() || prompt;
    // Extract grounding metadata if search was used
    if (useWebResearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      return {
        text,
        groundingChunks: response.candidates[0].groundingMetadata.groundingChunks
      };
    }
    return text;
  }

  // Updated to support useWebResearch and return grounding data
  async generatePlatformContent(params: { 
    modifiedPrompt: string, 
    platforms: Platform[], 
    platformRequirements: { platform: string, fields: string[] }[],
    existingFields: CharacterField[],
    isNSFW: boolean,
    tags: TagMeta[],
    modelId: string,
    useWebResearch?: boolean 
  }): Promise<any> {
    const { modifiedPrompt, platformRequirements, isNSFW, tags, modelId, useWebResearch } = params;
    const ai = this.getClient();
    const fieldMapping = platformRequirements.map((p: any) => `For ${p.platform}, generate: [${p.fields.join(', ')}]`).join('. ');
    const tagRules = tags.map((t: any) => `[${t.textGenerationRule}]`).join(' ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);
    const systemInstruction = `Character Architect. Vision: "${modifiedPrompt}". Enforce Rules: ${tagRules}. Fields: ${fieldMapping}. ${nsfwPart}. JSON ONLY.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        fields: {
          type: Type.ARRAY,
          items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } } }
        }
      },
      required: ["name", "fields"]
    };

    const config: any = { systemInstruction, responseMimeType: "application/json", responseSchema: schema };
    // Inject googleSearch tool if web research is enabled
    if (useWebResearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: "Generate character data.",
      config
    });

    const result = JSON.parse(response.text || '{}');
    // Extract grounding metadata if search was used
    if (useWebResearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      return {
        data: result,
        groundingChunks: response.candidates[0].groundingMetadata.groundingChunks
      };
    }
    return result;
  }

  async generateImagePrompt(params: any): Promise<string> {
    const { prompt, type, isNSFW, modelId } = params;
    const ai = this.getClient();
    const systemInstruction = `Image Prompt Gen for ${type}. Vision: "${prompt}". ${isNSFW ? 'NSFW: Yes.' : ''} STRING ONLY.`;
    const response = await ai.models.generateContent({ model: modelId, contents: `Create prompt for ${type}`, config: { systemInstruction } });
    return response.text?.trim() || prompt;
  }

  async generateImage(params: any) {
    const { prompt, isNSFW, modelId } = params;
    const ai = this.getClient();
    if (modelId.startsWith('imagen-')) {
      const response = await ai.models.generateImages({
        model: modelId,
        prompt: `${prompt}. ${isNSFW ? 'NSFW allowed' : ''}. Cinematic.`,
        config: { numberOfImages: 1, aspectRatio: '1:1' },
      });
      const base64EncodeString: string = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64EncodeString}`;
    }
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: [{ text: `${prompt}. ${isNSFW ? 'NSFW allowed' : ''}. Cinematic.` }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return null;
  }

  async generateAIDungeonCards(params: any) {
    const { prompt, modelId } = params;
    const ai = this.getClient();
    const schema = {
      type: Type.OBJECT,
      properties: {
        cards: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, content: { type: Type.STRING } } } }
      },
      required: ["cards"]
    };
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Identify cards for: "${prompt}"`,
      config: { responseMimeType: "application/json", responseSchema: schema }
    });
    return JSON.parse(response.text || '{"cards":[]}').cards;
  }

  async generateSystemRules(params: any): Promise<string> {
    const { tags, content, isNSFW, modelId } = params;
    const ai = this.getClient();
    const tagSummary = tags.map((t: any) => `[${t.textGenerationRule}]`).join('\n');
    const systemInstruction = `Logic Architect. Enforce behaviors: \n${tagSummary}\n ${isNSFW ? 'NSFW: Yes.' : ''} Wrap in [SYSTEM INFORMATION: ...].`;
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Construct logic for: ${content.substring(0, 300)}...`,
      config: { systemInstruction }
    });
    return response.text?.trim() || "";
  }
}
