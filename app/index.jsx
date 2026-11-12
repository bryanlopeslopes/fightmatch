// Tela inicial — abre o app diretamente enquanto o login estiver desativado
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/home');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator color={COLORS.primary} size="large" />
    </View>
  );
}
