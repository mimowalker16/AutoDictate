import React from 'react';
import { Tabs } from 'expo-router';
import { BottomNav } from '@/components/BottomNav';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarLabel: 'Notes',
        }}
      />
      <Tabs.Screen
        name="record"
        options={{
          title: 'Record',
          tabBarLabel: 'Record',
        }}
      />
    </Tabs>
  );
}
