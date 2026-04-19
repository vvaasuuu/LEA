import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Dimensions, Animated,
} from 'react-native';
import { Storage } from '../utils/storage';

const { width } = Dimensions.get('window');

// ── Breed options for Screen 1 ──────────────────────────────────────────────
const BREEDS = [
  { id: 'golden', label: 'Golden Retriever', emoji: '🐕' },
  { id: 'labrador', label: 'Labrador', emoji: '🦮' },
  { id: 'corgi', label: 'Corgi', emoji: '🐩' },
  { id: 'beagle', label: 'Beagle', emoji: '🐶' },
];

// ── Condition options for Screen 3 ──────────────────────────────────────────
const CONDITIONS = [
  'PCOS',
  'PCOD',
  'Endometriosis',
  'Irregular cycles',
  'Calcium / Vitamin D deficiency',
  'Thyroid issues',
  'None',
  'Prefer not to say',
];

// ── Priority options for Screen 4 ───────────────────────────────────────────
const PRIORITIES = [
  'Career growth',
  'Personal health',
  'Relationships',
  'Travel',
  'Family planning (someday)',
  "I'm not sure yet",
];

// ── Life stage options for Screen 2 ─────────────────────────────────────────
const LIFE_STAGES = ['Student', 'Early career', 'Mid-career'];

