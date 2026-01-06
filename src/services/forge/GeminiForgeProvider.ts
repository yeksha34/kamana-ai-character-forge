import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform, TagMeta, AIDungeonCard, MessageLength } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class GeminiForgeProvider implements ForgeProvider {
  setApiKey(key: string): void {}

  private getClient() {
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

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string, useWebResearch?: boolean, responseLength?: MessageLength }): Promise<any> {
    const { prompt, tags, isNSFW, modelId, useWebResearch, responseLength } = params;
    const ai = this.getClient();
    const tagRules = tags.map(t => `[${t.textGenerationRule}]`).join(' ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);
    
    const lengthMap: Record<MessageLength, string> = {
      [MessageLength.SHORT]: "Keep response very brief, under 50 words.",
      [MessageLength.MEDIUM]: "Provide a standard response, around 100-150 words.",
      [MessageLength.LARGE]: "Write a detailed, multi-paragraph response exceeding 300 words."
    };
    const lengthRule = responseLength ? lengthMap[responseLength] : "";

    const systemInstruction = `Roleplay Agent. Rules: ${tagRules}. ${nsfwPart}. ${lengthRule}. Output ONLY character dialogue/actions.`;

    const config: any = { systemInstruction, temperature: 0.9 };
    if (useWebResearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config
    });

    const text = response.text?.trim() || prompt;
    if (useWebResearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      return { text, groundingChunks: response.candidates[0].groundingMetadata.groundingChunks };
    }
    return text;
  }

  async generatePlatformContent(params: any): Promise<any> {
    const { modifiedPrompt, platformRequirements, isNSFW, tags, modelId, useWebResearch } = params;
    const ai = this.getClient();
    const fieldMapping = platformRequirements.map((p: any) => `For ${p.platform}, generate: [${p.fields.join(', ')}]`).join('. ');
    const nsfwPart = this.constructNSFWInstruction(isNSFW, tags);
    const systemInstruction = `Character Architect. Fields: ${fieldMapping}. ${nsfwPart}. JSON ONLY.`;

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
    if (useWebResearch) config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({ model: modelId, contents: modifiedPrompt, config });
    const result = JSON.parse(response.text || '{}');
    if (useWebResearch && response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      return { data: result, groundingChunks: response.candidates[0].groundingMetadata.groundingChunks };
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
      return `data:image/png;base64,${response.generatedImages[0].image.imageBytes}`;
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
    const systemInstruction = `Logic Architect. Rule Constraints: \n${tagSummary}\n. ${isNSFW ? 'NSFW: Yes.' : ''}`;
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Construct logic for: ${content.substring(0, 300)}...`,
      config: { systemInstruction }
    });
    return response.text?.trim() || "";
  }
}