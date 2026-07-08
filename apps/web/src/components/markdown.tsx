import { useRef, type ReactNode } from 'react';
import { Heading1, Heading2, Bold, Italic, List, Quote, Link2, Code } from 'lucide-react';

// A tiny, dependency-free Markdown layer. We deliberately avoid a full markdown
// library and any in-editor syntax highlighting: the editor is a plain textarea
// (natural cursor + text) with a formatting toolbar, and the rendered view is
// produced only when you're done writing. Supported tags: # / ## / ### headings,
// - or * bullets, 1. ordered lists, > quote, **bold**, *italic*, `code`,
// [text](url) links, and --- rules.

// ---------------------------------------------------------------------------
// Inline spans: **bold**, *italic*, `code`, [text](url)
// ---------------------------------------------------------------------------
function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let k = 0;
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\))/;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    if (m[2] != null) {
      nodes.push(<strong key={`${keyBase}-${k++}`} style={{ fontWeight: 600 }}>{m[2]}</strong>);
    } else if (m[3] != null) {
      nodes.push(<em key={`${keyBase}-${k++}`} style={{ fontStyle: 'italic' }}>{m[3]}</em>);
    } else if (m[4] != null) {
      nodes.push(
        <code
          key={`${keyBase}-${k++}`}
          style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: '0.9em', background: 'var(--surface-2)', padding: '1px 5px', borderRadius: 5 }}
        >{m[4]}</code>,
      );
    } else if (m[5] != null && m[6] != null) {
      nodes.push(
        <a key={`${keyBase}-${k++}`} href={m[6]} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>{m[5]}</a>,
      );
    }
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) nodes.push(rest);
  return nodes;
}

/** Render markdown source to calm, themed React. No external dependencies. */
export function Markdown({ source }: { source: string }) {
  const lines = String(source || '').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }

    if (/^---+\s*$/.test(ln)) {
      blocks.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '18px 0' }} />);
      i++; continue;
    }
    if (ln.startsWith('### ')) {
      blocks.push(<div key={key++} className="serif" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', margin: blocks.length ? '16px 0 8px' : '0 0 8px' }}>{inline(ln.slice(4), `h3-${key}`)}</div>);
      i++; continue;
    }
    if (ln.startsWith('## ')) {
      blocks.push(<div key={key++} className="serif" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', color: 'var(--text)', margin: blocks.length ? '18px 0 10px' : '0 0 10px' }}>{inline(ln.slice(3), `h2-${key}`)}</div>);
      i++; continue;
    }
    if (ln.startsWith('# ')) {
      blocks.push(<div key={key++} className="serif" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text)', margin: blocks.length ? '18px 0 10px' : '0 0 10px' }}>{inline(ln.slice(2), `h1-${key}`)}</div>);
      i++; continue;
    }
    if (ln.startsWith('> ')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { q.push(lines[i].slice(2)); i++; }
      blocks.push(
        <div key={key++} style={{ borderLeft: '2px solid var(--accent)', paddingLeft: 13, color: 'var(--text-soft)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.6, margin: '0 0 12px' }}>{inline(q.join(' '), `q-${key}`)}</div>,
      );
      continue;
    }
    // bullet list: - or *
    if (/^[-*] /.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      blocks.push(
        <div key={key++} style={{ display: 'flex', flexDirection: 'column', gap: 7, margin: '0 0 12px' }}>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ marginTop: 8, width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text)' }}>{inline(it, `li-${key}-${idx}`)}</span>
            </div>
          ))}
        </div>,
      );
      continue;
    }
    // ordered list: 1. 2. …
    if (/^\d+\.\s/.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s/, '')); i++; }
      blocks.push(
        <ol key={key++} style={{ margin: '0 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--text)' }}>{inline(it, `ol-${key}-${idx}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    // paragraph (gather consecutive non-block lines)
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |> |[-*] |\d+\.\s|---+\s*$)/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<p key={key++} style={{ fontSize: 15, lineHeight: 1.68, color: 'var(--text)', margin: '0 0 12px' }}>{inline(para.join(' '), `p-${key}`)}</p>);
  }
  return <div>{blocks}</div>;
}

// ---------------------------------------------------------------------------
// Editor: plain textarea + formatting toolbar (no in-editor highlighting)
// ---------------------------------------------------------------------------
export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write in markdown…',
  autoFocus,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Wrap the current selection with `before`/`after` (e.g. ** … **).
  const wrap = (before: string, after = before) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || 'text';
    const next = value.slice(0, s) + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = s + before.length;
      el.selectionEnd = s + before.length + sel.length;
    });
  };

  // Prefix the start of the current line (e.g. "## ", "- ", "> ").
  const linePrefix = (prefix: string) => {
    const el = ref.current;
    if (!el) return;
    const s = el.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = s + prefix.length;
    });
  };

  const link = () => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || 'link';
    const snippet = `[${sel}](url)`;
    const next = value.slice(0, s) + snippet + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      // select the "url" placeholder
      const urlStart = s + snippet.indexOf('url');
      el.selectionStart = urlStart;
      el.selectionEnd = urlStart + 3;
    });
  };

  const Btn = ({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(ev) => ev.preventDefault()} // keep textarea selection
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg transition"
      style={{ color: 'var(--text-soft)', background: 'transparent' }}
      onMouseEnter={(ev) => (ev.currentTarget.style.background = 'var(--surface-2)')}
      onMouseLeave={(ev) => (ev.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );

  return (
    <div>
      <div
        className="mb-2 flex flex-wrap items-center gap-0.5 rounded-xl p-1"
        style={{ background: 'var(--surface-2)' }}
      >
        <Btn title="Heading" onClick={() => linePrefix('## ')}><Heading2 size={16} /></Btn>
        <Btn title="Subheading" onClick={() => linePrefix('### ')}><Heading1 size={16} /></Btn>
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--border)' }} />
        <Btn title="Bold" onClick={() => wrap('**')}><Bold size={16} /></Btn>
        <Btn title="Italic" onClick={() => wrap('*')}><Italic size={16} /></Btn>
        <Btn title="Code" onClick={() => wrap('`')}><Code size={16} /></Btn>
        <span className="mx-1 h-4 w-px" style={{ background: 'var(--border)' }} />
        <Btn title="Bullet list" onClick={() => linePrefix('- ')}><List size={16} /></Btn>
        <Btn title="Quote" onClick={() => linePrefix('> ')}><Quote size={16} /></Btn>
        <Btn title="Link" onClick={link}><Link2 size={16} /></Btn>
      </div>
      <textarea
        ref={ref}
        value={value}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck
        className="w-full resize-y rounded-2xl p-4 outline-none"
        style={{
          minHeight: 200,
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          fontFamily: 'ui-monospace, Menlo, monospace',
          fontSize: 13.5,
          lineHeight: 1.6,
          color: 'var(--text)',
        }}
      />
      <div className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
        Markdown: # heading · **bold** · *italic* · - list · &gt; quote
      </div>
    </div>
  );
}
