import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bnxmiuszccgzbpvcboay.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pNvBLssNjvrhsPmYbCGDPw_rQifr7Qr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});
