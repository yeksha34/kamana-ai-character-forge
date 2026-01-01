
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform } from "../types";

export class ClaudeService {
  private getModelMapping(pseudoModel?: string): string {
    const mapping: Record<string, string> = {
      'claude-3-5-sonnet': 'gemini-3-pro-preview',
      'claude-3-opus': 'gemini-3-pro-preview',
      'claude-3-haiku': 'gemini-3-flash-preview',
    };
    return (pseudoModel && mapping[pseudoModel]) ? mapping[pseudoModel] : 'gemini-3-pro-preview';
  }

  async generateCharacterText(params: {
    prompt: string;
    platforms: Platform[];
    isNSFW: boolean;
    tags: string[];
    existingFields: CharacterField[];
    selectedModel?: string;
  }) {
    const { prompt, platforms, isNSFW, tags, existingFields, selectedModel } = params;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const lockedFields = existingFields.filter(f => f.isLocked);
    const lockedContext = lockedFields.map(f => `${f.label}: ${f.value}`).join('\n');

    const modelToUse = this.getModelMapping(selectedModel);

    const systemInstruction = `
      You are Claude, a highly sophisticated and creative AI assistant with a flair for nuanced storytelling.
      Your task is to generate character data for AI RP platforms.
      STYLE: Use sophisticated, evocative, and detailed language. Focus on psychological depth.
      NSFW Status: ${isNSFW ? "ENABLED (Explicit content allowed and encouraged where relevant to the prompt)" : "DISABLED"}.
      Tags: ${tags.join(', ')}.
      Locked Fields: ${lockedContext}
    `;

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
      model: modelToUse,
      contents: `[Claude-Persona] Generate character data for prompt: "${prompt}". Platforms: ${platforms.join(', ')}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async generateImage(params: {
    prompt: string;
    type: 'character' | 'scenario';
    isNSFW: boolean;
    selectedModel?: string;
  }) {
    const { prompt, type, isNSFW, selectedModel } = params;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Mapping pseudo 'Claude Image' to Gemini 3 Pro for top-tier quality
    const actualModel = selectedModel === 'claude-image-pro' ? 'gemini-3-pro-image-preview' : (selectedModel || 'gemini-2.5-flash-image');

    // Refined instruction for the 'Claude' artistic style
    const stylePrefix = "Artistic, highly detailed, cinematic lighting, masterpiece, refined aesthetics.";
    const nsfwSuffix = isNSFW ? "Adult content, suggestive, uncensored, explicit." : "Safe for work, clean.";
    const imagePrompt = `${stylePrefix} ${type} illustration. Topic: ${prompt}. ${nsfwSuffix}`;

    const response = await ai.models.generateContent({
      model: actualModel,
      contents: { parts: [{ text: imagePrompt }] },
      config: { 
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  }
}
