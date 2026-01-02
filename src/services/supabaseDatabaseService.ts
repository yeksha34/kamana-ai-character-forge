
import { supabase } from './supabaseClient';
import { CharacterData } from '../types';

const LOCAL_STORAGE_KEY = 'kamana_local_characters';

/**
 * Helper to get characters from local storage
 */
function getLocalStore(): any[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Helper to save characters to local storage
 */
function saveLocalStore(data: any[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

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

    if (id === 'new') return createEmptyCharacter();

    if (!supabase) {
        const store = getLocalStore();
        const found = store.find(c => c.id === id);
        return found ? found.data : createEmptyCharacter();
    }

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
 * Returns the persisted record. Fallbacks to localStorage in development.
 */
export async function saveCharacter(userId: string, character: CharacterData, contentHash: string) {
    const characterToPersist = { ...character };
    const isNew = characterToPersist.id === 'new';

    if (!supabase) {
        const store = getLocalStore();
        const id = isNew ? `local-${Date.now()}` : characterToPersist.id!;
        
        const dbPayload = {
            id,
            user_id: userId,
            data: { ...characterToPersist, id },
            content_hash: contentHash,
            parent_bot_id: characterToPersist.parentBotId || id,
            bot_name: characterToPersist.name,
            version: characterToPersist.version,
            status: characterToPersist.status,
            is_nsfw: characterToPersist.isNSFW,
            created_at: new Date().toISOString()
        };

        if (isNew) {
            store.push(dbPayload);
        } else {
            const index = store.findIndex(c => c.id === id);
            if (index !== -1) store[index] = dbPayload;
            else store.push(dbPayload);
        }

        saveLocalStore(store);
        return dbPayload;
    }

    if (isNew) {
        delete characterToPersist.id; // remove sentinel
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

    if (isNew) {
        const { data, error } = await supabase
            .from('characters')
            .insert([dbPayload])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    } else {
        const { data, error } = await supabase
            .from('characters')
            .update(dbPayload)
            .eq('id', characterToPersist.id)
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    }
}

/**
 * Deletes a single character record by ID.
 */
export async function deleteRecord(id: string) {
    if (!supabase) {
        const store = getLocalStore();
        saveLocalStore(store.filter(c => c.id !== id));
        return;
    }

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Deletes all versions of a bot by parent_bot_id.
 */
export async function deleteBotEntirely(parentBotId: string) {
    if (!supabase) {
        const store = getLocalStore();
        saveLocalStore(store.filter(c => c.parent_bot_id !== parentBotId));
        return;
    }

    const { error } = await supabase
        .from('characters')
        .delete()
        .eq('parent_bot_id', parentBotId);

    if (error) throw error;
}

/**
 * Retrieves all character records for a specific user.
 */
export async function getRawCharactersByUser(userId: string) {
    if (!supabase) {
        const store = getLocalStore();
        return store.filter(c => c.user_id === userId).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
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
    if (!supabase) {
        const store = getLocalStore();
        return store.filter(c => c.parent_bot_id === parentBotId).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('parent_bot_id', parentBotId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}
