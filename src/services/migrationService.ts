import { supabase } from './supabaseClient';
import { STATIC_TAGS } from '../data/staticTags';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { saveModelsBulk, saveTagsBulk } from './supabaseDatabaseService';

export class MigrationService {
  /**
   * Runs client-side "migrations" to ensure public registry tables 
   * are populated with the latest static definitions.
   */
  static async runMigrations() {
    if (!supabase) {
      console.debug("Local mode: Skipping Supabase migrations.");
      return;
    }

    try {
      console.group("System Migration Check");
      
      // Sync Tags if registry is outdated or empty
      const { count: tagCount } = await supabase.from('tags').select('*', { count: 'exact', head: true });
      if (tagCount === null || tagCount < STATIC_TAGS.length) {
        console.log(`Hydrating tags registry... (${tagCount || 0} -> ${STATIC_TAGS.length})`);
        await saveTagsBulk(STATIC_TAGS);
      }

      // Sync Models if registry is outdated or empty
      const { count: modelCount } = await supabase.from('ai_models').select('*', { count: 'exact', head: true });
      if (modelCount === null || modelCount < DEFAULT_MODELS.length) {
        console.log(`Hydrating models registry... (${modelCount || 0} -> ${DEFAULT_MODELS.length})`);
        await saveModelsBulk(DEFAULT_MODELS);
      }

      console.log("Registry sync check complete.");
      console.groupEnd();
    } catch (err) {
      console.error("Migration check failed:", err);
      console.groupEnd();
    }
  }

  /**
   * Forcefully overrides the database registry with the current application state.
   */
  static async forceSyncRegistry() {
    console.log("Forcing registry re-sync...");
    await saveTagsBulk(STATIC_TAGS);
    await saveModelsBulk(DEFAULT_MODELS);
  }
}