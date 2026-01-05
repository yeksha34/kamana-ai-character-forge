import { supabase } from './supabaseClient';
import { STATIC_TAGS } from '../data/staticTags';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { SCHEMA_SQL } from '../data/schemaSql';
import { saveModelsBulk, saveTagsBulk } from './supabaseDatabaseService';

export class MigrationService {
  static async isSchemaInitialized(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.from('forge_migrations').select('version').limit(1);
      if (error && error.code === '42P01') return false;
      return true;
    } catch {
      return false;
    }
  }

  static async attemptSelfInitialization(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.rpc('initialize_forge_schema', { sql_code: SCHEMA_SQL });
      if (error) {
        console.warn("Self-initialization RPC failed, trying core tables fallback.");
        return await this.fallbackCheck();
      }
      return true;
    } catch (err) {
      console.error("Critical error during self-initialization:", err);
      return false;
    }
  }

  private static async fallbackCheck(): Promise<boolean> {
    const { error } = await supabase!.from('tags').select('id').limit(1);
    return !error;
  }

  static async runMigrations() {
    if (!supabase) return;

    try {
      console.group("Forge Core: Migration Service");
      
      const initialized = await this.isSchemaInitialized();
      if (!initialized) {
        console.log("Schema v1.3 not detected. Initializing Creative Axis...");
        const success = await this.attemptSelfInitialization();
        if (!success) {
          console.error("FATAL: Database Axis disconnected.");
          console.groupEnd();
          return;
        }
      }

      const { count: tagCount } = await supabase.from('tags').select('*', { count: 'exact', head: true });
      if (tagCount === null || tagCount < STATIC_TAGS.length) {
        await saveTagsBulk(STATIC_TAGS);
      }

      const { count: modelCount } = await supabase.from('ai_models').select('*', { count: 'exact', head: true });
      if (modelCount === null || modelCount < DEFAULT_MODELS.length) {
        await saveModelsBulk(DEFAULT_MODELS);
      }

      console.log("Creative Axis successfully aligned.");
      console.groupEnd();
    } catch (err) {
      console.error("Critical Migration Error:", err);
      console.groupEnd();
    }
  }

  static async forceSyncRegistry() {
    console.group("Creative Axis Force Re-Sync");
    try {
      await this.attemptSelfInitialization();
      await saveTagsBulk(STATIC_TAGS);
      await saveModelsBulk(DEFAULT_MODELS);
      console.log("Registry data forced to latest blueprint.");
      console.groupEnd();
    } catch (err) {
      console.error("Force Re-Sync Failed:", err);
      console.groupEnd();
      throw err;
    }
  }
}