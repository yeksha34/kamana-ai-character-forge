import { TagMeta } from '../types';
import { LOGIC_TAGS } from './logicTags';
import { MYTHOLOGY_TAGS } from './mythologyTags';
import { GENERAL_TAGS } from './generalTags';
import { KINK_TAGS } from './kinkTags';
import { EXTREME_TAGS } from './extremeTags';
import { ACADEMIC_TAGS } from './academicTags';

/**
 * KAMANA FORGE: MASTER STATIC TAGS REGISTRY
 * Aggregated from modular category files to prevent data loss and ensure scalability.
 */
export const STATIC_TAGS: TagMeta[] = [
  ...LOGIC_TAGS,
  ...MYTHOLOGY_TAGS,
  ...GENERAL_TAGS,
  ...KINK_TAGS,
  ...EXTREME_TAGS,
  ...ACADEMIC_TAGS
];