import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js';
import { type Vault } from '@nekko/journal-core';

// Cloud is entirely optional. When the Supabase env vars are absent the app is a
// fully-functional, account-free, local-first journal — `getSupabase()` returns null
// and every cloud surface degrades gracefully. This is the free tier.

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

export function isCloudConfigured(): boolean {
  return !!(URL && ANON);
}

export function getSupabase(): SupabaseClient | null {
  if (!isCloudConfigured()) return null;
  if (!client) client = createClient(URL!, ANON!, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}

export type Plan = 'free' | 'cloud';

export interface CloudProfile {
  plan: Plan;
}

/** Send a passwordless magic-link / OTP email. */
export async function signInWithEmail(email: string): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: 'Cloud is not configured.' };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  return { error: error?.message };
}

export async function signOut(): Promise<void> {
  await getSupabase()?.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (session: Session | null) => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_e, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/** Read the signed-in user's plan from `profiles` (defaults to free). */
export async function fetchPlan(userId: string): Promise<Plan> {
  const sb = getSupabase();
  if (!sb) return 'free';
  const { data } = await sb.from('profiles').select('plan').eq('user_id', userId).maybeSingle();
  return (data?.plan as Plan) ?? 'free';
}

/** Pull the user's vault snapshot from cloud (null if none yet). */
export async function pullVault(userId: string): Promise<Vault | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.from('vaults').select('data').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return data.data as Vault;
}

/** Push the user's vault snapshot to cloud (upsert). */
export async function pushVault(userId: string, vault: Vault): Promise<{ error?: string }> {
  const sb = getSupabase();
  if (!sb) return { error: 'Cloud is not configured.' };
  const { error } = await sb
    .from('vaults')
    .upsert({ user_id: userId, data: vault, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  return { error: error?.message };
}
