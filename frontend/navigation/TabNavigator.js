import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import LearnScreen from '../screens/LearnScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ActScreen from '../screens/ActScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#B3E5FC' },
        tabBarActiveTintColor: '#0288D1',
        tabBarInactiveTintColor: '#90A4AE',
      }}
    >
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📖</Text> }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🗺️</Text> }}
      />
      <Tab.Screen
        name="Act"
        component={ActScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⚡</Text> }}
      />
    </Tab.Navigator>
  );
}