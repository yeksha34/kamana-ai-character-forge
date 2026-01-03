/**
 * KAMANA FORGE: MASTER DATABASE SCHEMA (v1.1)
 * 
 * Includes the "initialize_forge_schema" RPC which allows the application
 * to self-heal or run migrations remotely if the function is installed.
 */

export const SCHEMA_SQL = `-- 1. INITIALIZE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PUBLIC REGISTRIES
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

-- 3. USER CONTENT STORAGE
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

-- 4. SECURITY VAULT (Encrypted Keys)
CREATE TABLE IF NOT EXISTS public.user_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    encrypted_key TEXT NOT NULL,
    last_four TEXT,
    updated_at BIGINT NOT NULL,
    UNIQUE(user_id, provider)
);

-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bot-assets', 'bot-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_secrets ENABLE ROW LEVEL SECURITY;

-- 7. DEFINE RLS POLICIES
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

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON public.characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_secrets_user_id ON public.user_secrets(user_id);

-- 9. ARCHITECT TOOL: SELF-INITIALIZATION RPC
-- To enable the app to run this SQL automatically, manually run this block ONCE in the SQL editor:
/*
CREATE OR REPLACE FUNCTION initialize_forge_schema(sql_code text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
`;