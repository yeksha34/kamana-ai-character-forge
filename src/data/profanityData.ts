
import { MARATHI_PROFANNITY_WORDS } from './marathiProfanity';
import { ENGLISH_PROFANNITY_WORDS } from './englishProfanity';
import { HINDI_PROFANNITY_WORDS } from './hindiProfanity';

/**
 * Aggregated High-Density NSFW Dictionary for Kamana Forge.
 * Supports English, Marathi, and Hindi.
 */
export const RAW_PROFANNITY_WORDS = [
  ...MARATHI_PROFANNITY_WORDS,
  ...ENGLISH_PROFANNITY_WORDS,
  ...HINDI_PROFANNITY_WORDS
];
