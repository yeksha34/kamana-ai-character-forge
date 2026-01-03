import { AIModelMeta, AIProvider } from '../types';

export const DEFAULT_MODELS: AIModelMeta[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', isFree: true, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', isFree: false, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', isFree: true, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', isFree: false, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'gpt-4o', name: 'GPT-4o', isFree: false, provider: AIProvider.OPENAI, type: 'text' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isFree: true, provider: AIProvider.OPENAI, type: 'text' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Groq)', isFree: true, provider: AIProvider.GROQ, type: 'text' },
  { id: 'mistral-large-latest', name: 'Mistral Large', isFree: false, provider: AIProvider.MISTRAL, type: 'text' },
  { id: 'stable-diffusion-xl-1024-v1-0', name: 'SDXL 1.0 (Stability)', isFree: false, provider: AIProvider.STABILITY, type: 'image' },
  { id: 'flux-1-schnell', name: 'Flux.1 Schnell (Together)', isFree: true, provider: AIProvider.TOGETHER, type: 'image' },
  { id: 'accounts/fireworks/models/llama-v3-70b-instruct', name: 'Llama 3 70B (Fireworks)', isFree: true, provider: AIProvider.FIREWORKS, type: 'text' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'SD 1.5 (HuggingFace)', isFree: true, provider: AIProvider.HUGGINGFACE, type: 'image' },
  { id: 'None', name: 'Disable Visuals', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
];