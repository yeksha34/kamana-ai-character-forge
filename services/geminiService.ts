
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform } from "../types";

const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export class GeminiService {
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

    const systemInstruction = `
      You are an expert character creator for AI RP platforms.
      NSFW Status: ${isNSFW ? "ENABLED (Explicit content allowed)" : "DISABLED"}.
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
      model: selectedModel || TEXT_MODEL,
      contents: `Generate character data for prompt: "${prompt}". Platforms: ${platforms.join(', ')}.`,
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
    const imagePrompt = `A ${type} illustration. ${isNSFW ? 'NSFW/suggestive.' : 'SFW.'} Prompt: ${prompt}`;

    const response = await ai.models.generateContent({
      model: selectedModel || IMAGE_MODEL,
      contents: { parts: [{ text: imagePrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  }
}
