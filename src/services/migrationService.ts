import { supabase } from './supabaseClient';
import { STATIC_TAGS } from '../data/staticTags';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { SCHEMA_SQL } from '../data/schemaSql';
import { saveModelsBulk, saveTagsBulk } from './supabaseDatabaseService';
import { localDb } from './localDbService';

export class MigrationService {
  static async runMigrations() {
    console.group("Forge Core: Alignment Service");
    try {
      if (supabase) {
        const isInit = await this.isSchemaInitialized();
        if (!isInit) {
          console.log("Schema not detected. Initializing Axis...");
          await this.attemptSelfInitialization();
        }
      }

      // Force hydration if registries are empty
      const currentModels = await localDb.getAll('models');
      if (currentModels.length === 0) {
        console.log("Hydrating local model registry...");
        for (const m of DEFAULT_MODELS) await localDb.save('models', m);
        if (supabase) await saveModelsBulk(DEFAULT_MODELS);
      }

      const currentTags = await localDb.getAll('tags');
      if (currentTags.length === 0) {
        console.log("Hydrating local tag registry...");
        for (const t of STATIC_TAGS) await localDb.save('tags', t);
        if (supabase) await saveTagsBulk(STATIC_TAGS);
      }
      
      console.log("Creative Axis successfully aligned.");
    } catch (err) {
      console.error("Migration Error:", err);
    } finally {
      console.groupEnd();
    }
  }

  static async isSchemaInitialized(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.from('forge_migrations').select('version').limit(1);
      return !error || error.code !== '42P01';
    } catch { return false; }
  }

  static async attemptSelfInitialization(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.rpc('initialize_forge_schema', { sql_code: SCHEMA_SQL });
      return !error;
    } catch { return false; }
  }

  static async forceSyncRegistry() {
    for (const m of DEFAULT_MODELS) await localDb.save('models', m);
    for (const t of STATIC_TAGS) await localDb.save('tags', t);
    if (supabase) {
      await saveModelsBulk(DEFAULT_MODELS);
      await saveTagsBulk(STATIC_TAGS);
    }
  }
}