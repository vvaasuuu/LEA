import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Storage } from '../utils/storage';

const { width } = Dimensions.get('window');

const PLUM    = '#6A1B9A';
const ROSE    = '#C2185B';
const HEADING = '#3D0C4E';
const MUTED   = '#B39DBC';
const BORDER  = '#EDD5E4';
const CHIP_BG = '#FFF0F5';

// ── Breed options ────────────────────────────────────────────────────────────
const BREEDS = [
  { id: 'dog', label: 'Dog', emoji: '🐶' },
  { id: 'cat', label: 'Cat', emoji: '🐱' },
];

// ── Condition options (main list) ─────────────────────────────────────────────
const CONDITION_ITEMS = [
  'PCOS',
  'PCOD',
  'Endometriosis',
  'Irregular cycles',
  'Calcium / Vitamin D deficiency',
  'Thyroid issues',
];

// ── Priority options ─────────────────────────────────────────────────────────
const PRIORITIES = [
  'Career growth',
  'Personal health',
  'Relationships',
  'Travel',
  'Family planning (someday)',
  "I'm not sure yet",
];

// ── Life stage options ───────────────────────────────────────────────────────
const LIFE_STAGES = ['Student', 'Early career', 'Mid-career'];

// ────────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState(0);

  // Screen 1
  const [selectedBreed, setSelectedBreed] = useState(null);
  const [leaName,       setLeaName]       = useState('');

  // Screen 2
  const [age,       setAge]       = useState('');
  const [lifeStage, setLifeStage] = useState(null);

  // Screen 3 — conditions + dynamic "Others" inputs
  const [conditions,  setConditions]  = useState([]);
  const [othersItems, setOthersItems] = useState(['']);

  // Screen 4
  const [priorities, setPriorities] = useState([]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function toggleCondition(item) {
    if (item === 'None' || item === 'Prefer not to say') {
      setConditions([item]);
      setOthersItems(['']);
      return;
    }
    if (item === 'Others') {
      setConditions(prev => {
        const filtered = prev.filter(c => c !== 'None' && c !== 'Prefer not to say');
        if (filtered.includes('Others')) {
          setOthersItems(['']);
          return filtered.filter(c => c !== 'Others');
        }
        return [...filtered, 'Others'];
      });
      return;
    }
    setConditions(prev => {
      const filtered = prev.filter(c => c !== 'None' && c !== 'Prefer not to say');
      return filtered.includes(item)
        ? filtered.filter(c => c !== item)
        : [...filtered, item];
    });
  }

  function updateOthersItem(index, text) {
    setOthersItems(prev => {
      const updated = [...prev];
      updated[index] = text;
      // When the last slot gets text, open a new empty slot
      if (index === prev.length - 1 && text.trim().length > 0) {
        return [...updated, ''];
      }
      return updated;
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
    await Storage.set(Storage.KEYS.LEA_BREED,      selectedBreed);
    await Storage.set(Storage.KEYS.LEA_NAME,       leaName.trim());
    await Storage.set(Storage.KEYS.USER_AGE,       age.trim());
    await Storage.set(Storage.KEYS.USER_LIFE_STAGE, lifeStage);

    const othersEntries = othersItems
      .filter(t => t.trim().length > 0)
      .map(t => `Others: ${t.trim()}`);
    const conditionsToSave = [
      ...conditions.filter(c => c !== 'Others'),
      ...(othersEntries.length > 0 ? othersEntries : conditions.includes('Others') ? ['Others'] : []),
    ];
    await Storage.set(Storage.KEYS.USER_CONDITIONS, conditionsToSave);
    await Storage.set(Storage.KEYS.USER_PRIORITIES, priorities);
    await Storage.set(Storage.KEYS.USER_POINTS,     0);
    await Storage.set(Storage.KEYS.LEA_STAGE,       'puppy');
    await Storage.set(Storage.KEYS.ONBOARDING_COMPLETE, true);
    onComplete();
  }

  // ── Progress bar ──────────────────────────────────────────────────────────

  const ProgressBar = () => (
    <View style={styles.progressRow}>
      {[0, 1, 2, 3, 4].map(i => (
        <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
      ))}
    </View>
  );

  // ── Screen renderers ──────────────────────────────────────────────────────

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
        placeholderTextColor={MUTED}
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
        placeholderTextColor={MUTED}
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

  const Screen3 = () => {
    const isOthersOn = conditions.includes('Others');
    return (
      <View style={styles.screenContent}>
        <Text style={styles.emoji}>🩺</Text>
        <Text style={styles.heading}>Any diagnosed conditions?</Text>
        <Text style={styles.subheading}>
          Select all that apply. This personalises your health timeline — nothing is shared.
        </Text>

        {/* Main condition list */}
        <View style={styles.condList}>
          {CONDITION_ITEMS.map((item, i) => {
            const active = conditions.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.condRow, styles.condRowBorder, active && styles.condRowActive]}
                onPress={() => toggleCondition(item)}
                activeOpacity={0.7}
              >
                {active && <View style={styles.condAccent} />}
                <Text style={[styles.condText, active && styles.condTextActive]}>{item}</Text>
                {active && <Text style={styles.condCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          {/* Others row */}
          <TouchableOpacity
            style={[styles.condRow, isOthersOn && styles.condRowBorder, isOthersOn && styles.condRowActive]}
            onPress={() => toggleCondition('Others')}
            activeOpacity={0.7}
          >
            {isOthersOn && <View style={styles.condAccent} />}
            <Text style={[styles.condText, isOthersOn && styles.condTextActive]}>Others</Text>
            {isOthersOn && <Text style={styles.condCheck}>✓</Text>}
          </TouchableOpacity>

          {/* Dynamic Others text inputs — new slot opens when previous is filled */}
          {isOthersOn && (
            <View style={styles.othersInputWrap}>
              {othersItems.map((val, i) => (
                <TextInput
                  key={i}
                  style={[styles.othersInput, i > 0 && { marginTop: 8 }]}
                  placeholder={i === 0 ? 'Describe your condition...' : 'Add another...'}
                  placeholderTextColor={MUTED}
                  value={val}
                  onChangeText={text => updateOthersItem(i, text)}
                  returnKeyType="done"
                />
              ))}
            </View>
          )}
        </View>

        {/* Exclusive options */}
        <View style={styles.condExclusiveRow}>
          {['None', 'Prefer not to say'].map(item => {
            const active = conditions.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.chip, active && styles.chipSelected]}
                onPress={() => toggleCondition(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, active && styles.chipTextSelected]}>{item}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
      <Text style={styles.heading}>Before you begin.</Text>
      <Text style={styles.subheading}>
        A few things worth knowing about how LEA handles your information.
      </Text>

      <View style={styles.privacyCard}>

        <View style={styles.privacyRow}>
          <Text style={styles.privacyIcon}>📱</Text>
          <View style={styles.privacyTextBlock}>
            <Text style={styles.privacyTitle}>Stored on your device only</Text>
            <Text style={styles.privacyBody}>
              Everything you share stays on your phone. Nothing is sent to a server, sold, or used to train any model.
            </Text>
          </View>
        </View>

        <View style={styles.privacyDivider} />

        <View style={styles.privacyRow}>
          <Text style={styles.privacyIcon}>📋</Text>
          <View style={styles.privacyTextBlock}>
            <Text style={styles.privacyTitle}>Evidence-based, not medical advice</Text>
            <Text style={styles.privacyBody}>
              Health content in LEA is sourced from WHO, ACOG, NHS, and Singapore MOH guidelines. Always consult a healthcare provider for personal decisions.
            </Text>
          </View>
        </View>

        <View style={styles.privacyDivider} />

        <View style={styles.privacyRow}>
          <Text style={styles.privacyIcon}>🗑️</Text>
          <View style={styles.privacyTextBlock}>
            <Text style={styles.privacyTitle}>Delete anytime</Text>
            <Text style={styles.privacyBody}>
              You can clear all your data from the app settings at any time.
            </Text>
          </View>
        </View>

      </View>
    </View>
  );

  const screens = [Screen1, Screen2, Screen3, Screen4, Screen5];

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ProgressBar />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {screens[step]()}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 24 },

  progressRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingTop: 16, paddingBottom: 4,
  },
  progressDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: BORDER },
  progressDotActive: { backgroundColor: ROSE, width: 24 },

  screenContent: { paddingTop: 24 },
  emoji:    { fontSize: 40, marginBottom: 12 },
  heading:  { fontSize: 26, fontWeight: '700', color: HEADING, marginBottom: 8, lineHeight: 32 },
  subheading: { fontSize: 15, color: '#546E7A', lineHeight: 22, marginBottom: 28 },
  label: {
    fontSize: 13, fontWeight: '700', color: HEADING,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  // Breed grid
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  breedCard: {
    width: (width - 68) / 2, paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 2,
    borderColor: BORDER, alignItems: 'center',
  },
  breedCardSelected:  { borderColor: ROSE, backgroundColor: '#FCE4EC' },
  breedEmoji:         { fontSize: 28, marginBottom: 6 },
  breedLabel:         { fontSize: 13, color: '#546E7A', fontWeight: '500', textAlign: 'center' },
  breedLabelSelected: { color: HEADING, fontWeight: '700' },

  // Text input
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: HEADING, marginBottom: 28,
  },

  // Chips
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    backgroundColor: CHIP_BG, borderWidth: 1.5, borderColor: BORDER,
  },
  chipSelected:     { backgroundColor: ROSE, borderColor: ROSE },
  chipText:         { fontSize: 14, color: HEADING, fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF', fontWeight: '700' },

  // Condition list
  condList: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden', marginBottom: 14,
  },
  condRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#FFFFFF', gap: 10 },
  condRowBorder:  { borderBottomWidth: 1, borderBottomColor: BORDER },
  condRowActive:  { backgroundColor: '#FFF0F5' },
  condAccent:     { width: 3, height: 20, borderRadius: 2, backgroundColor: ROSE },
  condText:       { flex: 1, fontSize: 15, color: HEADING, fontWeight: '500' },
  condTextActive: { color: PLUM, fontWeight: '700' },
  condCheck:      { fontSize: 15, color: ROSE, fontWeight: '700' },

  othersInputWrap: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 6 },
  othersInput: {
    backgroundColor: '#FFF5F8', borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: HEADING,
  },
  condExclusiveRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },

  // Privacy card
  privacyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden', marginBottom: 16,
  },
  privacyRow:       { flexDirection: 'row', alignItems: 'flex-start', padding: 18, gap: 14 },
  privacyDivider:   { height: 1, backgroundColor: BORDER, marginHorizontal: 18 },
  privacyIcon:      { fontSize: 22, marginTop: 1 },
  privacyTextBlock: { flex: 1 },
  privacyTitle:     { fontSize: 14, fontWeight: '700', color: HEADING, marginBottom: 4 },
  privacyBody:      { fontSize: 13, color: '#546E7A', lineHeight: 20 },

  // Footer
  footer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 16, gap: 12,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: BORDER,
  },
  backBtn:         { paddingHorizontal: 16, paddingVertical: 14 },
  backBtnText:     { color: ROSE, fontSize: 15, fontWeight: '600' },
  nextBtn:         { flex: 1, backgroundColor: ROSE, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: BORDER },
  nextBtnText:     { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
