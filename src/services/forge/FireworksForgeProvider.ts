
// Fix: Import TagMeta from the correct types file instead of the interface file which does not export it.
import { TagMeta } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class FireworksForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchFireworks(body: any) {
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Fireworks API error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string }): Promise<string> {
    const res = await this.fetchFireworks({
      model: params.modelId,
      messages: [{ role: "user", content: `Refine this character vision: ${params.prompt}` }]
    });
    return res.choices[0].message.content.trim();
  }

  async generatePlatformContent(params: any) {
    const res = await this.fetchFireworks({
      model: params.modelId,
      messages: [{ role: "system", content: "Output JSON ONLY. {name, fields:[]}" }, { role: "user", content: params.modifiedPrompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content);
  }

  async generateImagePrompt(params: any): Promise<string> { return params.prompt; }
  async generateImage(params: any) { return null; }
  async generateAIDungeonCards(params: any) { return []; }
  async generateSystemRules(params: any): Promise<string> { return ""; }
}
