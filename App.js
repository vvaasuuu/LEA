import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import OnboardingScreen      from './frontend/screens/OnboardingScreen';
import TabNavigator           from './frontend/navigation/TabNavigator';
import CompanyDetailScreen    from './frontend/screens/CompanyDetailScreen';
import ProfileScreen          from './frontend/screens/ProfileScreen';
import { Storage } from './frontend/utils/storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const done = await Storage.get(Storage.KEYS.ONBOARDING_COMPLETE);
        setOnboardingDone(!!done);
      } catch (e) {
        console.error('checkOnboarding failed:', e);
      } finally {
        setLoading(false);
      }
    }
    checkOnboarding();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#0288D1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboardingDone ? (
          <Stack.Screen
            name="Onboarding"
            children={(props) => (
              <OnboardingScreen {...props} onComplete={() => setOnboardingDone(true)} />
            )}
          />
        ) : (
          <>
            <Stack.Screen name="Main"           component={TabNavigator} />
            <Stack.Screen name="Profile"        component={ProfileScreen} />
            <Stack.Screen name="CompanyDetail"  component={CompanyDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
