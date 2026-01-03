
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class TogetherForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchTogether(endpoint: string, body: any) {
    const response = await fetch(`https://api.together.xyz/v1/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Together error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: any): Promise<string> {
    const res = await this.fetchTogether("chat/completions", {
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [{ role: "user", content: `Refine this RP vision: ${params.prompt}` }]
    });
    return res.choices[0].message.content.trim();
  }

  async generatePlatformContent(params: any) {
    const res = await this.fetchTogether("chat/completions", {
      model: "meta-llama/Llama-3-70b-chat-hf",
      messages: [{ role: "system", content: "JSON ONLY." }, { role: "user", content: params.modifiedPrompt }]
    });
    return JSON.parse(res.choices[0].message.content);
  }

  async generateImagePrompt(params: any): Promise<string> { return params.prompt; }

  async generateImage(params: { prompt: string, isNSFW: boolean, modelId: string }) {
    const res = await this.fetchTogether("images/generations", {
      model: params.modelId, // e.g. black-forest-labs/FLUX.1-schnell
      prompt: params.prompt,
      width: 1024,
      height: 1024,
      steps: 4,
      n: 1,
      response_format: "b64_json"
    });
    return `data:image/png;base64,${res.data[0].b64_json}`;
  }

  async generateAIDungeonCards(params: any): Promise<any> { return []; }
  async generateSystemRules(params: any): Promise<string> { return ""; }
}
