import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' }
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
