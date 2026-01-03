
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class OpenAIForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchOpenAI(endpoint: string, body: any) {
    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string }): Promise<string> {
    const tagSummary = params.tags.map(t => t.textGenerationRule).join("; ");
    const system = `Master Prompt Engineer. Refine this RP vision. Behavioral Rules: ${tagSummary}. ${params.isNSFW ? 'NSFW ACTIVE.' : ''} Output ONLY the refined text.`;
    
    const result = await this.fetchOpenAI("chat/completions", {
      model: params.modelId,
      messages: [{ role: "system", content: system }, { role: "user", content: params.prompt }]
    });
    return result.choices[0].message.content.trim();
  }

  async generatePlatformContent(params: any) {
    const system = `Character Architect. Output JSON ONLY: { "name": "...", "fields": [{ "label": "...", "value": "..." }] }. Platforms: ${params.platforms.join(',')}. ${params.isNSFW ? 'NSFW MODE.' : ''}`;
    const result = await this.fetchOpenAI("chat/completions", {
      model: params.modelId,
      messages: [{ role: "system", content: system }, { role: "user", content: params.modifiedPrompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(result.choices[0].message.content);
  }

  async generateImagePrompt(params: any): Promise<string> {
    const system = `DALL-E Prompt Generator. Type: ${params.type}. Vision: ${params.prompt}. ${params.isNSFW ? 'Mature details enabled.' : ''}`;
    const result = await this.fetchOpenAI("chat/completions", {
      model: params.modelId,
      messages: [{ role: "system", content: system }, { role: "user", content: "Write prompt string." }]
    });
    return result.choices[0].message.content.trim();
  }

  async generateImage(params: { prompt: string, isNSFW: boolean, modelId: string }) {
    // DALL-E 3
    const result = await this.fetchOpenAI("images/generations", {
      model: "dall-e-3",
      prompt: params.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });
    return `data:image/png;base64,${result.data[0].b64_json}`;
  }

  async generateAIDungeonCards(params: any) {
    const system = `AIDungeon Lore Analyst. JSON ONLY: { "cards": [{ "label": "...", "content": "..." }] }`;
    const result = await this.fetchOpenAI("chat/completions", {
      model: params.modelId,
      messages: [{ role: "system", content: system }, { role: "user", content: params.prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(result.choices[0].message.content).cards;
  }

  async generateSystemRules(params: any): Promise<string> {
    const system = `Logic Architect. Construct [SYSTEM INFORMATION: ...] block. Context: ${params.content.substring(0, 300)}`;
    const result = await this.fetchOpenAI("chat/completions", {
      model: params.modelId,
      messages: [{ role: "system", content: system }, { role: "user", content: "Finalize rules." }]
    });
    return result.choices[0].message.content.trim();
  }
}
