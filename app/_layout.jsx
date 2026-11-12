// Layout raiz do app — envolve tudo com o AuthProvider
import '../styles.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { DemoProvider } from '../context/DemoContext';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { View, ActivityIndicator, Platform } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <DemoProvider>
        {Platform.OS === 'web' ? (
          <View style={{ $$css: true, _: 'fightmatch-web-viewport' }}>
            <View style={{ $$css: true, _: 'fightmatch-web-frame' }}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="chat" />
              </Stack>
            </View>
          </View>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="chat" />
          </Stack>
        )}
      </DemoProvider>
    </AuthProvider>
  );
}
