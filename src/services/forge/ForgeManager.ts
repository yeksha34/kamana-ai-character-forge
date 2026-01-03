
import { AIProvider } from "../../types";
import { ForgeProvider } from "./providerInterface";
import { GeminiForgeProvider } from "./GeminiForgeProvider";
import { ClaudeForgeProvider } from "./ClaudeForgeProvider";
import { OpenAIForgeProvider } from "./OpenAIForgeProvider";
import { GroqForgeProvider } from "./GroqForgeProvider";
import { MistralForgeProvider } from "./MistralForgeProvider";
import { StabilityForgeProvider } from "./StabilityForgeProvider";
import { TogetherForgeProvider } from "./TogetherForgeProvider";
import { FireworksForgeProvider } from "./FireworksForgeProvider";
import { HuggingFaceForgeProvider } from "./HuggingFaceForgeProvider";
import { ReplicateForgeProvider } from "./ReplicateForgeProvider";
import { RunPodForgeProvider } from "./RunPodForgeProvider";

export class ForgeManager {
  private static providers: Partial<Record<AIProvider, ForgeProvider>> = {};

  static getProvider(provider: AIProvider, apiKey?: string): ForgeProvider {
    let instance = this.providers[provider];

    if (!instance) {
      switch (provider) {
        case AIProvider.GEMINI:
          instance = new GeminiForgeProvider();
          break;
        case AIProvider.CLAUDE:
          instance = new ClaudeForgeProvider();
          break;
        case AIProvider.OPENAI:
          instance = new OpenAIForgeProvider();
          break;
        case AIProvider.GROQ:
          instance = new GroqForgeProvider();
          break;
        case AIProvider.MISTRAL:
          instance = new MistralForgeProvider();
          break;
        case AIProvider.STABILITY:
          instance = new StabilityForgeProvider();
          break;
        case AIProvider.TOGETHER:
          instance = new TogetherForgeProvider();
          break;
        case AIProvider.FIREWORKS:
          instance = new FireworksForgeProvider();
          break;
        case AIProvider.HUGGINGFACE:
          instance = new HuggingFaceForgeProvider();
          break;
        case AIProvider.REPLICATE:
          instance = new ReplicateForgeProvider();
          break;
        case AIProvider.RUNPOD:
          instance = new RunPodForgeProvider();
          break;
        default:
          instance = new GeminiForgeProvider();
      }
      this.providers[provider] = instance;
    }

    if (apiKey) {
      instance.setApiKey(apiKey);
    }
    
    return instance;
  }
}
