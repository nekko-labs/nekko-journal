import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MONTH_NAMES, countMonthPhotos, goalColor, addGoal, isMonthFilled, monthKey, setYearTheme } from '@getsu/core';
import { useVault } from '../store';
import { serif } from '../theme';
import type { RootStackParams } from '../../App';

export default function YearScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const year = useVault((s) => s.currentYear);
  const currentMonth = useVault((s) => s.currentMonth);
  const mutate = useVault((s) => s.mutate);
  const [draft, setDraft] = useState('');

  const goals = vault.years[year]?.goals ?? [];
  const themeWord = vault.years[year]?.theme ?? '';

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    mutate((v) => addGoal(v, year, { title, color: goalColor(goals.length), metricKind: 'milestone' }));
    setDraft('');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ fontFamily: serif, fontSize: 30, fontWeight: '600', color: t.text, textAlign: 'center' }}>{year}</Text>
      <TextInput
        value={themeWord}
        onChangeText={(value) => mutate((v) => setYearTheme(v, year, value))}
        placeholder="a word for the year"
        placeholderTextColor={t.textFaint}
        style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: t.textSoft, textAlign: 'center', marginTop: 2, marginBottom: 22 }}
      />

      <View style={{ gap: 2 }}>
        {MONTH_NAMES.map((name, index) => {
          const month = index + 1;
          const monthObj = vault.months[monthKey(year, month)];
          const monthGoals = goals.filter((goal) => goal.plannedMonth === month);
          const filled = isMonthFilled(monthObj);
          const current = month === currentMonth;
          const future = month > currentMonth;
          const dim = future && !filled;

          return (
            <Pressable key={month} onPress={() => nav.navigate('Month', { year, month })} style={{ paddingVertical: 13, opacity: dim ? 0.4 : 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 13 }}>
                <Text style={{ width: 54, fontFamily: serif, fontSize: 54, lineHeight: 62, fontWeight: '600', letterSpacing: -1, color: filled || current ? t.accent : t.textFaint }}>{month}</Text>
                <Text style={{ fontFamily: serif, fontSize: 16, fontStyle: 'italic', color: t.textSoft }}>{name}</Text>
                {current && <Text style={{ fontSize: 9.5, fontWeight: '700', letterSpacing: 1.3, color: t.accent }}>THIS MONTH</Text>}
              </View>

              <Text numberOfLines={2} style={{ marginTop: 8, marginLeft: 67, fontSize: 14.5, lineHeight: 21, fontStyle: monthObj?.reflection.trim() ? 'normal' : 'italic', color: monthObj?.reflection.trim() ? t.textSoft : t.textFaint }}>
                {monthObj?.reflection.trim() ? snippet(monthObj.reflection) : future ? 'yet to come' : 'nothing written yet'}
              </Text>

              {(monthGoals.length > 0 || countMonthPhotos(monthObj) > 0) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 13, marginTop: 9, marginLeft: 67 }}>
                  {monthGoals.map((goal) => (
                    <View key={goal.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '75%' }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: goal.color ?? t.accent }} />
                      <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.textSoft, textDecorationLine: goal.status === 'done' ? 'line-through' : 'none', opacity: goal.status === 'done' ? 0.6 : 1 }}>{goal.title}</Text>
                    </View>
                  ))}
                  {countMonthPhotos(monthObj) > 0 && <Text style={{ fontSize: 11.5, color: t.textFaint }}>📷 {countMonthPhotos(monthObj)}</Text>}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint, marginTop: 22, marginBottom: 10 }}>GOALS FOR {year}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={add} placeholder="Add a goal for the year…" placeholderTextColor={t.textFaint} style={{ flex: 1, fontSize: 14.5, color: t.text, borderBottomWidth: 1, borderBottomColor: t.border, paddingVertical: 6 }} />
        <Pressable onPress={add}><Text style={{ color: t.accent, fontSize: 22 }}>＋</Text></Pressable>
      </View>
      <Text style={{ fontSize: 11.5, color: t.textFaint, marginTop: 10 }}>Plan goals into months on the Goals tab.</Text>
    </ScrollView>
  );
}

function snippet(markdown: string, length = 104): string {
  const clean = markdown.replace(/[#>*`_]/g, ' ').replace(/^\s*[-*]\s*/gm, '').replace(/\s+/g, ' ').trim();
  return clean.length > length ? `${clean.slice(0, length).trimEnd()}…` : clean;
}
