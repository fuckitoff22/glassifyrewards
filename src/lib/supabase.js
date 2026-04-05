import { createClient } from "@supabase/supabase-js";

NEXT_PUBLIC_SUPABASE_URL=https://tyuvjjzouuvzsbpzoxrg.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_oVny3QkRU9WqQjSz1-j7wg_dh0l6KEp

export const supabase = createClient(supabaseUrl, supabaseKey);