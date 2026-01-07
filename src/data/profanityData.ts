import { EN_DESIRE } from './en_desire';
import { EN_IMAGINATION } from './en_imagination';
import { EN_STUDIO } from './en_studio';
import { EN_CANVAS } from './en_canvas';
import { EN_CHAT } from './en_chat';
import { HI_DESIRE } from './hi_desire';
import { HI_IMAGINATION } from './hi_imagination';
import { HI_STUDIO } from './hi_studio';
import { HI_CANVAS } from './hi_canvas';
import { HI_CHAT } from './hi_chat';
import { MR_DESIRE } from './mr_desire';
import { MR_IMAGINATION } from './mr_imagination';
import { MR_STUDIO } from './mr_studio';
import { MR_CANVAS } from './mr_canvas';
import { MR_CHAT } from './mr_chat';

/**
 * Aggregated High-Density Dictionary for Kamana Forge.
 * Reorganized into context-specific files for performance and maintainability.
 * Contains at least 100 words per (Language x Context x Theme) combination.
 */
export const RAW_PROFANNITY_WORDS = [
  ...EN_DESIRE, ...EN_IMAGINATION, ...EN_STUDIO, ...EN_CANVAS, ...EN_CHAT,
  ...HI_DESIRE, ...HI_IMAGINATION, ...HI_STUDIO, ...HI_CANVAS, ...HI_CHAT,
  ...MR_DESIRE, ...MR_IMAGINATION, ...MR_STUDIO, ...MR_CANVAS, ...MR_CHAT
];