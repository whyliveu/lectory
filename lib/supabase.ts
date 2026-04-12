import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function isValidSupabaseEnv(url: string | undefined, anonKey: string | undefined) {
  return Boolean(url && anonKey && url.startsWith("http"));
}

export function getSupabaseClient() {
  if (!isValidSupabaseEnv(supabaseUrl, supabaseAnonKey)) {
    return null;
  }

  return createClient(supabaseUrl!, supabaseAnonKey!);
}
