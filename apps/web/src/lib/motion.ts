import type { Variants } from 'motion/react';

/* Shared motion vocabulary: ease-out only, small distances, quick and calm.
   Matches the CSS tokens in index.css (--ease-out-quint). */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Per-item entrance for lists and grids. Pass the item's index via `custom`
   for a gentle cascade; the delay is capped so long lists still feel instant. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_OUT, delay: Math.min(i * 0.035, 0.28) },
  }),
};
