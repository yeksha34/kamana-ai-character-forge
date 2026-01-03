
import Anthropic from "@anthropic-ai/sdk";
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class ClaudeForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private getClient() {
    if (!this.apiKey) return null;
    return new Anthropic({ apiKey: this.apiKey, dangerouslyAllowBrowser: true });
  }

  private constructNSFWInstruction(isNSFW: boolean, tags: TagMeta[]): string {
    if (!isNSFW) return "";
    const coreLogic = tags.filter(t => t.id.startsWith('logic'));
    let instructions = "NSFW MODE: ACTIVE.";
    if (coreLogic.length > 0) {
      instructions += " BEHAVIORAL OVERRIDES: " + coreLogic.map(t => t.textGenerationRule).join(' ');
    }
    return instructions;
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string }): Promise<string> {
    const client = this.getClient();
    if (!client) return params.prompt;
    const nsfwPart = this.constructNSFWInstruction(params.isNSFW, params.tags);
    const response = await client.messages.create({
      model: params.modelId,
      max_tokens: 1000,
      system: `Master Prompt Gen. ${nsfwPart}`,
      messages: [{ role: "user", content: params.prompt }]
    });
    return (response.content[0] as any).text.trim();
  }

  async generatePlatformContent(params: any) {
    const client = this.getClient();
    if (!client) return { name: "Error", fields: [] };
    const response = await client.messages.create({
      model: params.modelId,
      max_tokens: 2000,
      system: "Construct character JSON.",
      messages: [{ role: "user", content: params.modifiedPrompt }]
    });
    const text = (response.content[0] as any).text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
  }

  async generateImagePrompt(params: any) {
    const client = this.getClient();
    if (!client) return "";
    const response = await client.messages.create({
      model: params.modelId,
      max_tokens: 500,
      system: "Create image prompt string.",
      messages: [{ role: "user", content: params.prompt }]
    });
    return (response.content[0] as any).text.trim();
  }

  async generateImage(params: any) { return null; }

  async generateAIDungeonCards(params: any) {
    const client = this.getClient();
    if (!client) return [];
    const response = await client.messages.create({
      model: params.modelId,
      max_tokens: 1000,
      system: "Identify lore cards JSON.",
      messages: [{ role: "user", content: params.prompt }]
    });
    const text = (response.content[0] as any).text.trim();
    return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{"cards":[]}').cards;
  }

  async generateSystemRules(params: any) {
    const client = this.getClient();
    if (!client) return "";
    const response = await client.messages.create({
      model: params.modelId,
      max_tokens: 1000,
      system: "Construct system information block.",
      messages: [{ role: "user", content: params.content }]
    });
    return (response.content[0] as any).text.trim();
  }
}
