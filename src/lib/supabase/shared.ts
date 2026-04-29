import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

type AccessTokenProvider = () => Promise<string | null>;

type SupabaseClientFactoryOptions = {
  accessToken?: AccessTokenProvider;
};

function normalizeSupabaseUrl(url: string) {
  return url.replace(/\/rest\/v1\/?$/i, "");
}

export function getSupabaseProjectUrl() {
  return normalizeSupabaseUrl(publicEnv.NEXT_PUBLIC_SUPABASE_URL);
}

export function createSupabaseClient(
  options: SupabaseClientFactoryOptions = {},
): SupabaseClient<Database> {
  return createClient<Database>(
    getSupabaseProjectUrl(),
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      accessToken: options.accessToken,
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
