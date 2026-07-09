import { View, Text, ScrollView, Pressable } from 'react-native';
import { isMonthFilled, intentCatalog } from '@nekko/journal-core';
import { useVault } from '../store';
import { serif, type Tokens } from '../theme';

const SYNC_LABEL: Record<string, string> = { off: 'Off', idle: 'Ready', syncing: 'Syncing…', synced: 'Synced', error: 'Error' };

export default function YouScreen() {
  const t = useVault((s) => s.tokens());
  const vault = useVault((s) => s.vault)!;
  const setTheme = useVault((s) => s.setTheme);
  const setPlan = useVault((s) => s.setPlan);
  const syncStatus = useVault((s) => s.syncStatus);
  const syncNow = useVault((s) => s.syncNow);

  const theme = vault.settings.theme;
  const plan = vault.settings.plan ?? 'free';
  const filled = Object.values(vault.months).filter(isMonthFilled).length;
  const years = Object.keys(vault.years).map(Number);
  const since = years.length ? Math.min(...years) : 2026;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 8 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 26 }}>🌙</Text>
        </View>
        <View>
          <Text style={{ fontFamily: serif, fontSize: 24, fontWeight: '600', color: t.text }}>Your journal</Text>
          <Text style={{ fontSize: 13, color: t.textSoft, marginTop: 2 }}>{filled} months · since {since}</Text>
        </View>
      </View>

      <Text style={label(t)}>THEME</Text>
      <Seg t={t} options={[{ k: 'light', label: 'Light' }, { k: 'dark', label: 'Dark' }]} value={theme} onChange={(k) => setTheme(k as 'light' | 'dark')} />

      <Text style={label(t)}>PLAN</Text>
      <Seg t={t} options={[{ k: 'free', label: 'Free' }, { k: 'premium', label: 'Premium' }]} value={plan} onChange={(k) => setPlan(k as 'free' | 'premium')} />
      <Text style={{ fontSize: 12, color: t.textFaint, marginTop: 10 }}>
        Premium ($6/mo · first 3 months $3) adds sync, Siri &amp; agent, and up to 25 photos a month. Real billing runs through the App Store / Play Store.
      </Text>

      <Text style={label(t)}>SYNC</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.surface2, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Text style={{ fontSize: 15, color: t.text }}>Cross-device sync</Text>
        <Pressable
          onPress={() => void syncNow()}
          disabled={plan !== 'premium' || syncStatus === 'syncing'}
          style={{ opacity: plan === 'premium' ? 1 : 0.5 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: syncStatus === 'error' ? '#c2563a' : t.accent }}>
            {plan === 'premium' ? (syncStatus === 'off' ? 'Set up' : `${SYNC_LABEL[syncStatus]} · Sync now`) : 'Premium'}
          </Text>
        </Pressable>
      </View>
      <Text style={{ fontSize: 12, color: t.textFaint, marginTop: 8 }}>
        No backend of ours: your vault snapshot goes to your own cloud (iCloud on Apple, Google Drive on Android; an optional Supabase snapshot on the web).
      </Text>

      <Text style={label(t)}>SIRI &amp; SHORTCUTS</Text>
      <View style={{ backgroundColor: t.surface2, borderRadius: 14, padding: 16, gap: 10 }}>
        {intentCatalog().map((c) => (
          <View key={c.phrase}>
            <Text style={{ fontSize: 13.5, fontWeight: '600', color: t.text }}>“{c.phrase}”</Text>
            <Text style={{ fontSize: 12, color: t.textSoft, marginTop: 1 }}>{c.does}</Text>
          </View>
        ))}
      </View>

      <Text style={{ textAlign: 'center', fontSize: 12, color: t.textFaint, marginTop: 40 }}>Local-first · your data stays yours{'\n'}Nekko Journal v1.0</Text>
    </ScrollView>
  );
}

function label(t: Tokens) {
  return { fontSize: 10.5, fontWeight: '600' as const, letterSpacing: 1.6, color: t.textFaint, marginTop: 28, marginBottom: 12 };
}

function Seg({ t, options, value, onChange }: { t: Tokens; options: { k: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, backgroundColor: t.surface2, borderRadius: 14, padding: 5 }}>
      {options.map((o) => {
        const active = value === o.k;
        return (
          <Pressable key={o.k} onPress={() => onChange(o.k)} style={{ flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center', backgroundColor: active ? t.surface : 'transparent' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: active ? t.text : t.textFaint }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
