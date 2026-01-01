import { CharacterField, Platform } from "@/types";
import Anthropic from "@anthropic-ai/sdk";

export class ClaudeService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  private getModelMapping(pseudoModel?: string): string {
    const mapping: Record<string, string> = {
      'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3-opus': 'claude-3-opus-20240229',
      'claude-3-haiku': 'claude-3-haiku-20240307',
      'claude-sonnet-4': 'claude-sonnet-4-20250514',
    };
    return (pseudoModel && mapping[pseudoModel]) 
      ? mapping[pseudoModel] 
      : 'claude-3-5-sonnet-20241022';
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

    const lockedFields = existingFields.filter(f => f.isLocked);
    const lockedContext = lockedFields.map(f => `${f.label}: ${f.value}`).join('\n');

    const modelToUse = this.getModelMapping(selectedModel);

    const systemPrompt = `
You are a highly sophisticated and creative AI assistant with a flair for nuanced storytelling.
Your task is to generate character data for AI RP platforms.
STYLE: Use sophisticated, evocative, and detailed language. Focus on psychological depth.
NSFW Status: ${isNSFW ? "ENABLED (Explicit content allowed and encouraged where relevant to the prompt)" : "DISABLED"}.
Tags: ${tags.join(', ')}.
Locked Fields: ${lockedContext}

You must respond with valid JSON in this exact format:
{
  "name": "character name",
  "fields": [
    {
      "label": "field label",
      "value": "field value"
    }
  ]
}
    `.trim();

    const userPrompt = `Generate character data for prompt: "${prompt}". Platforms: ${platforms.join(', ')}.`;

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

    // Extract JSON from response (Claude might wrap it in markdown)
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
    // NOTE: Claude does not have native image generation capabilities
    // You have a few options:
    
    // Option 1: Use a different service for image generation (Stability AI, DALL-E, etc.)
    // Option 2: Use Claude to generate a detailed prompt, then pass it to an image service
    // Option 3: Return null and handle image generation elsewhere
    
    const { prompt, type, isNSFW } = params;
    
    console.warn('Claude does not support native image generation.');
    console.log('Consider using Stability AI, DALL-E, or another image generation service.');
    
    // Option 2 implementation: Generate enhanced prompt for external service
    const enhancedPrompt = await this.generateImagePrompt(prompt, type, isNSFW);
    
    // You would then pass this enhanced prompt to your image generation service
    // For now, returning null
    return null;
  }

  private async generateImagePrompt(
    prompt: string, 
    type: 'character' | 'scenario',
    isNSFW: boolean
  ): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Create a detailed, artistic image generation prompt for a ${type} based on: "${prompt}". 
Style: Artistic, highly detailed, cinematic lighting, masterpiece, refined aesthetics.
${isNSFW ? 'Content: Adult content allowed, suggestive, uncensored.' : 'Content: Safe for work, clean.'}

Provide only the image prompt, no additional explanation.`,
        },
      ],
    });

    const textContent = response.content.find(block => block.type === 'text');
    return textContent && textContent.type === 'text' ? textContent.text : prompt;
  }
}