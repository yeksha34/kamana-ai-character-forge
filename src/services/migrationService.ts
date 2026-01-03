import { supabase } from './supabaseClient';
import { STATIC_TAGS } from '../data/staticTags';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { SCHEMA_SQL } from '../data/schemaSql';
import { saveModelsBulk, saveTagsBulk } from './supabaseDatabaseService';

export class MigrationService {
  /**
   * Verifies if the core database tables exist.
   * Returns true if 'tags' table is accessible.
   */
  static async isSchemaInitialized(): Promise<boolean> {
    if (!supabase) return true; // Local mode always returns true
    try {
      const { error } = await supabase.from('tags').select('id').limit(1);
      // 42P01 is the PostgreSQL error code for "relation does not exist"
      if (error && error.code === '42P01') return false;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempts to initialize the database schema via the 'initialize_forge_schema' RPC.
   */
  static async attemptSelfInitialization(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.rpc('initialize_forge_schema', { sql_code: SCHEMA_SQL });
      if (error) {
        console.warn("Self-initialization RPC not found or failed. Manual SQL entry required.");
        return false;
      }
      return true;
    } catch (err) {
      console.error("Critical error during self-initialization:", err);
      return false;
    }
  }

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
      console.group("Forge Core: Migration Service");
      
      const initialized = await this.isSchemaInitialized();
      if (!initialized) {
        console.log("Schema not detected. Attempting automatic Forge construction...");
        const success = await this.attemptSelfInitialization();
        if (!success) {
          console.error("FATAL: Database Axis disconnected. Open Settings > System Architect to apply blueprint.");
          console.groupEnd();
          return;
        }
      }

      console.log("Syncing Tags Registry...");
      const { count: tagCount } = await supabase.from('tags').select('*', { count: 'exact', head: true });
      if (tagCount === null || tagCount < STATIC_TAGS.length) {
        await saveTagsBulk(STATIC_TAGS);
      }

      console.log("Syncing Models Registry...");
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

  /**
   * Forcefully overrides the database registry with the current application state.
   * This is triggered by the "Re-Sync Creative Axis" button.
   */
  static async forceSyncRegistry() {
    console.group("Creative Axis Force Re-Sync");
    
    try {
      const initialized = await this.isSchemaInitialized();
      if (!initialized) {
        const success = await this.attemptSelfInitialization();
        if (!success) {
          alert("Schema Missing. Please copy the 'Database Blueprint' from settings and run it in your Supabase SQL Editor first.");
          console.groupEnd();
          return;
        }
      }

      await saveTagsBulk(STATIC_TAGS);
      await saveModelsBulk(DEFAULT_MODELS);
      
      console.log("Registry data forced to latest blueprint.");
      console.info(SCHEMA_SQL);
      console.groupEnd();
    } catch (err) {
      console.error("Force Re-Sync Failed:", err);
      console.groupEnd();
      throw err;
    }
  }
}