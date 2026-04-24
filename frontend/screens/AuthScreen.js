import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';

const BG      = '#FAF6F0';
const PLUM    = '#3D0C4E';
const ROSE    = '#C2185B';
const MUTED   = '#B39DBC';
const BORDER  = '#EDD5E4';
const WHITE   = '#FFFFFF';

const PUPPY = require('../assets/dogs/Puppy open eyes.png');

const ERROR_MESSAGES = {
  'auth/email-already-in-use':    'This email is already registered.',
  'auth/invalid-email':           'Please enter a valid email address.',
  'auth/weak-password':           'Password must be at least 6 characters.',
  'auth/user-not-found':          'No account found with this email.',
  'auth/wrong-password':          'Incorrect password.',
  'auth/invalid-credential':      'Invalid email or password.',
  'auth/too-many-requests':       'Too many attempts. Please try again later.',
  'auth/network-request-failed':  'Network error. Check your connection.',
};

function friendlyError(code) {
  return ERROR_MESSAGES[code] || 'Something went wrong. Please try again.';
}

export default function AuthScreen() {
  const [tab,             setTab]             = useState('login');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  function switchTab(t) {
    setTab(t);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSignUp() {
    setError('');
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // App.js onAuthStateChanged fires → no Firestore doc yet → shows Onboarding
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogIn() {
    setError('');
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // App.js onAuthStateChanged fires → checks Firestore → routes to Onboarding or Main
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  }

  const isSignUp = tab === 'signup';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <Image source={PUPPY} style={styles.puppyImage} resizeMode="contain" />
            <Text style={styles.appName}>LEA</Text>
            <Text style={styles.tagline}>Your personal health companion</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabBar}>
            {[['login', 'Log In'], ['signup', 'Sign Up']].map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={styles.tabItem}
                onPress={() => switchTab(key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
                {tab === key && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.fieldLabel}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={MUTED}
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={MUTED}
              value={password}
              onChangeText={t => { setPassword(t); setError(''); }}
              secureTextEntry
            />

            {isSignUp && (
              <>
                <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat your password"
                  placeholderTextColor={MUTED}
                  value={confirmPassword}
                  onChangeText={t => { setConfirmPassword(t); setError(''); }}
                  secureTextEntry
                />
              </>
            )}

            {error !== '' && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
              onPress={isSignUp ? handleSignUp : handleLogIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.primaryBtnText}>{isSignUp ? 'Create account' : 'Log in'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => switchTab(isSignUp ? 'login' : 'signup')}
              activeOpacity={0.7}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.switchLink}>{isSignUp ? 'Log in' : 'Sign up'}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 40 },

  // Hero
  hero: { alignItems: 'center', paddingTop: 36, paddingBottom: 8 },
  puppyImage: { width: 120, height: 120, marginBottom: 12 },
  appName:    { fontSize: 36, fontWeight: '800', color: PLUM, letterSpacing: 4 },
  tagline:    { fontSize: 14, color: MUTED, fontWeight: '500', marginTop: 4 },

  // Tabs
  tabBar: {
    flexDirection: 'row', marginTop: 28, marginBottom: 4,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabLabel: { fontSize: 15, fontWeight: '600', color: MUTED },
  tabLabelActive: { color: PLUM },
  tabUnderline: {
    position: 'absolute', bottom: -1, left: '20%', right: '20%',
    height: 2, backgroundColor: ROSE, borderRadius: 1,
  },

  // Form
  form: { paddingTop: 24 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: PLUM,
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: PLUM, marginBottom: 20,
  },

  errorText: {
    fontSize: 14, color: '#D32F2F', textAlign: 'center',
    marginBottom: 16, lineHeight: 20,
  },

  primaryBtn: {
    backgroundColor: ROSE, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 16,
  },
  primaryBtnDisabled: { backgroundColor: BORDER },
  primaryBtnText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  switchBtn:  { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 14, color: MUTED },
  switchLink: { color: ROSE, fontWeight: '700' },
});
