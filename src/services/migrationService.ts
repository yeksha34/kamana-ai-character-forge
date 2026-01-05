import { supabase } from './supabaseClient';
import { STATIC_TAGS } from '../data/staticTags';
import { DEFAULT_MODELS } from '../data/defaultModels';
import { SCHEMA_SQL } from '../data/schemaSql';
import { saveModelsBulk, saveTagsBulk, saveCharacter, saveUserSecret } from './supabaseDatabaseService';
import { localDb } from './localDbService';
import { hashData } from '../utils/helpers';

export class MigrationService {
  /**
   * Checks if the structural schema is initialized by looking for the migration tracking table.
   */
  static async isSchemaInitialized(): Promise<boolean> {
    if (!supabase) return true;
    try {
      const { error } = await supabase.from('forge_migrations').select('version').limit(1);
      if (error && error.code === '42P01') return false; // Table does not exist
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Attempts to initialize the database structure using the provided SQL blueprint.
   */
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

  /**
   * Main migration entry point. Orchestrates schema checks, static data hydration,
   * and optional local-to-cloud data synchronization.
   */
  static async runMigrations() {
    if (!supabase) return;

    console.group("Forge Core: Migration Service");
    
    try {
      // 1. Schema Migration Requirement Check
      const initialized = await this.isSchemaInitialized();
      if (!initialized) {
        console.log("Schema v1.3 not detected. Initializing Creative Axis...");
        const success = await this.attemptSelfInitialization();
        if (!success) {
          console.error("FATAL: Database Axis structural failure.");
        }
      }

      // 2. Registry Data: Tags Requirement Check
      try {
        const { count: tagCount } = await supabase.from('tags').select('*', { count: 'exact', head: true });
        if (tagCount === null || tagCount < STATIC_TAGS.length) {
          console.log("Hydrating tag registry...");
          await saveTagsBulk(STATIC_TAGS);
        }
      } catch (e) {
        console.warn("Registry sync (tags) failed - continuing migration.", e);
      }

      // 3. Registry Data: Models Requirement Check
      try {
        const { count: modelCount } = await supabase.from('ai_models').select('*', { count: 'exact', head: true });
        if (modelCount === null || modelCount < DEFAULT_MODELS.length) {
          console.log("Hydrating model registry...");
          await saveModelsBulk(DEFAULT_MODELS);
        }
      } catch (e) {
        console.warn("Registry sync (models) failed - continuing migration.", e);
      }

      // 4. Local-to-Cloud Synchronization Step
      // Explicitly wrapped in try-catch to ensure it's non-blocking for core app readiness
      try {
        await this.syncLocalDataToCloud();
      } catch (err) {
        console.error("Local-to-Cloud sync step failed (non-blocking):", err);
      }

      console.log("Creative Axis successfully aligned.");
    } catch (err) {
      console.error("Critical Migration Error:", err);
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Scans local IndexedDB stores and attempts to push data to Supabase if an active session exists.
   * Successfully migrated items are purged from local storage to prevent duplicates.
   */
  private static async syncLocalDataToCloud() {
    if (!supabase) return;
    
    // Fix: Cast to any to bypass missing getSession definition in some library versions
    const authResponse = await (supabase.auth as any).getSession();
    const session = authResponse.data?.session;
    const userId = session?.user?.id;
    if (!userId) return;

    // A. Sync Vaulted Secrets
    const localSecrets = await localDb.getAll<any>('secrets');
    if (localSecrets.length > 0) {
      console.log(`Found ${localSecrets.length} local secrets. Moving to cloud vault...`);
      for (const secret of localSecrets) {
        try {
          await saveUserSecret(userId, secret.provider, secret.encryptedKey, secret.lastFour);
          await localDb.delete('secrets', secret.id);
        } catch (e) {
          console.error(`Failed to sync vault secret for ${secret.provider}`, e);
        }
      }
    }

    // B. Sync Character Creations
    const localChars = await localDb.getAll<any>('characters');
    if (localChars.length > 0) {
      console.log(`Found ${localChars.length} local creations. Moving to cloud museum...`);
      for (const char of localChars) {
        try {
          const hash = await hashData(char.data.originalPrompt);
          // Re-save using cloud path (forces 'new' logic to create cloud record)
          await saveCharacter(userId, { ...char.data, id: 'new' }, hash);
          await localDb.delete('characters', char.id);
        } catch (e) {
          console.error(`Failed to sync creation: ${char.data.name}`, e);
        }
      }
    }
  }

  /**
   * Forces a re-sync of static registries to match the hardcoded app defaults.
   */
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
