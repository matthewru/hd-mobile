import { Tabs, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Simple role-based auth check
// In a real app, get this from a secure storage or auth context
const getUserRole = (): 'law enforcement' | 'community' | null => {
  // For development: We're using the current path to determine role
  // In production, this should come from your auth system
  return null; // This will be determined by which screen we're on
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'law enforcement' | 'community' | null>(null);
  
  useEffect(() => {
    // Determine user role based on which tab they're accessing
    // In a real app, you would get this from your auth system
    const currentSegments = segments as string[];
    if (currentSegments.includes('index')) {
      setUserRole('law enforcement');
    } else if (currentSegments.includes('explore')) {
      setUserRole('community');
    }
  }, [segments]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Police View',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shield.fill" color={color} />,
          // Hide this tab for community users
          href: userRole === 'community' ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent community users from accessing police view
            if (userRole === 'community') {
              e.preventDefault();
            }
          },
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.2.fill" color={color} />,
          // Hide this tab for law enforcement users
          href: userRole === 'law enforcement' ? null : undefined,
        }}
        listeners={{
          tabPress: (e) => {
            // Prevent law enforcement users from accessing community view
            if (userRole === 'law enforcement') {
              e.preventDefault();
            }
          },
        }}
      />
    </Tabs>
  );
}
