
import { CharacterField, Platform } from "../types";
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

  private getModelMapping(pseudoModel?: string): string {
    const mapping: Record<string, string> = {
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3-opus': 'claude-3-opus-20240229',
    };
    return (pseudoModel && mapping[pseudoModel]) 
      ? mapping[pseudoModel] 
      : 'claude-3-haiku-20240307';
  }

  async generateCharacterText(params: {
    prompt: string;
    platforms: Platform[];
    platformRequirements: { platform: string, fields: string[] }[];
    isNSFW: boolean;
    tags: string[];
    existingFields: CharacterField[];
    selectedModel?: string;
  }) {
    if (!this.anthropic) {
      throw new Error('Claude service is not initialized. Please provide a VITE_CLAUDE_API_KEY.');
    }

    const { prompt, platforms, platformRequirements, isNSFW, tags, existingFields, selectedModel } = params;

    const lockedFields = existingFields.filter(f => f.isLocked);
    const lockedContext = lockedFields.map(f => `${f.label}: ${f.value}`).join('\n');

    const modelToUse = this.getModelMapping(selectedModel);

    const fieldMapping = platformRequirements
      .map(p => `Platform ${p.platform} requires fields: [${p.fields.join(', ')}]`)
      .join('. ');

    const systemPrompt = `
You are a master AI Roleplay Architect. Your goal is to generate extremely detailed, high-fidelity character data for AI RP platforms.

PLATFORM REQUIREMENTS:
${fieldMapping}

CONSTRAINTS:
- NSFW: ${isNSFW ? "ALLOWED & ENCOURAGED. Be explicit, mature, and uninhibited if requested." : "STRICTLY SFW."}
- TAGS: ${tags.join(', ')}
- LOCKED FIELDS: ${lockedContext}
- STYLE: Sophisticated, literary, and evocative. Use Markdown formatting within field values.

RESPONSE FORMAT:
You must respond ONLY with a valid JSON object. No chatter.
{
  "name": "character name",
  "fields": [
    {
      "label": "field label",
      "value": "field content"
    }
  ]
}
    `.trim();

    const userPrompt = `Generate a character persona for this vision: "${prompt}". Target Platforms: ${platforms.join(', ')}. Ensure every required field label is present in the output.`;

    const response = await this.anthropic.messages.create({
      model: modelToUse,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let jsonText = textContent.text.trim();
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    return JSON.parse(jsonText);
  }

  async generateImage(params: {
    prompt: string;
    type: 'character' | 'scenario';
    isNSFW: boolean;
    selectedModel?: string;
  }) {
    return null; // External generation handled via UI if needed
  }
}
