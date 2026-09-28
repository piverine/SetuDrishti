import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" options={{ title: 'ICU Command' }} />
      <Tabs.Screen name="two"   options={{ title: 'Settings' }} />
      <Tabs.Screen name="omnimed" options={{ title: 'OmniMed AI' }} />
      <Tabs.Screen name="ar-lens" options={{ title: 'AR Lens' }} />
    </Tabs>
  );
}
