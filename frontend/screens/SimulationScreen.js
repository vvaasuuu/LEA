import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Image, SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';
import simulationData from '../data/simulation.json';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  blueMid: '#0288D1', blueDeep: '#01579B', blueLight: '#E1F5FE', blueGhost: '#F0F7FF',
  tealSoft: '#E0F2F1', tealDark: '#004D40', tealMid: '#00796B',
  text: '#1A2D3E', textMid: '#4A6275', textSoft: '#90A4AE',
  white: '#FFFFFF', border: '#C8DFF0',
  amber: '#FFF8E1', amberDark: '#E65100',
  sky: '#D6EEFF', ground: '#B8D4E8', road: '#9BB8CC',
};

// ─── Metrics ──────────────────────────────────────────────────────────────────
const METRICS_CFG = [
  { key: 'career',    emoji: '💼', label: 'Career',  color: '#1E88E5' },
  { key: 'wellbeing', emoji: '🌿', label: 'Health',  color: '#43A047' },
  { key: 'clarity',   emoji: '🧭', label: 'Clarity', color: '#8E24AA' },
  { key: 'freedom',   emoji: '⏰', label: 'Freedom', color: '#FB8C00' },
];
const BASE_METRICS = { career: 50, wellbeing: 50, clarity: 50, freedom: 50 };
const METRIC_DELTAS = {
  career:          { choice_a: { career: 12, clarity: -6, freedom: -8 },      choice_b: { career: 4, clarity: 5, freedom: 6, wellbeing: 4 } },
  health:          { choice_a: { wellbeing: 12, clarity: 6 },                 choice_b: { wellbeing: -5, clarity: -5 } },
  relationships:   { choice_a: { wellbeing: 8, clarity: 4, freedom: -6 },     choice_b: { career: 5, freedom: 6, clarity: -3 } },
  family_planning: { choice_a: { wellbeing: 8, clarity: 6, freedom: -8 },     choice_b: { wellbeing: 4, career: 4, freedom: 5 } },
};
function applyDeltas(metrics, theme, key) {
  const d = METRIC_DELTAS[theme]?.[key] ?? {};
  const n = { ...metrics };
  Object.entries(d).forEach(([k, v]) => { n[k] = Math.max(0, Math.min(100, (n[k] ?? 50) + v)); });
  return { next: n, deltas: d };
}

// ─── Dog images ───────────────────────────────────────────────────────────────
const DOGS = {
  puppy: { open: require('../assets/dogs/Puppy open eyes.png'), closed: require('../assets/dogs/puppy eyes closed.png') },
  teen:  { open: require('../assets/dogs/teen1 eyes open.png'), closed: require('../assets/dogs/teen1 eyes closed.png') },
  adult: {
    open:   require('../assets/dogs/adult dog eyes open tail down.png'),
    closed: require('../assets/dogs/adult dog eyes closed tail down.png'),
    openUp: require('../assets/dogs/adult dog eyes open tail up.png'),
  },
};
function leaStage(age)          { return age <= 23 ? 'puppy' : age <= 27 ? 'teen' : 'adult'; }
function getDog(age, open, up)  {
  const s = leaStage(age);
  if (s === 'puppy') return open ? DOGS.puppy.open  : DOGS.puppy.closed;
  if (s === 'teen')  return open ? DOGS.teen.open   : DOGS.teen.closed;
  if (up)            return DOGS.adult.openUp;
  return open ? DOGS.adult.open : DOGS.adult.closed;
}
function getFPTrack(age)        { return age <= 27 ? 'track_family_planning_21_23' : age <= 31 ? 'track_family_planning_28_31' : 'track_family_planning_32_35'; }

// ─── Journey transition animation ─────────────────────────────────────────────
const SCENERY = '🌳  🏠  🌲  🏢  🌳  🏙️  🌲  🏠  🌳  🏢  🌲  🌳  🏠  🌲  🏢  🌳  🏙️';
const CLOUDS  = '☁️          ⛅          ☁️          ⛅          ☁️          ⛅';

function JourneyTransition({ fromAge, toAge, leaImage, onComplete }) {
  const scroll   = useRef(new Animated.Value(0)).current;
  const clouds   = useRef(new Animated.Value(0)).current;
  const bounce   = useRef(new Animated.Value(0)).current;
  const fadeOut  = useRef(new Animated.Value(1)).current;
  const ageFade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scenery scroll (faster)
    Animated.loop(
      Animated.timing(scroll, { toValue: -500, duration: 2400, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Clouds scroll (slower, parallax feel)
    Animated.loop(
      Animated.timing(clouds, { toValue: -300, duration: 5000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Lea bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -9, duration: 220, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 220, useNativeDriver: true }),
      ])
    ).start();
    // Age label fades in at 0.6s
    setTimeout(() => {
      Animated.timing(ageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 600);
    // Fade out + complete at 2.2s
    const t = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => onComplete());
    }, 1850);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[jt.wrap, { opacity: fadeOut }]}>

      {/* Sky + clouds */}
      <View style={jt.sky}>
        <Animated.View style={{ transform: [{ translateX: clouds }] }}>
          <Text style={jt.clouds}>{CLOUDS}</Text>
        </Animated.View>
      </View>

      {/* Scenery strip */}
      <View style={jt.sceneryClip}>
        <Animated.View style={[jt.sceneryRow, { transform: [{ translateX: scroll }] }]}>
          <Text style={jt.sceneryTxt}>{SCENERY}</Text>
        </Animated.View>
      </View>

      {/* Road */}
      <View style={jt.road}>
        {/* Moving dashes */}
        <View style={jt.dashRow}>
          <Animated.View style={[jt.dashes, { transform: [{ translateX: scroll }] }]}>
            {Array.from({ length: 28 }).map((_, i) => (
              <View key={i} style={jt.dash} />
            ))}
          </Animated.View>
        </View>

        {/* Lea walking */}
        <Animated.Image
          source={leaImage}
          style={[jt.lea, { transform: [{ translateY: bounce }] }]}
          resizeMode="contain"
        />
      </View>

      {/* Age label */}
      <View style={jt.bottom}>
        <Animated.View style={{ opacity: ageFade, alignItems: 'center' }}>
          <Text style={jt.toAgeNum}>{toAge}</Text>
          <Text style={jt.toAgeWord}>years old</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