// ────────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0); // 0–4

  // Screen 1
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [leaName, setLeaName] = useState('');

  // Screen 2
  const [age, setAge] = useState('');
  const [lifeStage, setLifeStage] = useState(null);

  // Screen 3
  const [conditions, setConditions] = useState([]);

  // Screen 4
  const [priorities, setPriorities] = useState([]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleCondition(item) {
    // 'None' and 'Prefer not to say' are exclusive
    if (item === 'None' || item === 'Prefer not to say') {
      setConditions([item]);
      return;
    }
    setConditions(prev => {
      const filtered = prev.filter(c => c !== 'None' && c !== 'Prefer not to say');
      return filtered.includes(item)
        ? filtered.filter(c => c !== item)
        : [...filtered, item];
    });
  }

  function togglePriority(item) {
    setPriorities(prev =>
      prev.includes(item) ? prev.filter(p => p !== item) : [...prev, item]
    );
  }

  function canAdvance() {
    if (step === 0) return selectedBreed && leaName.trim().length > 0;
    if (step === 1) return age.trim().length > 0 && lifeStage;
    if (step === 2) return conditions.length > 0;
    if (step === 3) return priorities.length > 0;
    return true;
  }

  async function handleFinish() {
    await Storage.set(Storage.KEYS.LEA_BREED, selectedBreed);
    await Storage.set(Storage.KEYS.LEA_NAME, leaName.trim());
    await Storage.set(Storage.KEYS.USER_AGE, age.trim());
    await Storage.set(Storage.KEYS.USER_LIFE_STAGE, lifeStage);
    await Storage.set(Storage.KEYS.USER_CONDITIONS, conditions);
    await Storage.set(Storage.KEYS.USER_PRIORITIES, priorities);
    await Storage.set(Storage.KEYS.USER_POINTS, 0);
    await Storage.set(Storage.KEYS.LEA_STAGE, 'puppy');
    await Storage.set(Storage.KEYS.ONBOARDING_COMPLETE, true);
    navigation.replace('Main');
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <View style={styles.progressRow}>
      {[0, 1, 2, 3, 4].map(i => (
        <View
          key={i}
          style={[
            styles.progressDot,
            i <= step && styles.progressDotActive,
          ]}
        />
      ))}
    </View>
  );

  // ── Screen renderers ───────────────────────────────────────────────────────

  const Screen1 = () => (
    <View style={styles.screenContent}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.heading}>Meet your companion.</Text>
      <Text style={styles.subheading}>
        Pick Lea's breed and give her a name. She'll grow with you throughout the app.
      </Text>

      <Text style={styles.label}>Choose a breed</Text>
      <View style={styles.breedGrid}>
        {BREEDS.map(breed => (
          <TouchableOpacity
            key={breed.id}
            style={[styles.breedCard, selectedBreed === breed.id && styles.breedCardSelected]}
            onPress={() => setSelectedBreed(breed.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.breedEmoji}>{breed.emoji}</Text>
            <Text style={[styles.breedLabel, selectedBreed === breed.id && styles.breedLabelSelected]}>
              {breed.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Name her</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Lea, Mochi, Biscuit..."
        placeholderTextColor="#C0A0AA"
        value={leaName}
        onChangeText={setLeaName}
        maxLength={20}
        autoCapitalize="words"
      />
    </View>
  );

  const Screen2 = () => (
    <View style={styles.screenContent}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.heading}>A little about you.</Text>
      <Text style={styles.subheading}>
        This helps us show you the most relevant health timeline and decisions.
      </Text>

      <Text style={styles.label}>Your age</Text>
      <TextInput
        style={[styles.input, { width: 120 }]}
        placeholder="e.g. 23"
        placeholderTextColor="#C0A0AA"
        value={age}
        onChangeText={setAge}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Text style={styles.label}>Where are you right now?</Text>
      <View style={styles.chipRow}>
        {LIFE_STAGES.map(stage => (
          <TouchableOpacity
            key={stage}
            style={[styles.chip, lifeStage === stage && styles.chipSelected]}
            onPress={() => setLifeStage(stage)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, lifeStage === stage && styles.chipTextSelected]}>
              {stage}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const Screen3 = () => (
    <View style={styles.screenContent}>
      <Text style={styles.emoji}>🩺</Text>
      <Text style={styles.heading}>Any diagnosed conditions?</Text>
      <Text style={styles.subheading}>
        Select all that apply. This personalises your health timeline — nothing is shared.
      </Text>

      <View style={styles.chipWrap}>
        {CONDITIONS.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, conditions.includes(item) && styles.chipSelected]}
            onPress={() => toggleCondition(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, conditions.includes(item) && styles.chipTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const Screen4 = () => (
    <View style={styles.screenContent}>
      <Text style={styles.emoji}>✨</Text>
      <Text style={styles.heading}>What matters to you right now?</Text>
      <Text style={styles.subheading}>
        Pick as many as feel true. Family planning is one option among equals — never the default.
      </Text>

      <View style={styles.chipWrap}>
        {PRIORITIES.map(item => (
          <TouchableOpacity
            key={item}
            style={[styles.chip, priorities.includes(item) && styles.chipSelected]}
            onPress={() => togglePriority(item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, priorities.includes(item) && styles.chipTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const Screen5 = () => (
    <View style={styles.screenContent}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.heading}>Your data stays with you.</Text>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardText}>
          Everything you share with LEA is stored only on your device. It is never sent to a server,
          never sold, and never used to train any model.
        </Text>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardText}>
          LEA provides health education and general guidance. It is{' '}
          <Text style={styles.bold}>not a substitute for medical advice.</Text>
          {'\n\n'}All health information is sourced from WHO, ACOG, NHS, and Singapore MOH guidelines.
          Always consult a healthcare provider for personal medical decisions.
        </Text>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.dataCardText}>
          You can delete your data at any time from the app settings.
        </Text>
      </View>
    </View>
  );

  const screens = [Screen1, Screen2, Screen3, Screen4, Screen5];
  const CurrentScreen = screens[step];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressBar />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CurrentScreen />
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
          onPress={step === 4 ? handleFinish : () => setStep(s => s + 1)}
          disabled={!canAdvance()}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {step === 4 ? "I'm ready — let's go 🐾" : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFF0F5',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 4,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0C0D0',
  },
  progressDotActive: {
    backgroundColor: '#C2185B',
    width: 24,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  screenContent: {
    paddingTop: 24,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#880E4F',
    marginBottom: 8,
    lineHeight: 32,
  },
  subheading: {
    fontSize: 15,
    color: '#6D4C5E',
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#880E4F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Breed grid
  breedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  breedCard: {
    width: (width - 68) / 2,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0C0D0',
    alignItems: 'center',
  },
  breedCardSelected: {
    borderColor: '#C2185B',
    backgroundColor: '#FCE4EC',
  },
  breedEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  breedLabel: {
    fontSize: 13,
    color: '#6D4C5E',
    fontWeight: '500',
    textAlign: 'center',
  },
  breedLabelSelected: {
    color: '#880E4F',
    fontWeight: '700',
  },

  // Text input
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0C0D0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#3D1A24',
    marginBottom: 28,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0C0D0',
  },
  chipSelected: {
    backgroundColor: '#C2185B',
    borderColor: '#C2185B',
  },
  chipText: {
    fontSize: 14,
    color: '#6D4C5E',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Data privacy cards
  dataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#C2185B',
  },
  dataCardText: {
    fontSize: 14,
    color: '#4A1A2C',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFF0F5',
    borderTopWidth: 1,
    borderTopColor: '#F0C0D0',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtnText: {
    color: '#C2185B',
    fontSize: 15,
    fontWeight: '600',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#C2185B',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: {
    backgroundColor: '#F0C0D0',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});