import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SCORE_COLORS, SCORE_LABELS } from '../data/fertilityWindowScenario';

const PLUM   = '#3D0C4E';
const ROSE   = '#C2185B';
const MUTED  = '#B39DBC';
const BORDER = '#EDD5E4';

function buildEndingText(scores) {
  if (scores.fertility >= 30 && scores.career >= 25)
    return 'You built a path with strong momentum and preserved room to choose later.';
  if (scores.fertility >= 30)
    return 'You repeatedly chose clarity and option-preserving moves, even when they cost momentum.';
  if (scores.career >= 30)
    return 'Your story leaned hard into acceleration, and the later tradeoffs became more concrete.';
  return 'Your story stayed mixed and human: part planning, part timing, part tradeoff.';
}

function ScoreBar({ label, value, color }) {
  const clamped = Math.max(0, Math.min(value, 50));
  const pct = `${(clamped / 50) * 100}%`;
  return (
    <View style={ss.barRow}>
      <Text style={ss.barLabel}>{label}</Text>
      <View style={ss.barTrack}>
        <View style={[ss.barFill, { width: pct, backgroundColor: color }]} />
      </View>
      <Text style={[ss.barValue, { color }]}>
        {value >= 0 ? `+${value}` : value}
      </Text>
    </View>
  );
}

export default function StorySummary({ scenarioTitle, scores, history, onRestart, onExit }) {
  const navigation = useNavigation();

  return (
    <ScrollView
      style={ss.screen}
      contentContainerStyle={ss.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={ss.hero}>
        <Text style={ss.heroEmoji}>🎉</Text>
        <Text style={ss.heroEyebrow}>Simulation Complete</Text>
        <Text style={ss.heroTitle}>{scenarioTitle}</Text>
        <Text style={ss.heroBody}>{buildEndingText(scores)}</Text>
      </View>

      {/* Score breakdown */}
      <View style={ss.card}>
        <Text style={ss.cardLabel}>YOUR SCORES</Text>
        {Object.entries(scores).map(([key, val]) => (
          <ScoreBar
            key={key}
            label={SCORE_LABELS[key]}
            value={val}
            color={SCORE_COLORS[key]}
          />
        ))}
        <TouchableOpacity
          style={ss.careerLink}
          onPress={() => navigation.navigate('CompanyExplore')}
          activeOpacity={0.75}
        >
          <Text style={ss.careerLinkText}>
            Explore companies that support your career  →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Choice timeline */}
      <View style={ss.card}>
        <Text style={ss.cardLabel}>YOUR CHOICES</Text>
        {history.map((entry, i) => (
          <View key={entry.id} style={ss.timelineItem}>
            <View style={ss.timelineDotCol}>
              <View style={ss.timelineDot} />
              {i < history.length - 1 && <View style={ss.timelineLine} />}
            </View>
            <View style={ss.timelineContent}>
              <Text style={ss.timelineAge}>Age {entry.age} · {entry.episodeTitle}</Text>
              <Text style={ss.timelineChoice}>{entry.choiceLabel}</Text>
              <Text style={ss.timelineConseq}>{entry.consequenceSummary}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Actions */}
      <Pressable style={ss.primaryBtn} onPress={onRestart}>
        <Text style={ss.primaryBtnText}>Play Again</Text>
      </Pressable>

      {onExit && (
        <Pressable style={ss.secondaryBtn} onPress={onExit}>
          <Text style={ss.secondaryBtnText}>Exit Simulation</Text>
        </Pressable>
      )}

    </ScrollView>
  );
}

const ss = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 48 },

  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroEmoji:   { fontSize: 48, marginBottom: 12 },
  heroEyebrow: {
    fontSize: 11, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: PLUM,
    textAlign: 'center', lineHeight: 30, marginBottom: 10,
  },
  heroBody: {
    fontSize: 14, color: '#546E7A', textAlign: 'center', lineHeight: 22,
  },

  // Card
  card: {
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardLabel: {
    fontSize: 10, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 14,
  },

  // Score bars
  barRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  barLabel: { width: 88, fontSize: 13, fontWeight: '600', color: PLUM },
  barTrack: {
    flex: 1, height: 8, backgroundColor: '#F5DCE8',
    borderRadius: 4, overflow: 'hidden',
  },
  barFill:  { height: '100%', borderRadius: 4 },
  barValue: { width: 32, fontSize: 12, fontWeight: '800', textAlign: 'right' },

  careerLink: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  careerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: ROSE,
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  timelineDotCol: { alignItems: 'center', width: 16, paddingTop: 4 },
  timelineDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: ROSE,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: BORDER,
    marginTop: 4, marginBottom: 4,
  },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineAge: {
    fontSize: 10, fontWeight: '700', color: MUTED,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3,
  },
  timelineChoice: {
    fontSize: 14, fontWeight: '700', color: PLUM, lineHeight: 20,
  },
  timelineConseq: {
    fontSize: 12, color: '#546E7A', lineHeight: 18, marginTop: 3,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: ROSE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: { color: MUTED, fontSize: 15, fontWeight: '600' },
});
