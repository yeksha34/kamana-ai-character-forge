
import { CharacterField, Platform } from "../types";
import { GoogleGenAI, Type } from "@google/genai";

const TEXT_MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-2.5-flash-image";

export class GeminiService {
  async generateCharacterText(params: {
    prompt: string;
    platforms: Platform[];
    platformRequirements: { platform: string, fields: string[] }[];
    isNSFW: boolean;
    tags: string[];
    existingFields: CharacterField[];
    selectedModel?: string;
  }) {
    const { prompt, platforms, platformRequirements, isNSFW, tags, existingFields, selectedModel } = params;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const lockedContext = existingFields
      .filter(f => f.isLocked)
      .map(f => `${f.label}:${f.value.substring(0, 100)}...`)
      .join('|');

    // Create a strict mapping string for the AI to follow
    const fieldMapping = platformRequirements
      .map(p => `For ${p.platform}, you MUST generate these fields: [${p.fields.join(', ')}]`)
      .join('. ');

    const systemInstruction = `Expert Roleplay Character Forge. 
    You create high-quality, immersive character data for specific RP platforms.
    
    CORE REQUIREMENTS:
    1. STRICT FIELD ADHERENCE: ${fieldMapping}.
    2. NSFW CONTENT: ${isNSFW ? 'ENABLED. Explicit and mature themes are allowed and should be detailed if the user prompt implies them.' : 'DISABLED. Keep content SFW.'}
    3. TAGS/ATTRIBUTES: Incorporate these vibes: ${tags.join(',')}.
    4. PERSISTENCE: Respect these locked fields: ${lockedContext}.
    5. STYLE: Poetic, psychological, and evocative.
    
    OUTPUT FORMAT: JSON ONLY. Use field labels exactly as requested above.`;

    const schema = {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Full name of the character" },
        fields: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Exact label from the requirements" },
              value: { type: Type.STRING, description: "Rich, formatted content for this field" }
            }
          }
        }
      },
      required: ["name", "fields"]
    };

    const response = await ai.models.generateContent({
      model: selectedModel || TEXT_MODEL,
      contents: `Create character data based on this vision: "${prompt}". Targeted Platforms: ${platforms.join(', ')}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.85
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

    if (modelToUse === 'imagen-4.0-generate-001') {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${type === 'character' ? 'Highly detailed portrait' : 'Atmospheric scenario environment'} of: ${prompt}. ${isNSFW ? 'Mature/Suggestive' : 'SFW'}. Masterpiece quality, cinematic lighting.`,
        config: {
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/png'
        }
      });
      const bytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${bytes}`;
    }

    const imagePrompt = `${type === 'character' ? 'Portrait' : 'Environment'}. Style: Cinematic, detailed. Topic: ${prompt}. ${isNSFW ? 'Mature content allowed' : 'SFW'}`;

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
