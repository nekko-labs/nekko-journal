import { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  buildReflectionMaterial,
  photoMemories,
  reflectOnJourneyMock,
  type JourneyReflection,
} from '@getsu/core';
import { useVault } from '../store';
import { serif, type Tokens } from '../theme';
import type { RootStackParams } from '../../App';

const GROUPS: { key: keyof JourneyReflection; label: string }[] = [
  { key: 'highlights', label: 'Highlights' },
  { key: 'growth', label: 'Areas of growth' },
  { key: 'workOn', label: 'To work on' },
];

export default function ReflectScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const material = useMemo(() => buildReflectionMaterial(vault), [vault]);
  const memories = useMemo(() => photoMemories(vault), [vault]);
  const reflection = useMemo(() => reflectOnJourneyMock(material), [material]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text style={{ fontFamily: serif, fontSize: 30, fontWeight: '600', color: t.text }}>Reflect</Text>
      <Text style={{ fontSize: 13.5, color: t.textSoft, marginTop: 6, marginBottom: 24 }}>Your memories, and what they add up to.</Text>

      <Text style={label(t)}>MEMORIES</Text>
      {memories.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 2 }}>
          {memories.map((memory) => (
            <Pressable
              key={memory.photo.id}
              onPress={() => {
                const match = memory.key.match(/^(\d{4})-(\d{2})$/);
                if (match) nav.navigate('Month', { year: Number(match[1]), month: Number(match[2]) });
              }}
              style={{ width: 160, height: 208, borderRadius: 16, overflow: 'hidden', backgroundColor: t.surface2 }}
            >
              <Image source={{ uri: memory.photo.src }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, paddingTop: 28, backgroundColor: 'rgba(0,0,0,0.52)' }}>
                <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: 'rgba(255,255,255,0.78)' }}>{memory.label.toUpperCase()}</Text>
                {memory.photo.caption && <Text numberOfLines={2} style={{ marginTop: 2, fontSize: 12, fontWeight: '500', lineHeight: 16, color: '#fff' }}>{memory.photo.caption}</Text>}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : material.recentReflections.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 2 }}>
          {material.recentReflections.map((item, index) => (
            <View key={`${item.label}-${index}`} style={{ width: 224, height: 208, justifyContent: 'space-between', borderRadius: 16, padding: 16, backgroundColor: t.surface2 }}>
              <Text style={{ fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: t.textFaint }}>{item.label.toUpperCase()}</Text>
              <Text style={{ fontFamily: serif, fontSize: 15, fontStyle: 'italic', lineHeight: 23, color: t.textSoft }}>“{item.text}”</Text>
              <View />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ borderRadius: 16, paddingHorizontal: 16, paddingVertical: 20, backgroundColor: t.surface2 }}>
          <Text style={{ fontSize: 13, lineHeight: 20, color: t.textSoft }}>Photos you add to your months show up here as memories.</Text>
        </View>
      )}

      <View style={{ marginTop: 32, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={label(t, 0)}>REFLECTION</Text>
          <Text style={{ fontSize: 11, color: t.textFaint }}>{material.monthsJournaled} months</Text>
        </View>
        <Text style={{ fontSize: 12.5, lineHeight: 19, color: t.textSoft, marginTop: 4, marginBottom: 24 }}>A gentle read of everything you've written so far.</Text>

        <View style={{ gap: 26 }}>
          {GROUPS.map((group) => {
            const items = reflection[group.key];
            if (!items.length) return null;
            const color = group.key === 'highlights' ? t.accent : group.key === 'growth' ? '#7aa889' : '#cc7f6a';
            return (
              <View key={group.key}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.text, marginBottom: 12 }}>{group.label}</Text>
                <View style={{ gap: 10 }}>
                  {items.map((item, index) => (
                    <View key={`${group.key}-${index}`} style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 7, backgroundColor: color }} />
                      <Text style={{ flex: 1, fontSize: 14.5, lineHeight: 22, color: t.textSoft }}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
        <Text style={{ fontSize: 12, lineHeight: 19, color: t.textFaint, marginTop: 26 }}>Reflected offline.</Text>
      </View>
    </ScrollView>
  );
}

function label(t: Tokens, marginTop = 0) {
  return { fontSize: 10.5, fontWeight: '600' as const, letterSpacing: 1.6, color: t.textFaint, marginTop, marginBottom: 12 };
}
