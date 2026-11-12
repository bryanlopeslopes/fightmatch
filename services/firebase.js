// Configuração do Firebase
// IMPORTANTE: Substitua pelos seus dados do Firebase Console
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'configure-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'configure.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'configure-fightmatch',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'configure.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'configure-sender-id',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'configure-app-id',
};

export const firebaseConfigurado = Object.values(firebaseConfig)
  .every((valor) => valor && !valor.startsWith('configure-'));

// Inicializa o app apenas uma vez (evita erro de app duplicado)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth — comportamento diferente em mobile e web
let auth;
if (Platform.OS === 'web') {
  // Na web, usa autenticação padrão (sem persistência AsyncStorage)
  auth = getAuth(app);
} else {
  // No mobile (Android/iOS), usa AsyncStorage para manter sessão salva
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };

// Banco de dados Firestore
export const db = getFirestore(app);

export default app;
