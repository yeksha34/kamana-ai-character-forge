// profanity-utils.ts

import { ProfanityWord } from '../types';

export function getRandomWords(
  words: ProfanityWord[],
  page: number,
  pageSize: number,
  // Fix: Added 'hi' to the allowed language types in the filter object
  filter?: Partial<{ language: 'en' | 'mr' | 'hi'; context: string; theme: string; target: string }>
): ProfanityWord[] {
  // Apply filters if any
  let filtered = words;
  if (filter) {
    filtered = words.filter(w =>
      (!filter.language || w.language === filter.language) &&
      (!filter.context || w.contexts.includes(filter.context as any)) &&
      (!filter.theme || w.themes.includes(filter.theme as any)) &&
      (!filter.target || w.targets.includes(filter.target as any))
    );
  }

  // Shuffle randomly
  const shuffled = filtered.sort(() => 0.5 - Math.random());

  // Paginate
  const start = page * pageSize;
  const end = start + pageSize;

  return shuffled.slice(start, end);
}