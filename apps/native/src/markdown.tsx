import React from 'react';
import { View, Text } from 'react-native';
import { type Tokens, serif } from './theme';

// A tiny RN markdown renderer mirroring the web one: # ## ### headings, - / *
// bullets, > quote, **bold**, *italic*, `code`. No editor highlighting; the
// editor is a plain multiline TextInput (see MonthScreen).
function inline(text: string, t: Tokens): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  const re = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rest))) {
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    if (m[2] != null) nodes.push(<Text key={k++} style={{ fontWeight: '600' }}>{m[2]}</Text>);
    else if (m[3] != null) nodes.push(<Text key={k++} style={{ fontStyle: 'italic' }}>{m[3]}</Text>);
    else if (m[4] != null) nodes.push(<Text key={k++} style={{ fontFamily: 'Courier', backgroundColor: t.surface2 }}> {m[4]} </Text>);
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) nodes.push(rest);
  return nodes;
}

export function Markdown({ source, t }: { source: string; t: Tokens }) {
  const lines = String(source || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    if (ln.startsWith('### ') || ln.startsWith('## ') || ln.startsWith('# ')) {
      const level = ln.startsWith('### ') ? 3 : ln.startsWith('## ') ? 2 : 1;
      const size = level === 1 ? 24 : level === 2 ? 20 : 17;
      blocks.push(
        <Text key={key++} style={{ fontFamily: serif, fontSize: size, fontWeight: '600', color: t.text, marginTop: blocks.length ? 14 : 0, marginBottom: 8 }}>
          {inline(ln.replace(/^#{1,3} /, ''), t)}
        </Text>,
      );
      i++; continue;
    }
    if (ln.startsWith('> ')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) { q.push(lines[i].slice(2)); i++; }
      blocks.push(
        <View key={key++} style={{ borderLeftWidth: 2, borderLeftColor: t.accent, paddingLeft: 12, marginBottom: 12 }}>
          <Text style={{ color: t.textSoft, fontStyle: 'italic', fontSize: 15, lineHeight: 24 }}>{inline(q.join(' '), t)}</Text>
        </View>,
      );
      continue;
    }
    if (/^[-*] /.test(ln)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      blocks.push(
        <View key={key++} style={{ marginBottom: 12, gap: 6 }}>
          {items.map((it, idx) => (
            <View key={idx} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent, marginTop: 8 }} />
              <Text style={{ flex: 1, fontSize: 15, lineHeight: 22, color: t.text }}>{inline(it, t)}</Text>
            </View>
          ))}
        </View>,
      );
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |> |[-*] )/.test(lines[i])) { para.push(lines[i]); i++; }
    blocks.push(<Text key={key++} style={{ fontSize: 15, lineHeight: 25, color: t.text, marginBottom: 12 }}>{inline(para.join(' '), t)}</Text>);
  }
  return <View>{blocks}</View>;
}
