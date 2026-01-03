
import { ForgeProvider } from "./providerInterface";

export class RunPodForgeProvider implements ForgeProvider {
  private apiKey: string = "";

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async refinePrompt(params: any): Promise<string> { return params.prompt; }
  async generatePlatformContent(params: any) { return { name: "RunPod Bot", fields: [] }; }
  async generateImagePrompt(params: any): Promise<string> { return params.prompt; }
  async generateImage(params: any) { return null; }
  async generateAIDungeonCards(params: any) { return []; }
  async generateSystemRules(params: any): Promise<string> { return ""; }
}
