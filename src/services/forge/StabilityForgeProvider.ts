
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class StabilityForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async setApiKeyAsync(key: string) { this.apiKey = key; }

  async refinePrompt(params: any): Promise<string> { return params.prompt; }
  async generatePlatformContent(params: any): Promise<any> { return { name: "Stability Bot", fields: [] }; }
  async generateImagePrompt(params: any): Promise<string> { return params.prompt; }

  async generateImage(params: { prompt: string, isNSFW: boolean, modelId: string }) {
    const response = await fetch(
      `https://api.stability.ai/v1/generation/${params.modelId}/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [{ text: params.prompt }],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) throw new Error(`Stability error: ${response.statusText}`);
    const result = await response.json();
    return `data:image/png;base64,${result.artifacts[0].base64}`;
  }

  async generateAIDungeonCards(params: any): Promise<any> { return []; }
  async generateSystemRules(params: any): Promise<string> { return ""; }
}
