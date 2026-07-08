import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import { MONTH_NAMES, monthKey, photoLimit, updateMonth, updateGoal, countMonthPhotos } from '@nekko/journal-core';
import { useVault } from '../store';
import { serif } from '../theme';
import { Markdown } from '../markdown';
import type { RootStackParams } from '../../App';

export default function MonthScreen() {
  const route = useRoute<RouteProp<RootStackParams, 'Month'>>();
  const { year, month } = route.params;
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const mutate = useVault((s) => s.mutate);
  const [editing, setEditing] = useState(false);

  const key = monthKey(year, month);
  const monthObj = vault.months[key];
  const reflection = monthObj?.reflection ?? '';
  const plan = vault.settings.plan ?? 'free';
  const limit = photoLimit(plan);
  const goals = (vault.years[year]?.goals ?? []).filter((g) => g.plannedMonth === month);

  const setReflection = (md: string) => mutate((v) => updateMonth(v, key, { reflection: md }));
  const toggleDone = (id: string, done: boolean) => mutate((v) => updateGoal(v, year, id, { status: done ? 'active' : 'done' }));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ fontFamily: serif, fontSize: 36, fontWeight: '600', color: t.text }}>{MONTH_NAMES[month - 1]} {year}</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 12 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint }}>JOURNAL</Text>
        <Pressable onPress={() => setEditing((e) => !e)}><Text style={{ color: t.accent, fontWeight: '600', fontSize: 12.5 }}>{editing ? 'Done' : 'Edit'}</Text></Pressable>
      </View>

      {editing ? (
        <>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            multiline
            placeholder="Write in markdown…"
            placeholderTextColor={t.textFaint}
            style={{ minHeight: 180, backgroundColor: t.surface2, borderRadius: 14, padding: 15, fontFamily: 'Courier', fontSize: 14, lineHeight: 22, color: t.text, textAlignVertical: 'top' }}
          />
          <Text style={{ fontSize: 11, color: t.textFaint, marginTop: 8 }}>Markdown: # heading · **bold** · *italic* · - list · &gt; quote</Text>
        </>
      ) : reflection.trim() ? (
        <Markdown source={reflection} t={t} />
      ) : (
        <Text style={{ fontSize: 14, fontStyle: 'italic', color: t.textFaint }}>Nothing yet. Tap Edit to write this month's entry.</Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 14, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 22 }}>
        <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint }}>GOALS THIS MONTH</Text>
        <Text style={{ fontSize: 11, color: t.textFaint }}>{countMonthPhotos(monthObj)}/{limit} photos</Text>
      </View>

      {goals.length === 0 ? (
        <Text style={{ fontSize: 14, fontStyle: 'italic', color: t.textFaint }}>No goals here yet. Plan some on the Goals tab.</Text>
      ) : goals.map((g) => {
        const done = g.status === 'done';
        return (
          <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: g.color ?? t.accent }} />
            <Text style={{ flex: 1, fontFamily: serif, fontSize: 19, fontWeight: '600', color: t.text, textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.55 : 1 }}>{g.title}</Text>
            <Pressable
              onPress={() => toggleDone(g.id, done)}
              style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: done ? t.success : t.border, backgroundColor: done ? t.success : 'transparent' }}
            >
              <Text style={{ color: done ? '#fff' : t.textFaint, fontWeight: '700' }}>✓</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}
