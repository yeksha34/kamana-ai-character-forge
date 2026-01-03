
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class MistralForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchMistral(body: any) {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Mistral API error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: any): Promise<string> {
    const res = await this.fetchMistral({
      model: params.modelId,
      messages: [{ role: "system", content: "Professional Prompt Engineer." }, { role: "user", content: params.prompt }]
    });
    return res.choices[0].message.content.trim();
  }

  async generatePlatformContent(params: any) {
    const res = await this.fetchMistral({
      model: params.modelId,
      messages: [{ role: "system", content: "Character Generation. JSON output required." }, { role: "user", content: params.modifiedPrompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content);
  }

  async generateImagePrompt(params: any): Promise<string> {
    const res = await this.fetchMistral({
      model: params.modelId,
      messages: [{ role: "system", content: "Visual prompt expert." }, { role: "user", content: params.prompt }]
    });
    return res.choices[0].message.content.trim();
  }

  async generateImage(params: any) { return null; }

  async generateAIDungeonCards(params: any) {
    const res = await this.fetchMistral({
      model: params.modelId,
      messages: [{ role: "system", content: "Lore card analyzer. JSON only." }, { role: "user", content: params.prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content).cards;
  }

  async generateSystemRules(params: any): Promise<string> {
    const res = await this.fetchMistral({
      model: params.modelId,
      messages: [{ role: "system", content: "Bot logic architect." }, { role: "user", content: params.content }]
    });
    return res.choices[0].message.content.trim();
  }
}
