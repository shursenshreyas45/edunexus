import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1e293b',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          elevation: 8,
          shadowColor: '#1e293b',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 4 }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'EduNexus Home',
          tabBarLabel: 'Home'
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile'
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Directory',
          tabBarLabel: 'Search'
        }}
      />
      <Tabs.Screen
        name="war-rooms"
        options={{
          title: 'War Rooms',
          tabBarLabel: 'Social'
        }}
      />
      <Tabs.Screen
        name="create-listing"
        options={{
          title: 'Create Listing',
          href: null,
        }}
      />
      <Tabs.Screen
        name="create-post"
        options={{
          title: 'New Post',
          href: null,
        }}
      />
      <Tabs.Screen
        name="post/[id]"
        options={{
          title: 'Post Details',
          href: null,
        }}
      />
    </Tabs>
  );
}
