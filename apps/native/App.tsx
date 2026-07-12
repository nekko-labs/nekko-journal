import { useEffect } from 'react';
import { ActivityIndicator, View, Text, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useVault } from './src/store';
import { handleDeepLink } from './src/intents';
import YearScreen from './src/screens/YearScreen';
import MonthScreen from './src/screens/MonthScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import ReflectScreen from './src/screens/ReflectScreen';
import YouScreen from './src/screens/YouScreen';

export type RootStackParams = {
  Tabs: undefined;
  Month: { year: number; month: number };
};

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator();

const TAB_EMOJI: Record<string, string> = { Year: '🗓', Goals: '◎', Reflect: '✧', You: '🌙' };

function Tabs() {
  const t = useVault((s) => s.tokens());
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textFaint,
        tabBarStyle: { backgroundColor: t.bg, borderTopColor: t.border },
        tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>{TAB_EMOJI[route.name] ?? '•'}</Text>,
      })}
    >
      <Tab.Screen name="Year" component={YearScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Reflect" component={ReflectScreen} />
      <Tab.Screen name="You" component={YouScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const loaded = useVault((s) => s.loaded);
  const load = useVault((s) => s.load);
  const theme = useVault((s) => s.vault?.settings.theme ?? 'light');
  const t = useVault((s) => s.tokens());

  useEffect(() => { void load(); }, [load]);

  // Siri / Shortcuts / agent entry: getsu://intent?phrase=...
  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => { handleDeepLink(url); };
    const sub = Linking.addEventListener('url', onUrl);
    void Linking.getInitialURL().then((url) => { if (url) handleDeepLink(url); });
    return () => sub.remove();
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  const navTheme = theme === 'dark'
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: t.bg, card: t.bg, text: t.text, border: t.border, primary: t.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: t.bg, card: t.bg, text: t.text, border: t.border, primary: t.accent } };

  return (
    <SafeAreaProvider>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Month" component={MonthScreen} options={{ title: '', headerBackTitle: 'Year', headerStyle: { backgroundColor: t.bg }, headerShadowVisible: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
