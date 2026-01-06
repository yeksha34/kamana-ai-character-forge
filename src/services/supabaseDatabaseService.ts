import { supabase } from './supabaseClient';
import { localDb } from './localDbService';
import { CharacterData, AIModelMeta, AISecret, AIProvider, TagMeta, ChatSession } from '../types';

export async function fetchCharacterById(id: string): Promise<CharacterData> {
    const createEmptyCharacter = (): CharacterData => ({
        id: 'new',
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
        originalPrompt: '',
        promptHistory: []
    });

    if (id === 'new' || !id) return createEmptyCharacter();

    if (!supabase) {
        const record = await localDb.getById<any>('characters', id);
        if (!record) return createEmptyCharacter();
        return { ...createEmptyCharacter(), ...record.data, id: record.id };
    }

    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();
    if (error || !data) return createEmptyCharacter();
    
    return { 
        ...createEmptyCharacter(), 
        ...(data.data as CharacterData), 
        id: data.id 
    };
}

export async function saveCharacter(userId: string, character: CharacterData, contentHash: string) {
    const characterToPersist = { ...character };
    const isNew = characterToPersist.id === 'new';
    
    if (!supabase) {
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
        await localDb.save('characters', dbPayload);
        return dbPayload;
    }

    if (isNew) delete characterToPersist.id;
    const dbPayload = {
        user_id: userId, data: characterToPersist, content_hash: contentHash,
        parent_bot_id: characterToPersist.parentBotId || null, bot_name: characterToPersist.name,
        version: characterToPersist.version, status: characterToPersist.status, is_nsfw: characterToPersist.isNSFW
    };

    if (isNew) {
        const { data, error } = await supabase.from('characters').insert([dbPayload]).select();
        if (error) throw error;
        return data ? data[0] : null;
    } else {
        const { data, error } = await supabase.from('characters').update(dbPayload).eq('id', characterToPersist.id).select();
        if (error) throw error;
        return data ? data[0] : null;
    }
}

export async function getRawCharactersByUser(userId: string) {
    if (!supabase) {
        const all = await localDb.getAll<any>('characters');
        return all.filter(c => c.user_id === userId).sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    const { data, error } = await supabase.from('characters').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

// --- Chat Session Branching Service ---
export async function fetchChatSession(characterId: string, userId: string): Promise<ChatSession | null> {
  const sessionId = `chat-${userId}-${characterId}`;
  
  // Try local first for instant speed
  const local = await localDb.getById<ChatSession>('chat_sessions', sessionId);
  if (local) return local;

  if (!supabase) return null;

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('data')
    .eq('id', sessionId)
    .single();

  if (error || !data) return null;
  return data.data as ChatSession;
}

export async function saveChatSession(session: ChatSession) {
  // Always save local first
  await localDb.save('chat_sessions', session);

  if (!supabase) return;

  const { error } = await supabase
    .from('chat_sessions')
    .upsert({
      id: session.id,
      user_id: session.userId,
      character_id: session.characterId,
      data: session,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.warn("Supabase chat sync deferred:", error.message);
  }
}

export async function fetchAllModels(): Promise<AIModelMeta[]> {
  if (!supabase) return localDb.getAll<AIModelMeta>('models');
  const { data, error } = await supabase.from('ai_models').select('*');
  if (error) return [];
  return data.map(m => ({ ...m, isFree: m.is_free }));
}

export async function saveModelsBulk(models: AIModelMeta[]) {
  if (!supabase) return;
  const payload = models.map(m => ({ id: m.id, name: m.name, is_free: m.isFree, provider: m.provider, type: m.type }));
  await supabase.from('ai_models').upsert(payload, { onConflict: 'id' });
}

export async function fetchAllTags(): Promise<TagMeta[]> {
  if (!supabase) return localDb.getAll<TagMeta>('tags');
  const { data, error } = await supabase.from('tags').select('*');
  if (error) return [];
  return data.map(t => ({
    id: t.id,
    name: t.name,
    textGenerationRule: t.text_generation_rule,
    imageGenerationRule: t.image_generation_rule,
    isNSFW: t.disable_ethics
  }));
}

export async function saveTagsBulk(tags: TagMeta[]) {
  if (!supabase) return;
  const payload = tags.map(t => ({
    id: t.id,
    name: t.name,
    text_generation_rule: t.textGenerationRule,
    image_generation_rule: t.imageGenerationRule,
    disable_ethics: t.isNSFW
  }));
  await supabase.from('tags').upsert(payload, { onConflict: 'id' });
}

export async function fetchUserSecrets(userId: string): Promise<AISecret[]> {
  if (!supabase) {
    const all = await localDb.getAll<any>('secrets');
    return all.map(s => ({ ...s, id: s.id, updatedAt: s.updatedAt || Date.now() }));
  }
  const { data, error } = await supabase.from('user_secrets').select('*').eq('user_id', userId);
  if (error) return [];
  return data.map(s => ({ 
    id: s.id, 
    provider: s.provider, 
    encryptedKey: s.encrypted_key,
    lastFour: s.last_four,
    updatedAt: s.updated_at || Date.now()
  }));
}

export async function saveUserSecret(userId: string, provider: AIProvider, encryptedKey: string, lastFour: string) {
  const updatedAt = Date.now();
  if (!supabase) {
    const secret = { id: provider, provider, encryptedKey, lastFour, updatedAt };
    await localDb.save('secrets', secret);
    return;
  }
  await supabase.from('user_secrets').upsert({
    user_id: userId,
    provider,
    encrypted_key: encryptedKey,
    last_four: lastFour,
    updated_at: updatedAt
  }, { onConflict: 'user_id,provider' });
}

export async function deleteUserSecret(userId: string, provider: AIProvider) {
  if (!supabase) {
    await localDb.delete('secrets', provider);
    return;
  }
  await supabase.from('user_secrets').delete().eq('user_id', userId).eq('provider', provider);
}

export async function deleteRecord(id: string) {
    if (!supabase) {
        await localDb.delete('characters', id);
        return;
    }
    await supabase.from('characters').delete().eq('id', id);
}