// Ocean palette as RN token objects (RN has no CSS variables). Mirrors the web
// tokens in apps/web/src/index.css so both platforms read as one product.
export interface Tokens {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textSoft: string;
  textFaint: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  success: string;
}

export const LIGHT: Tokens = {
  bg: '#fbf7f1',
  surface: '#fffdfa',
  surface2: '#f0eae0',
  border: '#eae1d4',
  text: '#2b2724',
  textSoft: '#7a726a',
  textFaint: '#a89f93',
  accent: '#3e8fa0',
  accent2: '#7fbfca',
  accentSoft: '#e6eff1',
  success: '#2f8f66',
};

export const DARK: Tokens = {
  bg: '#1c1a18',
  surface: '#262320',
  surface2: '#2f2c27',
  border: '#38332c',
  text: '#ede6dc',
  textSoft: '#a39a90',
  textFaint: '#756f62',
  accent: '#6fb3c2',
  accent2: '#47899b',
  accentSoft: '#21323a',
  success: '#5cb992',
};

export const serif = 'Georgia'; // Fraunces would be loaded via expo-font in a full build
