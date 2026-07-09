import { describe, it, expect } from 'vitest';
import { serializeVaultToFiles, parseVaultFromFiles, VAULT_MARKER } from './vaultfiles.js';
import { seedDemoVault } from './seed.js';
import { createEmptyVault, addGoal, updateMonth, setGoalCheckin } from './vault.js';

describe('vault folder serialization', () => {
  it('round-trips a seeded vault losslessly', () => {
    const vault = seedDemoVault(2026);
    const files = serializeVaultToFiles(vault);
    const back = parseVaultFromFiles(files);

    expect(Object.keys(back.months).sort()).toEqual(Object.keys(vault.months).sort());
    expect(Object.keys(back.years).sort()).toEqual(Object.keys(vault.years).sort());
    expect(back.settings).toEqual(vault.settings);
    expect(back.trackers).toEqual(vault.trackers);
    // spot-check a month body + structured fields survive
    for (const key of Object.keys(vault.months)) {
      expect(back.months[key].reflection).toEqual(vault.months[key].reflection);
      expect(back.months[key].goalCheckins).toEqual(vault.months[key].goalCheckins);
      expect(back.months[key].mood).toEqual(vault.months[key].mood);
    }
  });

  it('emits a marker file and one file per month/year', () => {
    const vault = createEmptyVault();
    addGoal(vault, 2026, { title: 'Ship it', plannedMonth: 3 });
    updateMonth(vault, '2026-03', { reflection: 'Shipped.', mood: 5 });
    const files = serializeVaultToFiles(vault);
    const paths = files.map((f) => f.path);
    expect(paths).toContain(VAULT_MARKER);
    expect(paths).toContain('years/2026.json');
    expect(paths).toContain('months/2026-03.md');
  });

  it('preserves goal-checkin photos (inline data URLs)', () => {
    const vault = createEmptyVault();
    setGoalCheckin(vault, '2026-05', 'g1', { done: true, photos: [{ id: 'p1', src: 'data:image/png;base64,AAAA', caption: 'proof' }] });
    const back = parseVaultFromFiles(serializeVaultToFiles(vault));
    expect(back.months['2026-05'].goalCheckins.g1.photos?.[0].src).toBe('data:image/png;base64,AAAA');
  });

  it('ignores foreign folders / missing marker', () => {
    const back = parseVaultFromFiles([{ path: 'notes/random.txt', content: 'hi' }]);
    expect(Object.keys(back.months)).toHaveLength(0);
  });
});
