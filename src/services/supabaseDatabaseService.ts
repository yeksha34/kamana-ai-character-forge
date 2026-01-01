import { supabase } from './supabaseClient';
import { CharacterData } from '../types';

/**
 * Fetches a character by ID.
 * If ID is 'new' or fetch fails, returns a fresh empty character with sentinel ID.
 */
export async function fetchCharacterById(id: string): Promise<CharacterData> {
    // Factory for empty character
    const createEmptyCharacter = (): CharacterData => ({
        id: 'new', // sentinel
        name: '',
        version: 1,
        status: 'draft',
        tags: [],
        fields: [],
        isNSFW: false,
        characterImageUrl: '',
        scenarioImageUrl: '',
        characterImagePrompt: '',
        scenarioImagePrompt: '',
        isCharacterImageLocked: false,
        isScenarioImageLocked: false,
        originalPrompt: ''
    });

    if (!supabase || id === 'new') return createEmptyCharacter();

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.error('Fetch character error:', error);
        return createEmptyCharacter();
    }

    return data.data as CharacterData;
}

/**
 * Saves a character. If `id` is 'new', inserts a new record; otherwise, updates existing.
 * Returns the persisted record from Supabase.
 */
export async function saveCharacter(userId: string, character: CharacterData, contentHash: string) {
    if (!supabase) throw new Error("Supabase client is not initialized.");

    // Prepare data for persistence
    const characterToPersist = { ...character };

    if (characterToPersist.id === 'new') {
        delete characterToPersist.id;  // remove sentinel
    }

    const dbPayload = {
        user_id: userId,
        data: characterToPersist,
        content_hash: contentHash,
        parent_bot_id: characterToPersist.parentBotId || null,
        bot_name: characterToPersist.name,
        version: characterToPersist.version,
        status: characterToPersist.status,
        is_nsfw: characterToPersist.isNSFW
    };

    if (characterToPersist.id === 'new') {
        // Insert new record
        const { data, error } = await supabase
            .from('characters')
            .insert([dbPayload])
            .select();

        if (error) {
            console.error('Supabase insert error:', error);
            throw error;
        }

        return data ? data[0] : null;
    } else {
        // Update existing record
        const { data, error } = await supabase
            .from('characters')
            .update(dbPayload)
            .eq('id', characterToPersist.id)
            .select();

        if (error) {
            console.error('Supabase update error:', error);
            throw error;
        }

        return data ? data[0] : null;
    }
}

/**
 * Deletes a single character version by ID.
 */
export async function deleteRecord(id: string) {
    if (!supabase) return;

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Supabase delete error:', error);
        throw error;
    }
}

/**
 * Deletes all versions of a bot by parent_bot_id.
 */
export async function deleteBotEntirely(parentBotId: string) {
    if (!supabase) return;

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('parent_bot_id', parentBotId);

    if (error) {
        console.error('Supabase cascading delete error:', error);
        throw error;
    }
}

/**
 * Retrieves all character records for a specific user (newest first).
 */
export async function getRawCharactersByUser(userId: string) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
    }

    return data || [];
}

/**
 * Retrieves only the latest version of each unique bot for a user.
 */
export async function getLatestBots(userId: string) {
    const allRecords = await getRawCharactersByUser(userId);
    const latestMap = new Map<string, any>();

    allRecords.forEach(record => {
        const parentId = record.parent_bot_id || record.id;
        if (!latestMap.has(parentId)) {
            latestMap.set(parentId, record);
        }
    });

    return Array.from(latestMap.values());
}

/**
 * Fetches full version history for a specific bot.
 */
export async function getBotHistory(parentBotId: string) {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('parent_bot_id', parentBotId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('History fetch error:', error);
        throw error;
    }

    return data || [];
}
