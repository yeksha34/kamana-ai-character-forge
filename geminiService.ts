
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform } from "./types";

// Using recommended model names from guidelines
const TEXT_MODEL = "gemini-3-pro-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export class GeminiService {
  /**
   * Generates character data based on prompt and platform requirements.
   * Instantiates GoogleGenAI per call to ensure it uses the most up-to-date API key.
   */
  async generateCharacterText(params: {
    prompt: string;
    platforms: Platform[];
    isNSFW: boolean;
    tags: string[];
    existingFields: CharacterField[];
    selectedModel?: string;
  }) {
    const { prompt, platforms, isNSFW, tags, existingFields, selectedModel } = params;
    
    // Always use named parameter for apiKey and direct process.env.API_KEY access
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const lockedFields = existingFields.filter(f => f.isLocked);
    const lockedContext = lockedFields.map(f => `${f.label}: ${f.value}`).join('\n');

    const systemInstruction = `
      You are an expert character creator for AI RP platforms like CrushonAI, AIDungeon, and JanitorAI.
      Your goal is to generate high-quality, immersive character data based on user input.
      
      NSFW Status: ${isNSFW ? "ENABLED (Explicit content allowed and encouraged where appropriate)" : "DISABLED (Keep it SFW)"}.
      Tags: ${tags.join(', ')}.
      
      The user wants profiles for: ${platforms.join(', ')}.
      
      CRITICAL INSTRUCTIONS:
      1. Respect the platform-specific field names provided in the JSON schema.
      2. If fields are marked as LOCKED, do NOT change their content.
      3. Ensure the personality and scenario match the requested tags.
      4. Use a creative, engaging writing style appropriate for the platform's format.
      
      LOCKED FIELDS (Do not change these):
      ${lockedContext}
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

    // Directly access text property from response
    return JSON.parse(response.text || '{}');
  }

  /**
   * Generates images for character or scenario visualization.
   */
  async generateImage(params: {
    prompt: string;
    type: 'character' | 'scenario';
    isNSFW: boolean;
    selectedModel?: string;
  }) {
    const { prompt, type, isNSFW, selectedModel } = params;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imagePrompt = `A ${type} illustration for a story. ${type === 'character' ? 'Focus on visual appearance, clothing, and expression.' : 'Focus on the environment, mood, and atmosphere.'} ${isNSFW ? 'Mature and suggestive elements allowed.' : 'Safe for work.'} Prompt context: ${prompt}`;

    const response = await ai.models.generateContent({
      model: selectedModel || IMAGE_MODEL,
      contents: {
        parts: [{ text: imagePrompt }]
      },
      config: {
        // Correct imageConfig usage for nano banana models
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    // Iterate through candidates and parts to find the image part
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  }
}
