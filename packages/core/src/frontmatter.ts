import { type Month, type MonthKey, parseMonthKey } from '@nekko/journal-shared';

// A month file is Markdown: a frontmatter block of structured fields (serialized as JSON
// for a lossless round-trip) followed by the free-form reflection as the body. This is
// the on-disk format for File System Access export; IndexedDB persistence uses a JSON
// snapshot of the whole vault.

const FENCE = '---';

type MonthMeta = Omit<Month, 'reflection'>;

export function serializeMonth(m: Month): string {
  const { reflection, ...meta } = m;
  const json = JSON.stringify(meta, null, 2);
  return `${FENCE}\n${json}\n${FENCE}\n\n${reflection.trimEnd()}\n`;
}

export function parseMonth(key: MonthKey, text: string): Month {
  const { year, month } = parseMonthKey(key);
  const trimmed = text.replace(/^﻿/, '');
  if (trimmed.startsWith(FENCE)) {
    const end = trimmed.indexOf(`\n${FENCE}`, FENCE.length);
    if (end !== -1) {
      const block = trimmed.slice(FENCE.length, end).trim();
      const body = trimmed.slice(end + FENCE.length + 1).replace(/^\n+/, '').trimEnd();
      try {
        const meta = JSON.parse(block) as MonthMeta;
        return { ...meta, id: key, year, month, reflection: body };
      } catch {
        // fall through to treating the whole thing as a body
      }
    }
  }
  // No (valid) frontmatter — treat the entire text as the reflection.
  const ts = new Date().toISOString();
  return {
    id: key, year, month,
    reflection: trimmed,
    highlights: [], struggles: [], gratitude: [], photos: [],
    trackers: {}, goalCheckins: {},
    createdAt: ts, updatedAt: ts,
  };
}
