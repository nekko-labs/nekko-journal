import { View, Text, ScrollView } from 'react-native';
import { MONTH_ABBR, isMonthFilled, countMonthPhotos } from '@nekko/journal-core';
import { useVault } from '../store';
import { serif } from '../theme';

function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

export default function InsightsScreen() {
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const year = useVault((s) => s.currentYear);

  const months = Object.values(vault.months);
  const allGoals = Object.values(vault.years).flatMap((y) => y.goals);
  const tiles = [
    { v: fmt(months.filter(isMonthFilled).length), l: 'months journaled', accent: true },
    { v: fmt(allGoals.filter((g) => g.status === 'done').length), l: 'goals achieved' },
    { v: fmt(Object.keys(vault.years).length), l: 'years tracked' },
    { v: fmt(allGoals.length), l: 'goals set' },
    { v: fmt(months.reduce((n, m) => n + countMonthPhotos(m), 0)), l: 'photos kept' },
    { v: fmt(months.reduce((n, m) => n + (m.reflection.trim() ? m.reflection.trim().split(/\s+/).length : 0), 0)), l: 'words written' },
  ];

  const yearGoals = vault.years[year]?.goals ?? [];
  const counts = MONTH_ABBR.map((_, i) => yearGoals.filter((g) => g.plannedMonth === i + 1).length);
  const max = Math.max(1, ...counts);
  const planned = yearGoals.filter((g) => g.plannedMonth != null);
  const done = planned.filter((g) => g.status === 'done').length;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ fontFamily: serif, fontSize: 30, fontWeight: '600', color: t.text }}>Insights</Text>
      <Text style={{ fontSize: 13.5, color: t.textSoft, marginTop: 6, marginBottom: 18 }}>Everything you've done, at a month scale.</Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {tiles.map((tile, i) => (
          <View key={i} style={{ width: '33.3%', marginBottom: 22 }}>
            <Text style={{ fontFamily: serif, fontSize: 28, fontWeight: '600', color: tile.accent ? t.accent : t.text }}>{tile.v}</Text>
            <Text style={{ fontSize: 11, color: t.textSoft, marginTop: 4 }}>{tile.l}</Text>
          </View>
        ))}
      </View>

      <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint, marginTop: 10, marginBottom: 12, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 22 }}>GOALS ACROSS {year}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 104, gap: 6 }}>
        {counts.map((c, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 6, height: '100%' }}>
            <View style={{ width: '100%', height: c ? Math.max(10, (c / max) * 90) : 3, borderRadius: 6, backgroundColor: c ? t.accent : t.border }} />
            <Text style={{ fontSize: 9, color: t.textFaint }}>{MONTH_ABBR[i][0]}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 28, marginBottom: 12 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint }}>PROGRESS</Text>
        <Text style={{ fontSize: 12, color: t.textSoft }}>{done} of {planned.length} achieved</Text>
      </View>
      <View style={{ height: 6, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${planned.length ? (done / planned.length) * 100 : 0}%`, backgroundColor: t.accent }} />
      </View>
    </ScrollView>
  );
}
