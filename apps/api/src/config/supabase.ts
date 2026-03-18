import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client with service role key for server-side storage operations
export const supabase = env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
    : null;
