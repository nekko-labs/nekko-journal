import { View, Text, ScrollView, Pressable } from 'react-native';
import { MONTH_ABBR, setGoalPlannedMonth, updateGoal, type Goal } from '@nekko/journal-core';
import { useVault } from '../store';
import { serif, type Tokens } from '../theme';

export default function GoalsScreen() {
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const year = useVault((s) => s.currentYear);
  const mutate = useVault((s) => s.mutate);

  const goals = vault.years[year]?.goals ?? [];

  const place = (g: Goal, month: number | null) => mutate((v) => setGoalPlannedMonth(v, year, g.id, month));
  const toggleDone = (g: Goal) => mutate((v) => updateGoal(v, year, g.id, { status: g.status === 'done' ? 'active' : 'done' }));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ fontFamily: serif, fontSize: 30, fontWeight: '600', color: t.text }}>Goals · {year}</Text>
      <Text style={{ fontSize: 13.5, color: t.textSoft, marginTop: 6, marginBottom: 18 }}>Tap a month to plan each goal into it, or None to keep it on the board.</Text>

      {goals.map((g) => {
        const done = g.status === 'done';
        return (
          <View key={g.id} style={{ borderTopWidth: 1, borderTopColor: t.border, paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: g.color ?? t.accent }} />
              <Text style={{ flex: 1, fontSize: 15, color: t.text, textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{g.title}</Text>
              <Pressable onPress={() => toggleDone(g)} style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: done ? t.success : t.border, backgroundColor: done ? t.success : 'transparent' }}>
                <Text style={{ color: done ? '#fff' : t.textFaint, fontSize: 12, fontWeight: '700' }}>✓</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              <Pressable onPress={() => place(g, null)} style={chip(g.plannedMonth == null, t)}>
                <Text style={chipText(g.plannedMonth == null, t)}>None</Text>
              </Pressable>
              {MONTH_ABBR.map((abbr, i) => {
                const active = g.plannedMonth === i + 1;
                return (
                  <Pressable key={abbr} onPress={() => place(g, i + 1)} style={chip(active, t)}>
                    <Text style={chipText(active, t)}>{abbr}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

function chip(active: boolean, t: Tokens) {
  return { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 99, marginRight: 6, backgroundColor: active ? t.accentSoft : t.surface2 } as const;
}
function chipText(active: boolean, t: Tokens) {
  return { fontSize: 11, fontWeight: '600' as const, color: active ? t.accent : t.textSoft };
}
