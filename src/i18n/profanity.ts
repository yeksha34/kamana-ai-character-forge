import { Theme, Context } from '../types';
import { RAW_PROFANNITY_WORDS } from '../data/profanityData';

export type ProfanityTiers = Record<Theme, string[]>;

interface LanguageProfanity {
  desire: ProfanityTiers;
  imagination: ProfanityTiers;
  studio: ProfanityTiers;
  canvas: ProfanityTiers;
  chatNow: ProfanityTiers;
}

// Internal helper to filter words randomly for each tier
function buildTiers(lang: 'mr' | 'en' | 'hi', context: Context): ProfanityTiers {
  const tiers: ProfanityTiers = {
    [Theme.DEFAULT]: [],
    [Theme.SOFTCORE]: [],
    [Theme.HARDCORE]: []
  };

  Object.values(Theme).forEach(theme => {
    tiers[theme] = RAW_PROFANNITY_WORDS
      .filter(w => w.language === lang && w.contexts.includes(context) && w.themes.includes(theme))
      .map(w => w.word)
      // Shuffle the initial list
      .sort(() => Math.random() - 0.5);

    // Fallback if no words found for a tier to prevent empty lists
    if (tiers[theme].length === 0) {
      tiers[theme] = [context.toUpperCase()];
    }
  });

  return tiers;
}

// Initial build of the dictionary for all 3 languages
export const categorizedProfanity: Record<'mr' | 'en' | 'hi', LanguageProfanity> = {
  mr: {
    desire: buildTiers('mr', Context.DESIRE),
    imagination: buildTiers('mr', Context.IMAGINATION),
    studio: buildTiers('mr', Context.STUDIO),
    canvas: buildTiers('mr', Context.CANVAS),
    chatNow: buildTiers('mr', Context.CHAT),
  },
  en: {
    desire: buildTiers('en', Context.DESIRE),
    imagination: buildTiers('en', Context.IMAGINATION),
    studio: buildTiers('en', Context.STUDIO),
    canvas: buildTiers('en', Context.CANVAS),
    chatNow: buildTiers('en', Context.CHAT),
  },
  hi: {
    desire: buildTiers('hi', Context.DESIRE),
    imagination: buildTiers('hi', Context.IMAGINATION),
    studio: buildTiers('hi', Context.STUDIO),
    canvas: buildTiers('hi', Context.CANVAS),
    chatNow: buildTiers('hi', Context.CHAT),
  }
};