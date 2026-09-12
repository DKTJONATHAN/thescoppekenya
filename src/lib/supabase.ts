import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!client) {
    client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return client;
}

export type ArticleCommentRow = {
  id: string;
  slug: string;
  name: string;
  body: string;
  created_at: string;
  parent_id: string | null;
};

export type ArticlePollVoteRow = {
  id: string;
  slug: string;
  option_id: string;
  voter_key: string;
  created_at: string;
};

/** Stable anonymous voter id per browser (for one-vote-per-device). */
export function getVoterKey(): string {
  const STORAGE = "zn-voter-key";
  try {
    let k = localStorage.getItem(STORAGE);
    if (!k) {
      k =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(STORAGE, k);
    }
    return k;
  } catch {
    return `session-${Date.now()}`;
  }
}