const jt = StyleSheet.create({
  wrap:       { ...StyleSheet.absoluteFillObject, backgroundColor: C.sky, zIndex: 200, flexDirection: 'column' },
  sky:        { flex: 2, overflow: 'hidden', justifyContent: 'center', backgroundColor: '#C8E8FF' },
  clouds:     { fontSize: 32, marginLeft: 20 },
  sceneryClip:{ height: 60, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#D4EBB0' },
  sceneryRow: { flexDirection: 'row' },
  sceneryTxt: { fontSize: 30, marginLeft: 10 },
  road:       { height: 110, backgroundColor: C.road, justifyContent: 'center', alignItems: 'center' },
  dashRow:    { position: 'absolute', top: '45%', left: 0, right: 0, height: 4, overflow: 'hidden' },
  dashes:     { flexDirection: 'row' },
  dash:       { width: 28, height: 4, backgroundColor: C.white, marginRight: 18, opacity: 0.7 },
  lea:        { width: 90, height: 90 },
  bottom:     { flex: 1, backgroundColor: C.blueGhost, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  toAgeNum:   { fontSize: 56, fontWeight: '900', color: C.blueDeep, lineHeight: 60, letterSpacing: -2 },
  toAgeWord:  { fontSize: 14, color: C.textMid, fontWeight: '500', marginTop: -4 },
});

// ─── Checkpoint screen (every 2 years) ───────────────────────────────────────
function CheckpointScreen({ currentAge, metrics, decisionsMade, onContinue, onInsights }) {
  const yearsSinceStart = currentAge - 21;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.blueGhost }} contentContainerStyle={cp.wrap}>
      <View style={cp.badge}>
        <Text style={cp.badgeEmoji}>🛑</Text>
        <Text style={cp.badgeLabel}>CHECKPOINT</Text>
      </View>

      <Text style={cp.age}>{currentAge}</Text>
      <Text style={cp.title}>
        {yearsSinceStart} year{yearsSinceStart !== 1 ? 's' : ''} into your journey
      </Text>
      <Text style={cp.body}>
        Want to keep exploring, or see what the journey looks like so far?
      </Text>

      {/* Compact metrics */}
      <View style={cp.metricsRow}>
        {METRICS_CFG.map(({ key, emoji, color, label }) => {
          const val = metrics[key];
          return (
            <View key={key} style={cp.metricItem}>
              <Text style={cp.metricEmoji}>{emoji}</Text>
              <View style={cp.metricBarBg}>
                <View style={[cp.metricBar, { width: `${val}%`, backgroundColor: color }]} />
              </View>
              <Text style={[cp.metricVal, { color }]}>{val}</Text>
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={cp.primary} onPress={onContinue} activeOpacity={0.82}>
        <Text style={cp.primaryTxt}>Keep exploring →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={cp.secondary} onPress={onInsights} activeOpacity={0.82}>
        <Text style={cp.secondaryTxt}>Show my insights for now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const cp = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  badge:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  badgeEmoji: { fontSize: 18 },
  badgeLabel: { fontSize: 11, fontWeight: '800', color: C.textSoft, letterSpacing: 2 },
  age:        { fontSize: 72, fontWeight: '900', color: C.blueDeep, lineHeight: 76, letterSpacing: -3, marginBottom: 4 },
  title:      { fontSize: 18, fontWeight: '700', color: C.blueDeep, marginBottom: 12, textAlign: 'center' },
  body:       { fontSize: 15, lineHeight: 23, color: C.textMid, textAlign: 'center', marginBottom: 28 },
  metricsRow: { width: '100%', flexDirection: 'row', gap: 8, marginBottom: 32 },
  metricItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricEmoji:{ fontSize: 18 },
  metricBarBg:{ width: '100%', height: 6, backgroundColor: '#DDE9F4', borderRadius: 3, overflow: 'hidden' },
  metricBar:  { height: '100%', borderRadius: 3 },
  metricVal:  { fontSize: 11, fontWeight: '700' },
  primary:    { backgroundColor: C.blueMid, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12, shadowColor: C.blueMid, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  primaryTxt: { fontSize: 16, fontWeight: '700', color: C.white },
  secondary:  { borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  secondaryTxt:{ fontSize: 15, fontWeight: '600', color: C.blueDeep },
});

// ─── Mid-journey insights ──────────────────────────────────────────────────────
function generateInsights(decisionsMade, metrics, age) {
  const counts = {};
  decisionsMade.forEach(d => { counts[d.theme] = (counts[d.theme] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const insights = [];

  const TOP_MSG = {
    career:          "You've been leaning into career choices. That focus shows — and it's worth knowing what you're trading for it.",
    health:          "You've been paying attention to your health. That kind of awareness tends to compound quietly over time.",
    relationships:   "Relationships have come up a lot. How you show up for others shapes how you experience everything else.",
    family_planning: "You've been thinking about your future. There's no right timeline — just yours.",
  };
  if (sorted[0]) insights.push(TOP_MSG[sorted[0][0]] ?? '');

  if (metrics.freedom < 38)   insights.push("Your freedom is lower than your other areas. It might be worth protecting some personal time going forward.");
  if (metrics.wellbeing < 38) insights.push("Your wellbeing could use some attention. Even small habits make a difference.");
  if (metrics.career > 68 && metrics.freedom < 42) insights.push("Strong career, tighter freedom — a classic trade-off. Worth being intentional about.");
  if (age >= 27 && !counts.health) insights.push("You haven't focused on health yet. At " + age + ", it's a good time to start paying attention.");

  return insights.filter(Boolean).slice(0, 3);
}

function MidInsightsScreen({ currentAge, metrics, decisionsMade, onContinue, onReset }) {
  const insights = generateInsights(decisionsMade, metrics, currentAge);
  const [expanded, setExpanded] = useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.blueGhost }} contentContainerStyle={mi.wrap}>
      <Image source={DOGS.adult.open} style={mi.lea} resizeMode="contain" />
      <Text style={mi.eyebrow}>YOUR JOURNEY SO FAR</Text>
      <Text style={mi.title}>Age {currentAge} snapshot</Text>
      <Text style={mi.sub}>You chose to pause here. Here's what your path looks like.</Text>

      {/* Metrics */}
      <View style={mi.metricsCard}>
        <Text style={mi.metricsHeading}>WHERE YOU ARE</Text>
        {METRICS_CFG.map(({ key, emoji, label, color }) => (
          <View key={key} style={mi.metricRow}>
            <Text style={mi.metricEmoji}>{emoji}</Text>
            <Text style={mi.metricLabel}>{label}</Text>
            <View style={mi.barBg}>
              <View style={[mi.barFill, { width: `${metrics[key]}%`, backgroundColor: color }]} />
            </View>
            <Text style={[mi.metricVal, { color }]}>{metrics[key]}</Text>
          </View>
        ))}
      </View>

      {/* Insights */}
      {insights.length > 0 && (
        <View style={mi.insightsCard}>
          <Text style={mi.insightsHeading}>WHAT WE NOTICE</Text>
          {insights.map((txt, i) => (
            <View key={i} style={[mi.insightRow, i === insights.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={mi.insightDot}>💡</Text>
              <Text style={mi.insightTxt}>{txt}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Journey log - collapsible */}
      {decisionsMade.length > 0 && (
        <View style={mi.section}>
          <TouchableOpacity style={mi.dropRow} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
            <Text style={mi.dropLabel}>YOUR CHOICES SO FAR</Text>
            <Text style={mi.dropArrow}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expanded && decisionsMade.map((d, i) => (
            <View key={i} style={mi.journeyRow}>
              <Text style={mi.journeyAge}>Age {d.age} · {d.theme}</Text>
              <Text style={mi.journeyTxt}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={mi.primary} onPress={onContinue} activeOpacity={0.82}>
        <Text style={mi.primaryTxt}>Continue from age {currentAge} →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={mi.secondary} onPress={onReset} activeOpacity={0.82}>
        <Text style={mi.secondaryTxt}>↺  Start a new path</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const mi = StyleSheet.create({
  wrap:           { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  lea:            { width: 110, height: 110, marginTop: 28, marginBottom: 12 },
  eyebrow:        { fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 1.5, marginBottom: 6 },
  title:          { fontSize: 26, fontWeight: '900', color: C.blueDeep, textAlign: 'center', marginBottom: 8 },
  sub:            { fontSize: 15, lineHeight: 23, color: C.textMid, textAlign: 'center', marginBottom: 24 },
  metricsCard:    { width: '100%', backgroundColor: C.white, borderRadius: 18, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  metricsHeading: { fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 1.2, marginBottom: 14 },
  metricRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  metricEmoji:    { fontSize: 16, width: 22 },
  metricLabel:    { fontSize: 13, fontWeight: '600', color: C.text, width: 60 },
  barBg:          { flex: 1, height: 7, backgroundColor: '#E0EBF5', borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 4 },
  metricVal:      { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  insightsCard:   { width: '100%', backgroundColor: C.white, borderRadius: 18, padding: 20, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: C.blueMid },
  insightsHeading:{ fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 1.2, marginBottom: 12 },
  insightRow:     { flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F5FA' },
  insightDot:     { fontSize: 14, marginTop: 1 },
  insightTxt:     { flex: 1, fontSize: 14, lineHeight: 21, color: C.text },
  section:        { width: '100%', marginBottom: 20 },
  dropRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dropLabel:      { fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 1 },
  dropArrow:      { fontSize: 12, color: C.textSoft },
  journeyRow:     { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  journeyAge:     { fontSize: 11, fontWeight: '700', color: C.blueMid, textTransform: 'capitalize', marginBottom: 4 },
  journeyTxt:     { fontSize: 14, lineHeight: 21, color: C.text },
  primary:        { backgroundColor: C.blueMid, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12, shadowColor: C.blueMid, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  primaryTxt:     { fontSize: 16, fontWeight: '700', color: C.white },
  secondary:      { borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  secondaryTxt:   { fontSize: 15, fontWeight: '600', color: C.blueDeep },
});

// ─── Shared small components ──────────────────────────────────────────────────
function Timeline({ startAge, currentAge }) {
  const STOPS = [21, 25, 28, 32, 35].filter(a => a >= startAge);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {STOPS.map((age, i) => {
        const past = age < currentAge, active = age === currentAge;
        return (
          <React.Fragment key={age}>
            {i > 0 && <View style={[tls.line, past && tls.lineDone]} />}
            <View style={[tls.dot, past && tls.dotDone, active && tls.dotActive]}>
              {active && <View style={tls.core} />}
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}
const tls = StyleSheet.create({
  line:    { flex: 1, height: 2, backgroundColor: C.border, marginHorizontal: 2 },
  lineDone:{ backgroundColor: C.blueMid },
  dot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D0E8F8', borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.blueMid, borderColor: C.blueMid },
  dotActive:{ width: 16, height: 16, borderRadius: 8, backgroundColor: C.white, borderColor: C.blueMid, borderWidth: 2.5 },
  core:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.blueMid },
});

function MetricsStrip({ metrics }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingTop: 8 }}>
      {METRICS_CFG.map(({ key, emoji, color }) => {
        const val = metrics[key];
        return (
          <View key={key} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
            <Text style={{ fontSize: 14 }}>{emoji}</Text>
            <View style={{ width: '100%', height: 4, backgroundColor: '#DDE9F4', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${val}%`, backgroundColor: color, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color: val >= 65 ? color : val <= 38 ? C.amberDark : C.textSoft }}>{val}</Text>
          </View>
        );
      })}
    </View>
  );
}

function ChoiceCard({ label, theme, choiceKey, onPress }) {
  const deltas = METRIC_DELTAS[theme]?.[choiceKey] ?? {};
  const hints  = Object.entries(deltas).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
  const MAP    = { career: '💼', wellbeing: '🌿', clarity: '🧭', freedom: '⏰' };
  return (
    <TouchableOpacity style={ch.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={ch.label}>{label}</Text>
      {hints.length > 0 && (
        <View style={ch.hints}>
          {hints.map(([k, v]) => (
            <View key={k} style={[ch.hint, v > 0 ? ch.hintUp : ch.hintDown]}>
              <Text style={[ch.hintTxt, v > 0 ? ch.hintUp2 : ch.hintDown2]}>{MAP[k]} {v > 0 ? '↑' : '↓'}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  card:     { backgroundColor: C.white, borderRadius: 16, borderWidth: 1.5, borderColor: C.border, paddingVertical: 16, paddingHorizontal: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:    { fontSize: 15, lineHeight: 22, color: C.blueDeep, fontWeight: '600', marginBottom: 10 },
  hints:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  hint:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  hintTxt:  { fontSize: 11, fontWeight: '700' },
  hintUp:   { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  hintDown: { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' },
  hintUp2:  { color: '#2E7D32' },
  hintDown2:{ color: '#E65100' },
});

function DeltaPills({ deltas }) {
  if (!deltas || !Object.keys(deltas).length) return null;
  const MAP = { career: '💼', wellbeing: '🌿', clarity: '🧭', freedom: '⏰' };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
      {Object.entries(deltas).map(([k, v]) => (
        <View key={k} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1, ...(v > 0 ? { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' } : { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' }) }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: v > 0 ? '#2E7D32' : '#C62828' }}>
            {MAP[k]} {v > 0 ? `+${v}` : v}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HealthInsight({ data }) {
  if (!data) return null;
  return (
    <View style={s.insightCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Text style={{ fontSize: 14 }}>💡</Text>
        <Text style={{ fontSize: 11, fontWeight: '700', color: C.blueMid, textTransform: 'uppercase', letterSpacing: 0.5 }}>Health insight</Text>
      </View>
      <Text style={s.insightHeadline}>{data.headline}</Text>
      <Text style={s.insightBody}>{data.body}</Text>
      {data.action && (
        <View style={s.insightBox}>
          <Text style={s.insightBoxLabel}>YOU COULD</Text>
          <Text style={s.insightBoxTxt}>{data.action}</Text>
        </View>
      )}
    </View>
  );
}

function FamilyPopup({ visible, currentAge, fpPref, onPlanning, onChildFree, onClose }) {
  const fpTrack = simulationData.tracks[getFPTrack(currentAge)];
  const cfTrack = simulationData.tracks['track_child_free'];
  if (!fpPref) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={s.popOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
          <View style={s.popCard}>
            <Text style={s.popEmoji}>👪</Text>
            <Text style={s.popTitle}>Explore family planning?</Text>
            <Text style={s.popBody}>This helps personalise the next part of your journey. You can change this any time.</Text>
            <TouchableOpacity style={s.popPrimary} onPress={onPlanning} activeOpacity={0.82}><Text style={s.popPrimaryTxt}>Yes, it's part of my thinking</Text></TouchableOpacity>
            <TouchableOpacity style={[s.popPrimary, { backgroundColor: C.tealSoft, marginTop: 10 }]} onPress={onChildFree} activeOpacity={0.82}><Text style={[s.popPrimaryTxt, { color: C.tealDark }]}>Not planning to have children</Text></TouchableOpacity>
            <TouchableOpacity style={s.popSecondary} onPress={onClose} activeOpacity={0.82}><Text style={s.popSecondaryTxt}>Ask me later</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  const isChildFree = fpPref === 'child_free';
  const td  = isChildFree ? cfTrack : fpTrack;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.popOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={s.popCard}>
          <Text style={s.popEmoji}>{isChildFree ? '🌿' : '👨‍👩‍👧'}</Text>
          <Text style={s.popTitle}>{isChildFree ? 'Your health, your terms' : 'Family planning'}</Text>
          <Text style={s.popBody}>{td?.framing ?? 'Explore what this looks like for you at this stage.'}</Text>
          <TouchableOpacity style={s.popPrimary} onPress={isChildFree ? onChildFree : onPlanning} activeOpacity={0.82}><Text style={s.popPrimaryTxt}>Explore this</Text></TouchableOpacity>
          <TouchableOpacity style={s.popSecondary} onPress={onClose} activeOpacity={0.82}><Text style={s.popSecondaryTxt}>Not right now</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function RelInfoPopup({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.popOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={s.popCard}>
          <Text style={s.popEmoji}>💕</Text>
          <Text style={s.popTitle}>Relationship scenarios</Text>
          <Text style={s.popBody}>When this is on, LEA includes moments about partnerships and life planning with a partner. Turn it off to focus on career and health only.</Text>
          <TouchableOpacity style={s.popPrimary} onPress={onClose} activeOpacity={0.82}><Text style={s.popPrimaryTxt}>Got it</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EndScreen({ decisionsMade, metrics, onWeeklyFocus, onReset }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.blueGhost }} contentContainerStyle={s.endWrap}>
      <Image source={DOGS.adult.openUp} style={s.endLea} resizeMode="contain" />
      <Text style={s.endTitle}>One possible version of your path</Text>
      <Text style={s.endSub}>Every choice shapes something. None of them are wrong — just different trade-offs.</Text>
      <View style={s.endMetricsCard}>
        <Text style={s.endMH}>WHERE YOU ENDED UP</Text>
        {METRICS_CFG.map(({ key, emoji, label, color }) => (
          <View key={key} style={s.endMetricRow}>
            <Text style={{ fontSize: 16, width: 22 }}>{emoji}</Text>
            <Text style={s.endMetricLabel}>{label}</Text>
            <View style={s.endBarBg}><View style={[s.endBarFill, { width: `${metrics[key]}%`, backgroundColor: color }]} /></View>
            <Text style={[s.endMetricVal, { color }]}>{metrics[key]}</Text>
          </View>
        ))}
      </View>
      {decisionsMade.length > 0 && (
        <View style={{ width: '100%', marginBottom: 20 }}>
          <TouchableOpacity style={s.endDropRow} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
            <Text style={s.endDropLabel}>YOUR JOURNEY</Text>
            <Text style={{ fontSize: 12, color: C.textSoft }}>{expanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {expanded && decisionsMade.map((d, i) => (
            <View key={i} style={s.endRow}>
              <Text style={s.endRowAge}>Age {d.age} · {d.theme}</Text>
              <Text style={s.endRowTxt}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={s.endPrimary} onPress={onWeeklyFocus} activeOpacity={0.82}><Text style={s.endPrimaryTxt}>Set my weekly focus →</Text></TouchableOpacity>
      <TouchableOpacity style={s.endSecondary} onPress={onReset} activeOpacity={0.82}><Text style={s.endSecondaryTxt}>↺  Try a different path</Text></TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SimulationScreen({ navigation }) {
  const [startAge,      setStartAge]      = useState(21);
  const [userConds,     setUserConds]     = useState([]);
  const [relEnabled,    setRelEnabled]    = useState(true);
  const [currentAge,    setCurrentAge]    = useState(21);
  const [currentNode,   setCurrentNode]   = useState(null);
  const [decIdx,        setDecIdx]        = useState(0);
  const [showResult,    setShowResult]    = useState(false);
  const [resultData,    setResultData]    = useState(null);
  const [currentTrack,  setCurrentTrack]  = useState(null);
  const [trackIdx,      setTrackIdx]      = useState(0);
  const [simDone,       setSimDone]       = useState(false);
  const [decisions,     setDecisions]     = useState([]);
  const [headlines,     setHeadlines]     = useState([]);
  const [history,       setHistory]       = useState([]);
  const [showFamPopup,  setShowFamPopup]  = useState(false);
  const [fpBadge,       setFpBadge]       = useState(false);
  const [fpNudge,       setFpNudge]       = useState(false);
  const [fpPref,        setFpPref]        = useState(null);
  const [showRelInfo,   setShowRelInfo]   = useState(false);
  const relInfoShown = useRef(false);
  const [showStarter,   setShowStarter]   = useState(true);
  const [leaOpen,       setLeaOpen]       = useState(true);
  const [leaTail,       setLeaTail]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [metrics,       setMetrics]       = useState({ ...BASE_METRICS });

  // ── New: transition + checkpoint state ──
  const [showTransition,  setShowTransition]  = useState(false);
  const [transToAge,      setTransToAge]      = useState(null);
  const [transNode,       setTransNode]       = useState(null);
  const [showCheckpoint,  setShowCheckpoint]  = useState(false);
  const [showMidInsights, setShowMidInsights] = useState(false);

  // ─── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const rawAge  = (await Storage.get('user_age')) ?? 21;
      const rawCond = (await Storage.get('user_conditions')) ?? [];
      const relStr  = await Storage.get('relationship_content_enabled');
      const fpSeen  = await Storage.get('fp_badge_seen');
      const savedFp = await Storage.get('fp_preference');
      const age     = typeof rawAge === 'number' ? rawAge : parseInt(rawAge, 10) || 21;
      setStartAge(age); setCurrentAge(age);
      setUserConds(Array.isArray(rawCond) ? rawCond : []);
      setRelEnabled(relStr === null ? true : relStr === true || relStr === 'true');
      if (savedFp) setFpPref(savedFp);
      if (!fpSeen) setFpBadge(true);
      setCurrentNode(findNode(age, simulationData.ages));
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (currentAge === 25 && fpBadge && !loading) {
      setFpNudge(true);
      const t = setTimeout(() => setFpNudge(false), 5000);
      return () => clearTimeout(t);
    }
  }, [currentAge, fpBadge, loading]);

  useEffect(() => {
    if (!loading) Storage.set(Storage.KEYS.LEA_STAGE, leaStage(currentAge));
  }, [currentAge, loading]);

  useEffect(() => {
    if (!currentNode || loading || currentTrack || showResult || simDone || showTransition || showCheckpoint || showMidInsights) return;
    const vis = currentNode.decisions.filter(d => !(d.hidden_if_relationship_disabled && !relEnabled));
    if (vis.length === 0) advanceAge(currentAge);
  }, [currentNode, relEnabled, loading, currentTrack, showResult, simDone, showTransition, showCheckpoint, showMidInsights]);

  useEffect(() => {
    if (!currentTrack || loading || showResult) return;
    const track = simulationData.tracks[currentTrack];
    if (!track?.stages || trackIdx >= track.stages.length) handleTrackDone();
  }, [currentTrack, trackIdx, loading, showResult]);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  function findNode(age, obj) {
    if (obj[`age_${age}`]) return obj[`age_${age}`];
    for (let a = age + 1; a <= 36; a++) if (obj[`age_${a}`]) return obj[`age_${a}`];
    return null;
  }
  function visDecs(node, rel) {
    if (!node) return [];
    return node.decisions.filter(d => !(d.hidden_if_relationship_disabled && !rel));
  }
  async function pickSidebar(obj) {
    if (!obj) return null;
    const rawIdx = (await Storage.get('simulation_condition_index')) ?? 0;
    const idx    = typeof rawIdx === 'number' ? rawIdx : parseInt(rawIdx, 10) || 0;
    const chosen = userConds.length > 0 ? (obj[userConds[idx % userConds.length]] ?? obj.default ?? null) : (obj.default ?? null);
    await Storage.set('simulation_condition_index', idx + 1);
    return chosen;
  }
  function celebrate(cb) {
    setLeaOpen(false); setLeaTail(true);
    setTimeout(() => { setLeaOpen(true); cb?.(); }, 900);
  }

  // Modified advanceAge — triggers journey transition first
  function advanceAge(from) {
    const next = from + 1;
    if (next > 35) { finish(); return; }
    const node = findNode(next, simulationData.ages);
    if (!node)  { finish(); return; }
    setTransToAge(next);
    setTransNode(node);
    setShowTransition(true);
  }

  // Called when journey animation finishes
  function handleTransitionDone() {
    setShowTransition(false);
    setCurrentAge(transToAge);
    setCurrentNode(transNode);
    setDecIdx(0);
    setCurrentTrack(null);
    setTrackIdx(0);
    setLeaOpen(true);
    setLeaTail(false);
    // Checkpoint every 2 years (ages 23, 25, 27, 29, 31, 33)
    if (transToAge > startAge && (transToAge - startAge) % 2 === 0 && transToAge < 35) {
      setShowCheckpoint(true);
    }
  }

  async function finish() {
    await Points.add(POINTS.SIMULATION_COMPLETE);
    await Storage.set('simulation_history', decisions.map(({ age, theme, choice }) => ({ age, theme, choice })));
    setSimDone(true);
  }

  function handleTrackDone() {
    setCurrentTrack(null); setTrackIdx(0);
    setLeaOpen(true); setLeaTail(false);
    if (currentNode) {
      const vis = visDecs(currentNode, relEnabled);
      if (decIdx >= vis.length) advanceAge(currentAge);
    }
  }

  // ─── Choices ───────────────────────────────────────────────────────────────
  const handleChoice = useCallback(async (decision, choiceKey) => {
    const chosen = decision[choiceKey];
    setHistory(prev => [...prev, { age: currentAge, node: currentNode, decIdx, decisions: [...decisions], headlines: [...headlines], track: currentTrack, trackIdx, metrics: { ...metrics } }]);
    const updated = [...decisions, { age: currentAge, theme: decision.theme, choice: chosen.label, consequence: chosen.consequence }];
    setDecisions(updated);
    await Storage.set('simulation_history', updated.map(({ age, theme, choice }) => ({ age, theme, choice })));
    const { next, deltas } = applyDeltas(metrics, decision.theme, choiceKey);
    setMetrics(next);
    celebrate(async () => {
      const healthData = decision.theme === 'health' ? await pickSidebar(currentNode?.health_sidebar) : null;
      setResultData({ chosenLabel: chosen.label, consequence: chosen.consequence, healthData, isTrack: false, deltas });
      setShowResult(true);
    });
  }, [currentAge, currentNode, decIdx, decisions, headlines, currentTrack, trackIdx, metrics]);

  const handleTrackChoice = useCallback(async (stage, choiceKey) => {
    const chosen = stage.career_moment[choiceKey];
    setHistory(prev => [...prev, { age: currentAge, node: currentNode, decIdx, decisions: [...decisions], headlines: [...headlines], track: currentTrack, trackIdx, metrics: { ...metrics } }]);
    setDecisions(prev => [...prev, { age: currentAge, theme: 'family_planning', choice: chosen.label, consequence: chosen.consequence }]);
    const { next, deltas } = applyDeltas(metrics, 'family_planning', choiceKey);
    setMetrics(next);
    celebrate(async () => {
      const healthData = await pickSidebar(stage.health_sidebar);
      setResultData({ chosenLabel: chosen.label, consequence: chosen.consequence, healthData, isTrack: true, deltas });
      setShowResult(true);
    });
  }, [currentAge, currentNode, decIdx, decisions, headlines, currentTrack, trackIdx, metrics]);

  const handleContinue = useCallback(async () => {
    await Points.add(POINTS.CONDITION_CARD_READ);
    const hl = resultData?.healthData?.headline;
    if (hl) setHeadlines(prev => prev.includes(hl) ? prev : [...prev, hl]);
    setShowResult(false); setResultData(null); setLeaTail(false);
    if (resultData?.isTrack) {
      const track = simulationData.tracks[currentTrack];
      const next  = trackIdx + 1;
      if (track && next < track.stages.length) setTrackIdx(next);
      else handleTrackDone();
      return;
    }
    const vis  = visDecs(currentNode, relEnabled);
    const next = decIdx + 1;
    if (next < vis.length) setDecIdx(next);
    else advanceAge(currentAge);
  }, [resultData, currentTrack, trackIdx, currentNode, decIdx, relEnabled, currentAge]);

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const snap = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentAge(snap.age); setCurrentNode(snap.node); setDecIdx(snap.decIdx);
    setDecisions(snap.decisions); setHeadlines(snap.headlines);
    setCurrentTrack(snap.track); setTrackIdx(snap.trackIdx);
    setMetrics(snap.metrics ?? { ...BASE_METRICS });
    setShowResult(false); setResultData(null);
    setShowCheckpoint(false); setShowMidInsights(false);
    setLeaOpen(true); setLeaTail(false);
  }, [history]);

  const handleRelToggle = useCallback(() => {
    if (!relInfoShown.current) { relInfoShown.current = true; setShowRelInfo(true); return; }
    const next = !relEnabled;
    setRelEnabled(next);
    Storage.set('relationship_content_enabled', next ? 'true' : 'false');
  }, [relEnabled]);

  const handleRelInfoClose = useCallback(() => {
    setShowRelInfo(false);
    const next = !relEnabled;
    setRelEnabled(next);
    Storage.set('relationship_content_enabled', next ? 'true' : 'false');
  }, [relEnabled]);

  const handleFamPress = useCallback(() => {
    if (fpBadge) { setFpBadge(false); setFpNudge(false); Storage.set('fp_badge_seen', true); }
    setShowFamPopup(true);
  }, [fpBadge]);

  const handlePlanning = useCallback(() => {
    setShowFamPopup(false);
    if (fpPref !== 'planning') { setFpPref('planning'); Storage.set('fp_preference', 'planning'); }
    const id = getFPTrack(currentAge);
    if (simulationData.tracks[id]) { setCurrentTrack(id); setTrackIdx(0); setShowResult(false); setResultData(null); }
  }, [currentAge, fpPref]);

  const handleChildFree = useCallback(() => {
    setShowFamPopup(false);
    if (fpPref !== 'child_free') { setFpPref('child_free'); Storage.set('fp_preference', 'child_free'); }
    if (simulationData.tracks['track_child_free']) { setCurrentTrack('track_child_free'); setTrackIdx(0); setShowResult(false); setResultData(null); }
  }, [fpPref]);

  const handleReset = useCallback(async () => {
    await Storage.remove('simulation_history');
    await Storage.set('simulation_condition_index', 0);
    const rawAge = (await Storage.get('user_age')) ?? 21;
    const age    = typeof rawAge === 'number' ? rawAge : parseInt(rawAge, 10) || 21;
    setCurrentAge(age); setCurrentNode(findNode(age, simulationData.ages));
    setDecIdx(0); setShowResult(false); setResultData(null);
    setCurrentTrack(null); setTrackIdx(0); setSimDone(false);
    setDecisions([]); setHeadlines([]); setHistory([]);
    setMetrics({ ...BASE_METRICS });
    setShowTransition(false); setShowCheckpoint(false); setShowMidInsights(false);
    setLeaOpen(true); setLeaTail(false); setShowStarter(true);
  }, []);

  const goWeekly = useCallback(() => navigation.navigate('Home'), [navigation]);

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (loading) return <SafeAreaView style={s.loadWrap}><Text style={s.loadTxt}>Loading your journey…</Text></SafeAreaView>;

  // ─── Journey transition overlay ────────────────────────────────────────────
  if (showTransition) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" />
        <JourneyTransition
          fromAge={currentAge}
          toAge={transToAge}
          leaImage={getDog(transToAge, true, false)}
          onComplete={handleTransitionDone}
        />
      </SafeAreaView>
    );
  }

  // ─── Checkpoint ────────────────────────────────────────────────────────────
  if (showCheckpoint) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <CheckpointScreen
          currentAge={currentAge}
          metrics={metrics}
          decisionsMade={decisions}
          onContinue={() => setShowCheckpoint(false)}
          onInsights={() => { setShowCheckpoint(false); setShowMidInsights(true); }}
        />
      </SafeAreaView>
    );
  }

  // ─── Mid-journey insights ──────────────────────────────────────────────────
  if (showMidInsights) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <MidInsightsScreen
          currentAge={currentAge}
          metrics={metrics}
          decisionsMade={decisions}
          onContinue={() => setShowMidInsights(false)}
          onReset={handleReset}
        />
      </SafeAreaView>
    );
  }

  // ─── Starter ───────────────────────────────────────────────────────────────
  if (showStarter) {
    return (
      <SafeAreaView style={s.starterRoot}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <ScrollView contentContainerStyle={s.starterScroll} showsVerticalScrollIndicator={false}>
          <Image source={DOGS.puppy.open} style={s.starterLea} resizeMode="contain" />
          <Text style={s.starterEyebrow}>SIMULATION</Text>
          <Text style={s.starterTitle}>Explore your future</Text>
          <Text style={s.starterBody}>We'll guide you through small moments — not big decisions.</Text>
          <Text style={s.starterHint}>Each step takes seconds. Every path is valid. You can undo any choice.</Text>
          <View style={s.starterStops}>
            {[21, 25, 28, 32, 35].map((age, i) => (
              <React.Fragment key={age}>
                {i > 0 && <View style={s.starterLine} />}
                <View style={s.starterStop}><Text style={s.starterStopAge}>{age}</Text></View>
              </React.Fragment>
            ))}
          </View>
          <View style={s.starterLegend}>
            {METRICS_CFG.map(({ emoji, label, color }) => (
              <View key={label} style={{ alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
              </View>
            ))}
          </View>
          <Text style={s.starterLegendHint}>These update as you explore</Text>
          <TouchableOpacity style={s.starterBtn} onPress={() => setShowStarter(false)} activeOpacity={0.82}>
            <Text style={s.starterBtnTxt}>Begin exploring →</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (simDone) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <EndScreen decisionsMade={decisions} metrics={metrics} onWeeklyFocus={goWeekly} onReset={handleReset} />
      </SafeAreaView>
    );
  }

  if (!currentNode) return <SafeAreaView style={s.loadWrap}><Text style={s.loadTxt}>Almost there…</Text></SafeAreaView>;

  // ─── Derived ───────────────────────────────────────────────────────────────
  const isInTrack  = !!currentTrack;
  const track      = isInTrack ? simulationData.tracks[currentTrack] : null;
  const trackStage = (isInTrack && track?.stages && trackIdx < track.stages.length) ? track.stages[trackIdx] : null;
  const vis        = visDecs(currentNode, relEnabled);
  const decision   = vis[Math.min(decIdx, Math.max(0, vis.length - 1))];

  const THEME_CTX  = { career: 'A career moment', health: 'A health moment', relationships: 'A relationship moment', family_planning: 'Thinking about the future' };

  const Header = (
    <View style={s.header}>
      <View style={s.headerRow}>
        <Timeline startAge={startAge} currentAge={currentAge} />
        <View style={s.headerBtns}>
          <TouchableOpacity style={[s.iconBtn, relEnabled && s.iconBtnRel]} onPress={handleRelToggle} activeOpacity={0.8}><Text>💕</Text></TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, currentTrack && s.iconBtnFam]} onPress={handleFamPress} activeOpacity={0.8}>
            <Text>👪</Text>
            {fpBadge && <View style={s.badgeDot} />}
          </TouchableOpacity>
        </View>
      </View>
      <MetricsStrip metrics={metrics} />
    </View>
  );

  const Nudge = fpNudge ? (
    <TouchableOpacity style={s.nudge} onPress={() => { setFpNudge(false); handleFamPress(); }} activeOpacity={0.9}>
      <Text style={s.nudgeTxt}>👪 Tap the family button above to explore family planning whenever you're ready</Text>
    </TouchableOpacity>
  ) : null;

  const Footer = history.length > 0 ? (
    <View style={s.footer}>
      <TouchableOpacity style={s.undoBtn} onPress={handleUndo} activeOpacity={0.8}>
        <Text style={s.undoBtnTxt}>← Undo last choice</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const Popups = (
    <>
      <FamilyPopup visible={showFamPopup} currentAge={currentAge} fpPref={fpPref} onPlanning={handlePlanning} onChildFree={handleChildFree} onClose={() => setShowFamPopup(false)} />
      <RelInfoPopup visible={showRelInfo} onClose={handleRelInfoClose} />
    </>
  );

  // ─── Track ─────────────────────────────────────────────────────────────────
  if (isInTrack && trackStage && !showResult) {
    const moment = trackStage.career_moment;
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        {Header}{Nudge}
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.trackTag}><Text style={s.trackTagTxt}>👨‍👩‍👧  {track.title}</Text></View>
          <View style={s.ageBlock}><Text style={s.ageBig}>{currentAge}</Text><Text style={s.ageWord}>years old</Text></View>
          <View style={s.storyCard}>
            <Text style={s.storyContext}>A family planning moment</Text>
            <Text style={s.storyTxt}>{moment.narrative}</Text>
          </View>
          <Text style={s.chooseLbl}>What do you do?</Text>
          <View style={s.choicesCol}>
            <ChoiceCard label={moment.choice_a.label} theme="family_planning" choiceKey="choice_a" onPress={() => handleTrackChoice(trackStage, 'choice_a')} />
            <ChoiceCard label={moment.choice_b.label} theme="family_planning" choiceKey="choice_b" onPress={() => handleTrackChoice(trackStage, 'choice_b')} />
          </View>
        </ScrollView>
        {Footer}{Popups}
      </SafeAreaView>
    );
  }

  // ─── Result ────────────────────────────────────────────────────────────────
  if (showResult && resultData) {
    return (
      <SafeAreaView style={s.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        {Header}{Nudge}
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {resultData.isTrack && track && <View style={s.trackTag}><Text style={s.trackTagTxt}>👨‍👩‍👧  {track.title}</Text></View>}
          <View style={s.ageBlock}><Text style={s.ageBig}>{currentAge}</Text><Text style={s.ageWord}>years old</Text></View>
          <View style={s.resultCard}>
            <View style={s.resultRow}><View style={s.resultDot} /><Text style={s.resultLabel}>{resultData.chosenLabel}</Text></View>
            <View style={s.resultDivider} />
            <Text style={s.resultConsequence}>{resultData.consequence}</Text>
            <DeltaPills deltas={resultData.deltas} />
          </View>
          <HealthInsight data={resultData.healthData} />
          <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.82}>
            <Text style={s.continueBtnTxt}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
        {Footer}{Popups}
      </SafeAreaView>
    );
  }

  // ─── Main moment ───────────────────────────────────────────────────────────
  if (!decision) return null;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
      {Header}{Nudge}
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.ageBlock}><Text style={s.ageBig}>{currentAge}</Text><Text style={s.ageWord}>years old</Text></View>
        <View style={s.storyCard}>
          <Text style={s.storyContext}>{THEME_CTX[decision.theme] ?? ''}</Text>
          <Text style={s.storyTxt}>{decision.narrative}</Text>
        </View>
        <Text style={s.chooseLbl}>What do you do?</Text>
        <View style={s.choicesCol}>
          <ChoiceCard label={decision.choice_a.label} theme={decision.theme} choiceKey="choice_a" onPress={() => handleChoice(decision, 'choice_a')} />
          <ChoiceCard label={decision.choice_b.label} theme={decision.theme} choiceKey="choice_b" onPress={() => handleChoice(decision, 'choice_b')} />
        </View>
      </ScrollView>
      {Footer}{Popups}
    </SafeAreaView>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.blueGhost },
  loadWrap: { flex: 1, backgroundColor: C.blueGhost, alignItems: 'center', justifyContent: 'center' },
  loadTxt:  { fontSize: 16, color: C.textMid, fontWeight: '500' },

  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: C.blueGhost, borderBottomWidth: 1, borderBottomColor: '#DDE9F4' },
  headerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerBtns: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  iconBtnRel: { backgroundColor: '#FFF0F5', borderColor: '#F48FB1' },
  iconBtnFam: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  badgeDot:   { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: '#F06292', borderWidth: 1.5, borderColor: C.white },

  nudge:    { marginHorizontal: 16, marginBottom: 6, backgroundColor: C.amber, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  nudgeTxt: { fontSize: 13, color: C.amberDark, fontWeight: '500', lineHeight: 19 },

  scroll:    { flex: 1 },
  content:   { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12 },

  ageBlock:  { alignItems: 'flex-start', marginBottom: 16 },
  ageBig:    { fontSize: 52, fontWeight: '900', color: C.blueDeep, lineHeight: 58, letterSpacing: -1 },
  ageWord:   { fontSize: 14, fontWeight: '500', color: C.textSoft, marginTop: -4 },

  storyCard:    { backgroundColor: C.white, borderRadius: 20, padding: 22, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  storyContext: { fontSize: 11, fontWeight: '700', color: C.blueMid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  storyTxt:     { fontSize: 16, lineHeight: 26, color: C.text },

  chooseLbl:  { fontSize: 13, fontWeight: '700', color: C.textSoft, letterSpacing: 0.5, marginBottom: 10 },
  choicesCol: { gap: 10, marginBottom: 16 },

  resultCard:      { backgroundColor: C.blueLight, borderRadius: 20, padding: 20, marginBottom: 14 },
  resultRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  resultDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: C.blueMid, marginTop: 7, flexShrink: 0 },
  resultLabel:     { fontSize: 14, fontWeight: '700', color: C.blueDeep, flex: 1, lineHeight: 22 },
  resultDivider:   { height: 1, backgroundColor: C.border, marginBottom: 12 },
  resultConsequence:{ fontSize: 15, lineHeight: 24, color: C.text },

  continueBtn:    { backgroundColor: C.blueMid, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 8, shadowColor: C.blueMid, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
  continueBtnTxt: { fontSize: 16, fontWeight: '700', color: C.white },

  insightCard:    { backgroundColor: C.white, borderRadius: 18, padding: 20, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: C.blueMid, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  insightHeadline:{ fontSize: 16, fontWeight: '700', color: C.blueDeep, lineHeight: 24, marginBottom: 8 },
  insightBody:    { fontSize: 14, lineHeight: 22, color: C.text, marginBottom: 12 },
  insightBox:     { backgroundColor: C.tealSoft, borderRadius: 12, padding: 14 },
  insightBoxLabel:{ fontSize: 10, fontWeight: '700', color: C.tealMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  insightBoxTxt:  { fontSize: 13, lineHeight: 20, color: C.tealDark },

  trackTag:    { backgroundColor: '#EAF4FF', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12, alignSelf: 'flex-start' },
  trackTagTxt: { fontSize: 13, fontWeight: '700', color: C.blueDeep },

  footer:     { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#DDE9F4', backgroundColor: C.blueGhost },
  undoBtn:    { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  undoBtnTxt: { fontSize: 14, fontWeight: '600', color: C.textMid },

  popOverlay:   { flex: 1, backgroundColor: 'rgba(1,87,155,0.18)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  popCard:      { backgroundColor: C.white, borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 5 },
  popEmoji:     { fontSize: 36, marginBottom: 12 },
  popTitle:     { fontSize: 18, fontWeight: '700', color: C.blueDeep, marginBottom: 12, textAlign: 'center' },
  popBody:      { fontSize: 15, lineHeight: 23, color: C.text, textAlign: 'center' },
  popPrimary:   { backgroundColor: C.blueMid, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center', marginTop: 20 },
  popPrimaryTxt:{ fontSize: 15, fontWeight: '700', color: C.white },
  popSecondary: { paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 6 },
  popSecondaryTxt:{ fontSize: 15, fontWeight: '500', color: C.textMid },

  starterRoot:      { flex: 1, backgroundColor: C.blueGhost },
  starterScroll:    { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  starterLea:       { width: 140, height: 140, marginBottom: 16 },
  starterEyebrow:   { fontSize: 11, fontWeight: '700', color: C.blueMid, letterSpacing: 2, marginBottom: 8 },
  starterTitle:     { fontSize: 32, fontWeight: '900', color: C.blueDeep, marginBottom: 12, textAlign: 'center', letterSpacing: -0.5 },
  starterBody:      { fontSize: 17, lineHeight: 26, color: C.text, textAlign: 'center', marginBottom: 8 },
  starterHint:      { fontSize: 14, lineHeight: 21, color: C.textMid, textAlign: 'center', marginBottom: 28 },
  starterStops:     { flexDirection: 'row', alignItems: 'center', marginBottom: 28, width: '100%' },
  starterStop:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.blueLight, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  starterStopAge:   { fontSize: 11, fontWeight: '800', color: C.blueDeep },
  starterLine:      { flex: 1, height: 2, backgroundColor: C.border },
  starterLegend:    { flexDirection: 'row', gap: 14, marginBottom: 6 },
  starterLegendHint:{ fontSize: 12, color: C.textSoft, marginBottom: 28 },
  starterBtn:       { backgroundColor: C.blueMid, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center', shadowColor: C.blueMid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  starterBtnTxt:    { fontSize: 17, fontWeight: '700', color: C.white },

  endWrap:       { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  endLea:        { width: 120, height: 120, marginTop: 28, marginBottom: 16 },
  endTitle:      { fontSize: 22, fontWeight: '800', color: C.blueDeep, textAlign: 'center', marginBottom: 10 },
  endSub:        { fontSize: 15, lineHeight: 23, color: C.textMid, textAlign: 'center', marginBottom: 24 },
  endMetricsCard:{ width: '100%', backgroundColor: C.white, borderRadius: 18, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  endMH:         { fontSize: 11, fontWeight: '700', color: C.textSoft, letterSpacing: 1.2, marginBottom: 14 },
  endMetricRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  endMetricLabel:{ fontSize: 13, fontWeight: '600', color: C.text, width: 60 },
  endBarBg:      { flex: 1, height: 7, backgroundColor: '#E0EBF5', borderRadius: 4, overflow: 'hidden' },
  endBarFill:    { height: '100%', borderRadius: 4 },
  endMetricVal:  { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  endDropRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginBottom: 4 },
  endDropLabel:  { fontSize: 12, fontWeight: '700', color: C.textSoft, letterSpacing: 1 },
  endRow:        { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 8 },
  endRowAge:     { fontSize: 11, fontWeight: '700', color: C.blueMid, textTransform: 'capitalize', marginBottom: 4 },
  endRowTxt:     { fontSize: 14, lineHeight: 21, color: C.text },
  endPrimary:    { backgroundColor: C.blueMid, borderRadius: 16, paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: 12, shadowColor: C.blueMid, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  endPrimaryTxt: { fontSize: 16, fontWeight: '700', color: C.white },
  endSecondary:  { borderRadius: 16, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  endSecondaryTxt:{ fontSize: 16, fontWeight: '600', color: C.blueDeep },
});
