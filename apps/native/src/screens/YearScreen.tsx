import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MONTH_NAMES, goalColor, addGoal, setYearTheme } from '@nekko/journal-core';
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
        onChangeText={(v) => mutate((vault) => setYearTheme(vault, year, v))}
        placeholder="a word for the year"
        placeholderTextColor={t.textFaint}
        style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 15, color: t.textSoft, textAlign: 'center', marginTop: 2, marginBottom: 18 }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {MONTH_NAMES.map((name, i) => {
          const month = i + 1;
          const mg = goals.filter((g) => g.plannedMonth === month);
          return (
            <Pressable
              key={month}
              onPress={() => nav.navigate('Month', { year, month })}
              style={{ width: '48%', minHeight: 88, marginBottom: 12, padding: 10, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent' }}
            >
              <Text style={{ fontFamily: serif, fontSize: 19, fontWeight: '600', color: t.text, marginBottom: 4 }}>{name}</Text>
              {month === currentMonth && (
                <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: t.accent, marginBottom: 4 }}>THIS MONTH</Text>
              )}
              {mg.length === 0 ? (
                <Text style={{ fontSize: 11.5, fontStyle: 'italic', color: t.textFaint }}>＋ plan a goal</Text>
              ) : mg.map((g) => (
                <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: g.color ?? t.accent }} />
                  <Text numberOfLines={1} style={{ fontSize: 12.5, color: t.text, textDecorationLine: g.status === 'done' ? 'line-through' : 'none', flexShrink: 1 }}>{g.title}</Text>
                </View>
              ))}
            </Pressable>
          );
        })}
      </View>

      <Text style={{ fontSize: 10.5, fontWeight: '600', letterSpacing: 1.6, color: t.textFaint, marginTop: 20, marginBottom: 10 }}>GOALS FOR {year}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          placeholder="Add a goal for the year…"
          placeholderTextColor={t.textFaint}
          style={{ flex: 1, fontSize: 14.5, color: t.text, borderBottomWidth: 1, borderBottomColor: t.border, paddingVertical: 6 }}
        />
        <Pressable onPress={add}><Text style={{ color: t.accent, fontSize: 22 }}>＋</Text></Pressable>
      </View>
      <Text style={{ fontSize: 11.5, color: t.textFaint, marginTop: 10 }}>Plan goals into months on the Goals tab.</Text>
    </ScrollView>
  );
}
