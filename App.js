import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import OnboardingScreen    from './frontend/screens/OnboardingScreen';
import AuthScreen          from './frontend/screens/AuthScreen';
import TabNavigator        from './frontend/navigation/TabNavigator';
import CompanyDetailScreen from './frontend/screens/CompanyDetailScreen';
import CompanyFilterScreen from './frontend/screens/CompanyFilterScreen';
import CompanyExploreScreen from './frontend/screens/CompanyExploreScreen';
import ProfileScreen       from './frontend/screens/ProfileScreen';
import { auth, db }        from './frontend/utils/firebase';
import { Storage }         from './frontend/utils/storage';

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading,       setLoading]       = useState(true);
  const [user,          setUser]          = useState(null);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check local storage first (fast path)
        const localDone = await Storage.get(Storage.KEYS.ONBOARDING_COMPLETE);
        if (localDone) {
          setUser(firebaseUser);
          setOnboardingDone(true);
          setLoading(false);
          return;
        }
        // Fall back to Firestore (e.g. first login on a new device)
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists() && snap.data().onboarding_complete) {
            const d = snap.data();
            await Promise.all([
              Storage.set(Storage.KEYS.LEA_NAME,                    d.lea_name                    ?? ''),
              Storage.set(Storage.KEYS.LEA_BREED,                   d.lea_breed                   ?? 'dog'),
              Storage.set(Storage.KEYS.USER_AGE,                    d.user_age                    ?? ''),
              Storage.set(Storage.KEYS.USER_LIFE_STAGE,             d.user_life_stage             ?? ''),
              Storage.set(Storage.KEYS.USER_CONDITIONS,             d.user_conditions             ?? []),
              Storage.set(Storage.KEYS.USER_PRIORITIES,             d.user_priorities             ?? []),
              Storage.set(Storage.KEYS.USER_POINTS,                 d.user_points                 ?? 0),
              Storage.set(Storage.KEYS.LEA_STAGE,                   d.lea_stage                   ?? 'puppy'),
              Storage.set(Storage.KEYS.ONBOARDING_COMPLETE,         true),
              Storage.set(Storage.KEYS.RELATIONSHIP_CONTENT_ENABLED, d.relationship_content_enabled ?? false),
            ]);
            setOnboardingDone(true);
          } else {
            setOnboardingDone(false);
          }
        } catch (e) {
          console.error('App: Firestore read error:', e);
          setOnboardingDone(false);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
        setOnboardingDone(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#C2185B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : !onboardingDone ? (
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
            <Stack.Screen name="CompanyFilter"  component={CompanyFilterScreen} />
            <Stack.Screen name="CompanyExplore" component={CompanyExploreScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
