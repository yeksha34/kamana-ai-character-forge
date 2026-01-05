/**
 * KAMANA FORGE: MASTER DATABASE SCHEMA (v1.3)
 * 
 * Migration 1.3:
 * - Added forge_migrations table for structural version tracking.
 * - Formalized JSONB structure for modifiedPrompt history.
 */

export const SCHEMA_SQL = `-- 1. INITIALIZE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SYSTEM MIGRATIONS TRACKING
CREATE TABLE IF NOT EXISTS public.forge_migrations (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PUBLIC REGISTRIES
CREATE TABLE IF NOT EXISTS public.tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    text_generation_rule TEXT NOT NULL,
    image_generation_rule TEXT,
    disable_ethics BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_free BOOLEAN DEFAULT TRUE,
    provider TEXT NOT NULL,
    type TEXT CHECK (type IN ('text', 'image')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. USER CONTENT STORAGE
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    content_hash TEXT,
    parent_bot_id TEXT,
    bot_name TEXT,
    version INTEGER DEFAULT 1,
    status TEXT DEFAULT 'draft',
    is_nsfw BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SECURITY VAULT
CREATE TABLE IF NOT EXISTS public.user_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    last_four TEXT,
    updated_at BIGINT NOT NULL,
    UNIQUE(user_id, provider)
);

-- 6. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bot-assets', 'bot-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 7. ENABLE RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- 8. DEFINE RLS POLICIES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read on tags') THEN
        CREATE POLICY "Allow public read on tags" ON public.tags FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow public read on models') THEN
        CREATE POLICY "Allow public read on models" ON public.ai_models FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own characters') THEN
        CREATE POLICY "Users can manage their own characters" ON public.characters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can manage their own secrets') THEN
        CREATE POLICY "Users can manage their own secrets" ON public.user_secrets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 9. INDEXES
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_secrets_user_id ON public.user_secrets(user_id);

-- 10. ARCHITECT TOOL: SELF-INITIALIZATION RPC
CREATE OR REPLACE FUNCTION initialize_forge_schema(sql_code text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RECORD v1.3 MIGRATION
INSERT INTO public.forge_migrations (version) VALUES ('1.3') ON CONFLICT (version) DO NOTHING;
`;