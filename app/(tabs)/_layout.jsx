// Layout das tabs — barra de navegação inferior
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES } from '../../constants/theme';

const TabIcon = ({ emoji, label, focused }) => (
  <View style={styles.iconContainer}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
  </View>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🥊" label="Lutar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="matches"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔥" label="Matches" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="academias"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📍" label="Academias" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 8,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 6,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: SIZES.textXs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  labelFocused: {
    color: COLORS.primary,
  },
});
