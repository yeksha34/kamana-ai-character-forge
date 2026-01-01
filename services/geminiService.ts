
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

    const lockedContext = existingFields
      .filter(f => f.isLocked)
      .map(f => `${f.label}:${f.value.substring(0, 100)}...`)
      .join('|');

    const systemInstruction = `Expert RP Character Forge. Concise output. 
    NSFW: ${isNSFW ? 'YES' : 'NO'}. 
    Tags: ${tags.join(',')}. 
    Locked: ${lockedContext}. 
    Respond in JSON only.`;

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
      contents: `Prompt: "${prompt}". Target: ${platforms.join(',')}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.8
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
    
    const modelToUse = selectedModel || IMAGE_MODEL;

    // Handle Imagen model specifically
    if (modelToUse === 'imagen-4.0-generate-001') {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${type} illustration. ${isNSFW ? 'Adult/Mature' : 'SFW'}. Topic: ${prompt}`,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/png'
        }
      });
      const bytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${bytes}`;
    }

    // Default to generateContent for Gemini-based image models
    const imagePrompt = `${type} illustration. ${isNSFW ? 'Suggestive/NSFW' : 'Cinematic/SFW'}. Topic: ${prompt}`;

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: { parts: [{ text: imagePrompt }] },
      config: { 
        imageConfig: { 
          aspectRatio: "1:1",
          imageSize: modelToUse.includes('pro') ? "1K" : undefined
        }
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
