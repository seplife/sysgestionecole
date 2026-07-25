import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dhijhmggriqlkieshxyo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LDKSslD3hvgAhklHqU-TmQ_AA28-yTs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
