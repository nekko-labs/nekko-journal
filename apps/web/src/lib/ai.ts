import Anthropic from '@anthropic-ai/sdk';
import { type AIProvider, type AICompletionInput, mockProvider } from '@nekko/journal-core';

// Web AI layer: turns the user's locally-stored, bring-your-own Claude key into
// a core AIProvider. No key → the offline mock provider (the assistant still
// works, just heuristically). The key lives only in localStorage — never in the
// vault, so it isn't exported, synced, or written to the folder.

const KEY_STORAGE = 'nekko-ai-key';
const MODEL_STORAGE = 'nekko-ai-model';
const DEFAULT_MODEL = 'claude-opus-4-8';

export function getStoredKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) ?? ''; } catch { return ''; }
}

export function setStoredKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(KEY_STORAGE, key.trim());
    else localStorage.removeItem(KEY_STORAGE);
  } catch { /* ignore */ }
}

export function getStoredModel(): string {
  try { return localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL; } catch { return DEFAULT_MODEL; }
}

export function setStoredModel(model: string): void {
  try { localStorage.setItem(MODEL_STORAGE, model || DEFAULT_MODEL); } catch { /* ignore */ }
}

export function aiConfigured(): boolean {
  return getStoredKey().length > 0;
}

/** A Claude-backed provider using the official SDK (BYO key, direct from browser). */
export function createClaudeProvider(apiKey: string, model = DEFAULT_MODEL): AIProvider {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  return {
    available: true,
    label: 'Claude',
    async complete(input: AICompletionInput): Promise<string> {
      const res = await client.messages.create({
        model,
        max_tokens: input.maxTokens ?? 800,
        system: input.system,
        messages: [{ role: 'user', content: input.user }],
      });
      return res.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
    },
  };
}

/** The active provider based on current settings: Claude if a key is set, else mock. */
export function getAIProvider(): AIProvider {
  const key = getStoredKey();
  if (!key) return mockProvider;
  return createClaudeProvider(key, getStoredModel());
}
