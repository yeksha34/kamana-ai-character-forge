
import { GoogleGenAI, Type } from "@google/genai";
import { CharacterField, Platform } from "../types";

export class ClaudeService {
  async generateCharacterText(params: {
    prompt: string;
    platforms: Platform[];
    isNSFW: boolean;
    tags: string[];
    existingFields: CharacterField[];
    selectedModel?: string;
  }) {
    const { prompt, platforms, isNSFW, tags, existingFields, selectedModel } = params;
    // Prioritize CLAUDE_API_KEY while falling back to the standard API_KEY environment variable.
    const ai = new GoogleGenAI({ apiKey: process.env.CLAUDE_API_KEY || process.env.API_KEY });

    const lockedFields = existingFields.filter(f => f.isLocked);
    const lockedContext = lockedFields.map(f => `${f.label}: ${f.value}`).join('\n');

    // Emulate Claude's characteristic persona and prose style via system instruction
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
      model: selectedModel || 'gemini-3-pro-preview', // Mapping to Pro for Claude-like reasoning
      contents: `[Claude-Persona] Generate character data for prompt: "${prompt}". Platforms: ${platforms.join(', ')}.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '{}');
  }
}
