
import { CharacterField, Platform, TagMeta, AIDungeonCard } from "../../types";
import { ForgeProvider } from "./providerInterface";

export class HuggingFaceForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  private async fetchHF(modelId: string, body: any) {
    const response = await fetch(`https://router.huggingface.co/models/${modelId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`Hugging Face API error: ${response.statusText}`);
    return response.json();
  }

  async refinePrompt(params: { prompt: string, tags: TagMeta[], isNSFW: boolean, modelId: string, useWebResearch?: boolean }): Promise<any> {
    const res = await this.fetchHF(params.modelId, { inputs: params.prompt });
    const text = Array.isArray(res) ? res[0].generated_text : res.generated_text;
    return text;
  }

  async generatePlatformContent(params: { 
    modifiedPrompt: string, 
    platforms: Platform[], 
    platformRequirements: { platform: string, fields: string[] }[],
    existingFields: CharacterField[],
    isNSFW: boolean,
    tags: TagMeta[],
    modelId: string,
    useWebResearch?: boolean 
  }): Promise<any> {
    const res = await this.fetchHF(params.modelId, { inputs: `Generate JSON for ${params.modifiedPrompt}` });
    const text = Array.isArray(res) ? res[0].generated_text : res.generated_text;
    try {
      return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
    } catch {
      return { name: "HF Bot", fields: [] };
    }
  }

  async generateImagePrompt(params: any): Promise<string> { return params.prompt; }

  async generateImage(params: { prompt: string, modelId: string }) {
    const response = await fetch(`https://router.huggingface.co/models/${params.modelId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${this.apiKey}` },
      body: JSON.stringify({ inputs: params.prompt })
    });
    const blob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  async generateAIDungeonCards(params: any) { return []; }
  async generateSystemRules(params: any): Promise<string> { return ""; }
}
