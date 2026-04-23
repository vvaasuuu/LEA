import React, { useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import StoryScreen from './StoryScreen';

const PLUM   = '#3D0C4E';
const ROSE   = '#C2185B';
const MUTED  = '#B39DBC';
const BORDER = '#EDD5E4';

const SCORE_TRACKS = [
  { label: 'Career',       color: '#F28C28' },
  { label: 'Health',       color: '#1A936F' },
  { label: 'Relationship', color: '#E85D75' },
  { label: 'Fertility',    color: '#3D5A80' },
];

function StartPage({ onStart }) {
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.sectionLabel}>SECTION 3</Text>
        <Text style={s.screenTitle}>Simulation</Text>

        {/* Story card */}
        <View style={s.storyCard}>
          <View style={s.storyCardTop}>
            <Text style={s.storyTag}>SCENARIO 01</Text>
            <Text style={s.storyMeta}>7 episodes · Ages 22–38</Text>
          </View>
          <Text style={s.storyTitle}>
            The Fertility Window{'\n'}vs Career Acceleration
          </Text>
          <Text style={s.storyDesc}>
            Step into Lea's shoes and navigate real tradeoffs between career ambition
            and fertility planning. Every choice shapes what's possible later.
          </Text>

          <View style={s.statRow}>
            {[
              { value: '7',    label: 'Episodes' },
              { value: '16',   label: 'Years' },
              { value: '4',    label: 'Outcomes' },
            ].map(item => (
              <View key={item.label} style={s.stat}>
                <Text style={s.statValue}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Score tracks */}
        <View style={s.tracksCard}>
          <Text style={s.tracksLabel}>YOU'LL TRACK</Text>
          <View style={s.tracksGrid}>
            {SCORE_TRACKS.map(t => (
              <View key={t.label} style={s.trackRow}>
                <View style={[s.trackDot, { backgroundColor: t.color }]} />
                <Text style={s.trackName}>{t.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity style={s.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={s.startBtnText}>Start Simulation  →</Text>
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          All scenarios are fictional and based on general health research.
          Not a substitute for medical advice.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

export default function SimulationScreen() {
  const [started, setStarted] = useState(false);

  if (started) {
    return <StoryScreen onExit={() => setStarted(false)} />;
  }
  return <StartPage onStart={() => setStarted(true)} />;
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: ROSE,
    letterSpacing: 1.5, marginBottom: 4,
  },
  screenTitle: {
    fontSize: 32, fontWeight: '800', color: PLUM, marginBottom: 24,
  },

  // Story card
  storyCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  storyCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyTag:  { fontSize: 10, fontWeight: '800', color: ROSE, letterSpacing: 1.2 },
  storyMeta: { fontSize: 11, color: MUTED, fontWeight: '600' },
  storyTitle: {
    fontSize: 22, fontWeight: '800', color: PLUM,
    lineHeight: 30, marginBottom: 10,
  },
  storyDesc: {
    fontSize: 14, color: '#546E7A', lineHeight: 22, marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: PLUM },
  statLabel: { fontSize: 11, color: MUTED, fontWeight: '600', marginTop: 2 },

  // Score tracks card
  tracksCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
  },
  tracksLabel: {
    fontSize: 10, fontWeight: '800', color: MUTED,
    letterSpacing: 1.2, marginBottom: 12,
  },
  tracksGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trackRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  trackDot:  { width: 10, height: 10, borderRadius: 5 },
  trackName: { fontSize: 14, color: PLUM, fontWeight: '600' },

  // CTA
  startBtn: {
    backgroundColor: ROSE,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  disclaimer: {
    fontSize: 11, color: MUTED, textAlign: 'center', lineHeight: 17,
  },
});
