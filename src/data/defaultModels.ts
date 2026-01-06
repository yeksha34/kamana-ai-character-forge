import { AIModelMeta, AIProvider } from '../types';

export const DEFAULT_MODELS: AIModelMeta[] = [
  // Text Models
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Latest)', isFree: true, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (High Quality)', isFree: false, provider: AIProvider.GEMINI, type: 'text' },
  { id: 'gemini-2.5-flash-lite-latest', name: 'Gemini Flash Lite', isFree: true, provider: AIProvider.GEMINI, type: 'text' },
  
  // Image Models
  { id: 'gemini-2.5-flash-image', name: 'Gemini Flash Image', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini Pro Image (4K)', isFree: false, provider: AIProvider.GEMINI, type: 'image' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', isFree: false, provider: AIProvider.GEMINI, type: 'image' },

  // Third Party
  { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', isFree: true, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', isFree: false, provider: AIProvider.CLAUDE, type: 'text' },
  { id: 'gpt-4o', name: 'GPT-4o', isFree: false, provider: AIProvider.OPENAI, type: 'text' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', isFree: true, provider: AIProvider.OPENAI, type: 'text' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B (Groq)', isFree: true, provider: AIProvider.GROQ, type: 'text' },
  { id: 'None', name: 'Disable Visuals', isFree: true, provider: AIProvider.GEMINI, type: 'image' },
];