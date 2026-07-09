import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { type PhotoRef } from '@nekko/journal-core';

interface LightboxProps {
  photos: PhotoRef[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  onCaption: (photoId: string, caption: string) => void;
  onDelete: (photoId: string) => void;
}

/**
 * Full-screen photo viewer: large image, editable caption, prev/next across the
 * set, delete. Keyboard: Esc closes, ←/→ navigate. Backdrop click closes.
 */
export default function Lightbox({ photos, index, onIndexChange, onClose, onCaption, onDelete }: LightboxProps) {
  const photo = photos[index];
  const [draft, setDraft] = useState(photo?.caption ?? '');

  // Keep the caption draft in sync when navigating between photos.
  useEffect(() => { setDraft(photo?.caption ?? ''); }, [photo?.id]);

  const go = (delta: number) => {
    const next = index + delta;
    if (next >= 0 && next < photos.length) onIndexChange(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!photo) return null;

  const commitCaption = () => { if (draft !== (photo.caption ?? '')) onCaption(photo.id, draft); };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade"
      style={{ background: 'rgba(12,10,8,.92)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ color: 'rgba(255,255,255,.85)' }}>
        <span className="text-[12.5px] tabular-nums" style={{ color: 'rgba(255,255,255,.6)' }}>
          {index + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm('Delete this photo? This cannot be undone.')) onDelete(photo.id); }}
            className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10"
            aria-label="Delete photo"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* image + nav */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2">
        {index > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10"
            style={{ color: '#fff' }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={26} />
          </button>
        )}
        <img
          src={photo.src}
          alt={photo.caption ?? ''}
          className="max-h-full max-w-full rounded-lg object-contain animate-rise"
          onClick={(e) => e.stopPropagation()}
        />
        {index < photos.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10"
            style={{ color: '#fff' }}
            aria-label="Next photo"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* caption editor */}
      <div className="px-4 pb-6 pt-3" onClick={(e) => e.stopPropagation()} style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitCaption}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitCaption(); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Add a caption…"
          className="mx-auto block w-full max-w-lg rounded-full border-0 bg-white/10 px-4 py-2.5 text-center text-[14px] outline-none placeholder:text-white/40"
          style={{ color: '#fff' }}
        />
      </div>
    </div>
  );
}
