import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LearnScreen      from '../screens/LearnScreen';
import ExploreScreen    from '../screens/ExploreScreen';
import SimulationScreen from '../screens/SimulationScreen';
import ActScreen        from '../screens/ActScreen';

const Tab = createBottomTabNavigator();

function tabIcon(focused, name, nameOutline, color, size) {
  return <Ionicons name={focused ? name : nameOutline} size={size} color={color} />;
}

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#FFF8F5', borderTopColor: '#F5DCE8' },
        tabBarActiveTintColor: '#C2185B',
        tabBarInactiveTintColor: '#B39DBC',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={LearnScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'home', 'home-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'search', 'search-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Simulation"
        component={SimulationScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'desktop', 'desktop-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Planning"
        component={ActScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'stats-chart', 'stats-chart-outline', color, size),
        }}
      />
    </Tab.Navigator>
  );
}
