
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class GroqForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchGroq(body: any) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Groq API error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: any): Promise<string> {
    const res = await this.fetchGroq({
      model: params.modelId,
      messages: [{ role: "system", content: "Master Prompt Gen. Output ONLY the refined prompt text." }, { role: "user", content: params.prompt }]
    });
    return res.choices[0].message.content.trim();
  }

  async generatePlatformContent(params: any) {
    const res = await this.fetchGroq({
      model: params.modelId,
      messages: [{ role: "system", content: "RP Character Architect. Output JSON ONLY. { name: string, fields: Array<{label, value}> }" }, { role: "user", content: params.modifiedPrompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content);
  }

  async generateImagePrompt(params: any): Promise<string> {
    const res = await this.fetchGroq({
      model: params.modelId,
      messages: [{ role: "system", content: "Visual Concept Artist. Write a descriptive Midjourney prompt string." }, { role: "user", content: params.prompt }]
    });
    return res.choices[0].message.content.trim();
  }

  async generateImage(params: any) { return null; }

  async generateAIDungeonCards(params: any) {
    const res = await this.fetchGroq({
      model: params.modelId,
      messages: [{ role: "system", content: "Identify Lore Cards. JSON format: { cards: [] }" }, { role: "user", content: params.prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(res.choices[0].message.content).cards;
  }

  async generateSystemRules(params: any): Promise<string> {
    const res = await this.fetchGroq({
      model: params.modelId,
      messages: [{ role: "system", content: "Logic Rule Generator." }, { role: "user", content: params.content }]
    });
    return res.choices[0].message.content.trim();
  }
}
