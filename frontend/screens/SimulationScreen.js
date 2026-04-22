import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal, Image, SafeAreaView, StatusBar, Animated, Easing,
} from 'react-native';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';
import simulationData from '../data/simulation.json';

// â”€â”€ Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const BG      = '#FAF6F0';
const PLUM    = '#3D0C4E';
const ROSE    = '#C2748A';
const ROSE_D  = '#C2185B';
const MUTED   = '#B39DBC';
const WHITE   = '#FFFFFF';
const BORDER  = '#F5DCE8';
const AMBER   = '#FFF3E0';
const AMBER_D = '#E65100';
const PURPLE  = '#6A1B9A';
const GREEN   = '#388E3C';

// â”€â”€ Metrics config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const METRICS_CFG = [
  { key: 'career', label: 'Career', color: AMBER_D },
  { key: 'wellbeing', label: 'Health', color: ROSE_D },
  { key: 'clarity', label: 'Clarity', color: PURPLE },
  { key: 'freedom', label: 'Flex', color: GREEN },
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

// â”€â”€ Dog images â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DOGS = {
  puppy: { open: require('../assets/dogs/Puppy open eyes.png'), closed: require('../assets/dogs/puppy eyes closed.png') },
  teen:  { open: require('../assets/dogs/teen1 eyes open.png'), closed: require('../assets/dogs/teen1 eyes closed.png') },
  adult: {
    open:   require('../assets/dogs/adult dog eyes open tail down.png'),
    closed: require('../assets/dogs/adult dog eyes closed tail down.png'),
    openUp: require('../assets/dogs/adult dog eyes open tail up.png'),
  },
};
function leaStage(age)         { return age <= 23 ? 'puppy' : age <= 27 ? 'teen' : 'adult'; }
function getDog(age, open, up) {
  const s = leaStage(age);
  if (s === 'puppy') return open ? DOGS.puppy.open  : DOGS.puppy.closed;
  if (s === 'teen')  return open ? DOGS.teen.open   : DOGS.teen.closed;
  if (up) return DOGS.adult.openUp;
  return open ? DOGS.adult.open : DOGS.adult.closed;
}
function getFPTrack(age) {
  return age <= 27 ? 'track_family_planning_21_23' : age <= 31 ? 'track_family_planning_28_31' : 'track_family_planning_32_35';
}

// â”€â”€ Deterministic simulation engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TRACK_DELTAS = {
  corporate: {
    low: { career: 1, stress: 1 },
    medium: { career: 2, stress: 2 },
    high: { career: 3, stress: 4 },
  },
  startup: {
    low: { career: 2, stress: 2 },
    medium: { career: 3, stress: 4 },
    high: { career: 4, stress: 6 },
  },
  freelance: {
    low: { career: 1, stress: 1 },
    medium: { career: 2, stress: 2 },
    high: { career: 2, stress: 3 },
  },
};
const TRACK_LABELS = { corporate: 'Corporate', startup: 'Startup', freelance: 'Freelance' };
const INTENSITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function getTrackLabel(careerTrack, intensity) {
  return `${TRACK_LABELS[careerTrack] ?? 'Corporate'} (${INTENSITY_LABELS[intensity] ?? 'Medium'})`;
}

function runSimulation({ careerTrack, intensity, workHours, eggFreezingMonth, priorities }) {
  const td = TRACK_DELTAS[careerTrack]?.[intensity] || TRACK_DELTAS.corporate.medium;
  const careerGain = Math.round(td.career * (priorities.career / 3));

  let s = { career: 50, health: 80, stress: 20, flexibility: 10 };
  let stressCount = 0;
  const timeline = [];
  const KEY = new Set([1, 6, 12, 18, 24, 30, 36]);

  for (let m = 1; m <= 36; m++) {
    const evts = [];
    s.career   = Math.min(100, s.career + careerGain);
    s.stress  += td.stress;

    if (workHours > 50) { s.health -= 1; s.stress += 1; }

    if (eggFreezingMonth && m === eggFreezingMonth) {
      s.stress      += 15;
      s.flexibility += 50;
      evts.push('EGG_FREEZING');
    }

    if (s.stress > 70) {
      stressCount++;
      if (stressCount >= 3) {
        s.health = Math.max(0, s.health - 10);
        s.career = Math.max(0, s.career - 5);
        s.stress = 45;
        stressCount = 0;
        evts.push('BURNOUT');
      }
    } else {
      stressCount = 0;
    }

    const type = evts.includes('BURNOUT')      ? 'burnout'
      : evts.includes('EGG_FREEZING')          ? 'egg_freezing'
      : m === 1                                ? 'start'
      : m === 36                               ? 'end'
      : 'checkpoint';

    if (KEY.has(m) || evts.length > 0) {
      timeline.push({ month: m, type, scores: { ...s } });
    }
  }

  return {
    timeline,
    final:        { ...s },
    burnoutCount: timeline.filter(t => t.type === 'burnout').length,
    burnoutMonths: timeline.filter(t => t.type === 'burnout').map(t => t.month),
  };
}

function shortDesc(type, month, scores, prefs) {
  switch (type) {
    case 'start':       return `${getTrackLabel(prefs.careerTrack, prefs.intensity)} - ${prefs.workHours}h/week`;
    case 'egg_freezing':return `Egg freezing complete - flexibility +50`;
    case 'burnout':     return `Burnout: health -10, career -5, stress resets`;
    case 'end':         return `3-year plan complete`;
    default:            return `Month ${month} snapshot`;
  }
}

function toEpisodeCopy(text, max = 150) {
  if (!text) return '';
  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  const firstMatch = cleaned.match(/^.*?[.!?](\s|$)/);
  const firstSentence = firstMatch ? firstMatch[0].trim() : cleaned;
  const base = firstSentence.length >= 60 ? firstSentence : cleaned;
  if (base.length <= max) return base;
  return `${base.slice(0, max - 3).trim()}...`;
}

// â”€â”€ Journey transition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SCENERY = 'ROAD   CITY   ROAD   CITY   ROAD   CITY   ROAD';
const CLOUDS  = 'CLOUDS     SKY     CLOUDS     SKY     CLOUDS';

function JourneyTransition({ toAge, leaImage, onComplete }) {
  const scroll  = useRef(new Animated.Value(0)).current;
  const clouds  = useRef(new Animated.Value(0)).current;
  const bounce  = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;
  const ageFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(scroll, { toValue: -500, duration: 2400, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(clouds, { toValue: -300, duration: 5000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -9, duration: 220, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 0,  duration: 220, useNativeDriver: true }),
    ])).start();
    setTimeout(() => Animated.timing(ageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start(), 600);
    const t = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }).start(() => onComplete());
    }, 1850);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[jt.wrap, { opacity: fadeOut }]}>
      <View style={jt.sky}>
        <Animated.View style={{ transform: [{ translateX: clouds }] }}>
          <Text style={jt.clouds}>{CLOUDS}</Text>
        </Animated.View>
      </View>
      <View style={jt.sceneryClip}>
        <Animated.View style={[jt.sceneryRow, { transform: [{ translateX: scroll }] }]}>
          <Text style={jt.sceneryTxt}>{SCENERY}</Text>
        </Animated.View>
      </View>
      <View style={jt.road}>
        <View style={jt.dashRow}>
          <Animated.View style={[jt.dashes, { transform: [{ translateX: scroll }] }]}>
            {Array.from({ length: 28 }).map((_, i) => <View key={i} style={jt.dash} />)}
          </Animated.View>
        </View>
        <Animated.Image source={leaImage} style={[jt.lea, { transform: [{ translateY: bounce }] }]} resizeMode="contain" />
      </View>
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
  wrap:       { ...StyleSheet.absoluteFillObject, backgroundColor: '#F3E5F5', zIndex: 200 },
  sky:        { flex: 2, overflow: 'hidden', justifyContent: 'center', backgroundColor: '#EDE7F6' },
  clouds:     { fontSize: 32, marginLeft: 20 },
  sceneryClip:{ height: 60, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#F8BBD9' },
  sceneryRow: { flexDirection: 'row' },
  sceneryTxt: { fontSize: 30, marginLeft: 10 },
  road:       { height: 110, backgroundColor: ROSE, justifyContent: 'center', alignItems: 'center' },
  dashRow:    { position: 'absolute', top: '45%', left: 0, right: 0, height: 4, overflow: 'hidden' },
  dashes:     { flexDirection: 'row' },
  dash:       { width: 28, height: 4, backgroundColor: WHITE, marginRight: 18, opacity: 0.7 },
  lea:        { width: 90, height: 90 },
  bottom:     { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  toAgeNum:   { fontSize: 56, fontWeight: '900', color: PLUM, lineHeight: 60, letterSpacing: -2 },
  toAgeWord:  { fontSize: 14, color: MUTED, fontWeight: '500' },
});

// â”€â”€ Shared sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MetricsStrip({ metrics }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingTop: 8 }}>
      {METRICS_CFG.map(({ key, color }) => {
        const val = metrics[key];
        return (
          <View key={key} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
            <View style={{ width: '100%', height: 4, backgroundColor: '#EEE8F5', borderRadius: 2, overflow: 'hidden' }}>
              <View style={{ height: '100%', width: `${val}%`, backgroundColor: color, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 10, fontWeight: '700', color }}>{val}</Text>
          </View>
        );
      })}
    </View>
  );
}

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
  line:     { flex: 1, height: 2, backgroundColor: BORDER, marginHorizontal: 2 },
  lineDone: { backgroundColor: ROSE_D },
  dot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: '#F5DCE8', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  dotDone:  { backgroundColor: ROSE_D, borderColor: ROSE_D },
  dotActive:{ width: 16, height: 16, borderRadius: 8, backgroundColor: WHITE, borderColor: ROSE_D, borderWidth: 2.5 },
  core:     { width: 6, height: 6, borderRadius: 3, backgroundColor: ROSE_D },
});

function ChoiceCard({ label, theme, choiceKey, onPress }) {
  const deltas = METRIC_DELTAS[theme]?.[choiceKey] ?? {};
  const hints  = Object.entries(deltas).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 3);
  const MAP    = { career: 'Career', wellbeing: 'Health', clarity: 'Clarity', freedom: 'Flex' };
  return (
    <TouchableOpacity style={ch.card} onPress={onPress} activeOpacity={0.8}>
      <Text style={ch.label} numberOfLines={2}>{toEpisodeCopy(label, 85)}</Text>
      {hints.length > 0 && (
        <View style={ch.hints}>
          {hints.map(([k, v]) => (
            <View key={k} style={[ch.hint, v > 0 ? ch.hintUp : ch.hintDown]}>
              <Text style={[ch.hintTxt, v > 0 ? ch.hintUp2 : ch.hintDown2]}>{MAP[k]} {v > 0 ? 'Up' : 'Down'}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
const ch = StyleSheet.create({
  card:     { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5, borderColor: BORDER, paddingVertical: 16, paddingHorizontal: 18, shadowColor: ROSE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  label:    { fontSize: 15, lineHeight: 22, color: PLUM, fontWeight: '600', marginBottom: 10 },
  hints:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  hint:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  hintTxt:  { fontSize: 11, fontWeight: '700' },
  hintUp:   { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  hintDown: { backgroundColor: '#FCE4EC', borderColor: '#F48FB1' },
  hintUp2:  { color: GREEN },
  hintDown2:{ color: ROSE_D },
});

function DeltaPills({ deltas }) {
  if (!deltas || !Object.keys(deltas).length) return null;
  const MAP = { career: 'Career', wellbeing: 'Health', clarity: 'Clarity', freedom: 'Flex' };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
      {Object.entries(deltas).map(([k, v]) => (
        <View key={k} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1, ...(v > 0 ? { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' } : { backgroundColor: '#FCE4EC', borderColor: '#F48FB1' }) }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: v > 0 ? GREEN : ROSE_D }}>
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
      <Text style={{ fontSize: 11, fontWeight: '700', color: ROSE_D, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Health insight</Text>
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

// â”€â”€ Checkpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function CheckpointScreen({ currentAge, metrics, onContinue, onInsights }) {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={cp.wrap}>
      <Text style={cp.badgeLabel}>CHECKPOINT</Text>
      <Text style={cp.age}>{currentAge}</Text>
      <Text style={cp.title}>{currentAge - 21} year{currentAge - 21 !== 1 ? 's' : ''} in</Text>
      <View style={cp.metricsRow}>
        {METRICS_CFG.map(({ key, color }) => (
          <View key={key} style={cp.metricItem}>
            <View style={cp.metricBarBg}>
              <View style={[cp.metricBar, { width: `${metrics[key]}%`, backgroundColor: color }]} />
            </View>
            <Text style={[cp.metricVal, { color }]}>{metrics[key]}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={cp.primary} onPress={onContinue} activeOpacity={0.82}>
        <Text style={cp.primaryTxt}>Keep going -></Text>
      </TouchableOpacity>
      <TouchableOpacity style={cp.secondary} onPress={onInsights} activeOpacity={0.82}>
        <Text style={cp.secondaryTxt}>See insights so far</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const cp = StyleSheet.create({
  wrap:       { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  badgeLabel: { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 2, marginBottom: 12 },
  age:        { fontSize: 72, fontWeight: '900', color: PLUM, lineHeight: 76, letterSpacing: -3, marginBottom: 4 },
  title:      { fontSize: 18, fontWeight: '700', color: PLUM, marginBottom: 28, textAlign: 'center' },
  metricsRow: { width: '100%', flexDirection: 'row', gap: 8, marginBottom: 32 },
  metricItem: { flex: 1, alignItems: 'center', gap: 4 },
  metricBarBg:{ width: '100%', height: 6, backgroundColor: '#EEE8F5', borderRadius: 3, overflow: 'hidden' },
  metricBar:  { height: '100%', borderRadius: 3 },
  metricVal:  { fontSize: 11, fontWeight: '700' },
  primary:    { backgroundColor: ROSE_D, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryTxt: { fontSize: 16, fontWeight: '700', color: WHITE },
  secondary:  { borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  secondaryTxt:{ fontSize: 15, fontWeight: '600', color: PLUM },
});

// â”€â”€ Mid insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function generateInsights(decisionsMade, metrics, age) {
  const counts = {};
  decisionsMade.forEach(d => { counts[d.theme] = (counts[d.theme] || 0) + 1; });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const insights = [];
  const TOP = {
    career:          "You've been leaning into career choices. Worth knowing what you're trading for it.",
    health:          "You've been paying attention to your health. That kind of awareness compounds.",
    relationships:   "Relationships have come up a lot. How you show up for others shapes everything else.",
    family_planning: "You've been thinking about your future. There's no right timeline - just yours.",
  };
  if (sorted[0]) insights.push(TOP[sorted[0][0]] ?? '');
  if (metrics.freedom < 38)   insights.push("Your freedom score is low. Consider protecting some personal time.");
  if (metrics.wellbeing < 38) insights.push("Wellbeing needs attention. Small habits make a difference.");
  if (metrics.career > 68 && metrics.freedom < 42) insights.push("Strong career, lower freedom - a classic trade-off.");
  return insights.filter(Boolean).slice(0, 3);
}

function MidInsightsScreen({ currentAge, metrics, decisionsMade, onContinue, onReset }) {
  const insights = generateInsights(decisionsMade, metrics, currentAge);
  const [expanded, setExpanded] = useState(false);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={mi.wrap}>
      <Image source={DOGS.adult.open} style={mi.lea} resizeMode="contain" />
      <Text style={mi.eyebrow}>AGE {currentAge} SNAPSHOT</Text>
      <View style={mi.metricsCard}>
        {METRICS_CFG.map(({ key, label, color }) => (
          <View key={key} style={mi.metricRow}>
            <Text style={mi.metricLabel}>{label}</Text>
            <View style={mi.barBg}><View style={[mi.barFill, { width: `${metrics[key]}%`, backgroundColor: color }]} /></View>
            <Text style={[mi.metricVal, { color }]}>{metrics[key]}</Text>
          </View>
        ))}
      </View>
      {insights.length > 0 && (
        <View style={mi.insightsCard}>
          <Text style={mi.insightsHeading}>WHAT WE NOTICE</Text>
          {insights.map((txt, i) => (
            <View key={i} style={[mi.insightRow, i === insights.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={mi.insightTxt}>{txt}</Text>
            </View>
          ))}
        </View>
      )}
      {decisionsMade.length > 0 && (
        <View style={{ width: '100%', marginBottom: 20 }}>
          <TouchableOpacity style={mi.dropRow} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
            <Text style={mi.dropLabel}>YOUR CHOICES</Text>
            <Text style={mi.dropArrow}>{expanded ? '^' : 'v'}</Text>
          </TouchableOpacity>
          {expanded && decisionsMade.map((d, i) => (
            <View key={i} style={mi.journeyRow}>
              <Text style={mi.journeyAge}>Age {d.age} - {d.theme}</Text>
              <Text style={mi.journeyTxt}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={mi.primary} onPress={onContinue} activeOpacity={0.82}>
        <Text style={mi.primaryTxt}>Continue from age {currentAge} -></Text>
      </TouchableOpacity>
      <TouchableOpacity style={mi.secondary} onPress={onReset} activeOpacity={0.82}>
        <Text style={mi.secondaryTxt}>Start over</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const mi = StyleSheet.create({
  wrap:           { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  lea:            { width: 100, height: 100, marginTop: 24, marginBottom: 12 },
  eyebrow:        { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.5, marginBottom: 16 },
  metricsCard:    { width: '100%', backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  metricRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  metricLabel:    { fontSize: 13, fontWeight: '600', color: PLUM, width: 60 },
  barBg:          { flex: 1, height: 7, backgroundColor: '#EEE8F5', borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 4 },
  metricVal:      { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  insightsCard:   { width: '100%', backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: ROSE_D, borderWidth: 1, borderColor: BORDER },
  insightsHeading:{ fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 10 },
  insightRow:     { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FFF0F5', alignItems: 'flex-start' },
  insightTxt:     { flex: 1, fontSize: 13, lineHeight: 20, color: PLUM },
  dropRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  dropLabel:      { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1 },
  dropArrow:      { fontSize: 12, color: MUTED },
  journeyRow:     { backgroundColor: WHITE, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  journeyAge:     { fontSize: 11, fontWeight: '700', color: ROSE_D, textTransform: 'capitalize', marginBottom: 4 },
  journeyTxt:     { fontSize: 13, lineHeight: 20, color: PLUM },
  primary:        { backgroundColor: ROSE_D, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12 },
  primaryTxt:     { fontSize: 16, fontWeight: '700', color: WHITE },
  secondary:      { borderRadius: 14, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  secondaryTxt:   { fontSize: 15, fontWeight: '600', color: PLUM },
});

// â”€â”€ End screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function EndScreen({ decisionsMade, metrics, onLifePlan, onReset }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={s.endWrap}>
      <Image source={DOGS.adult.openUp} style={s.endLea} resizeMode="contain" />
      <Text style={s.endTitle}>One possible version of your path</Text>
      <Text style={s.endSub}>Every choice shapes something. None of them are wrong.</Text>
      <View style={s.endMetricsCard}>
        <Text style={s.endMH}>WHERE YOU ENDED UP</Text>
        {METRICS_CFG.map(({ key, label, color }) => (
          <View key={key} style={s.endMetricRow}>
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
            <Text style={{ fontSize: 12, color: MUTED }}>{expanded ? '^' : 'v'}</Text>
          </TouchableOpacity>
          {expanded && decisionsMade.map((d, i) => (
            <View key={i} style={s.endRow}>
              <Text style={s.endRowAge}>Age {d.age} - {d.theme}</Text>
              <Text style={s.endRowTxt}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}
      <TouchableOpacity style={s.endPrimary} onPress={onLifePlan} activeOpacity={0.82}>
        <Text style={s.endPrimaryTxt}>See 36-month life plan -></Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.endSecondary} onPress={onReset} activeOpacity={0.82}>
        <Text style={s.endSecondaryTxt}>Try a different path</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// â”€â”€ Preferences screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const CAREER_OPTIONS = [
  { key: 'corporate', label: 'Corporate' },
  { key: 'startup', label: 'Startup' },
  { key: 'freelance', label: 'Freelance' },
];
const INTENSITY_OPTIONS = ['low', 'medium', 'high'];
const HOURS_OPTIONS = [
  { key: 40,  label: '<=40h' },
  { key: 50,  label: '41-50h' },
  { key: 58,  label: '51-60h' },
  { key: 65,  label: '60h+' },
];
const FREEZE_OPTIONS = [
  { key: null, label: 'None' },
  { key: 6,   label: 'Month 6' },
  { key: 12,  label: 'Month 12' },
  { key: 18,  label: 'Month 18' },
  { key: 24,  label: 'Month 24' },
];

function PillRow({ options, selected, onSelect, keyField = 'key', labelField = 'label', subField }) {
  return (
    <View style={pf.pillRow}>
      {options.map(opt => {
        const active = selected === opt[keyField];
        return (
          <TouchableOpacity
            key={String(opt[keyField])}
            style={[pf.pill, active && pf.pillActive]}
            onPress={() => onSelect(opt[keyField])}
            activeOpacity={0.78}
          >
            <Text style={[pf.pillTxt, active && pf.pillTxtActive]}>{opt[labelField]}</Text>
            {subField && opt[subField] && (
              <Text style={[pf.pillSub, active && pf.pillSubActive]}>{opt[subField]}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function IntensityBar({ value, onChange }) {
  return (
    <View style={pf.intensityWrap}>
      {INTENSITY_OPTIONS.map(level => {
        const active = value === level;
        return (
          <TouchableOpacity
            key={level}
            style={[pf.intensityPill, active && pf.intensityPillActive]}
            onPress={() => onChange(level)}
            activeOpacity={0.78}
          >
            <Text style={[pf.intensityTxt, active && pf.intensityTxtActive]}>
              {INTENSITY_LABELS[level]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function PriorityRow({ label, value, onChange }) {
  return (
    <View style={pf.priorityRow}>
      <Text style={pf.priorityLabel}>{label}</Text>
      <View style={pf.priorityNums}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity
            key={n}
            style={[pf.numBtn, value === n && pf.numBtnActive]}
            onPress={() => onChange(n)}
            activeOpacity={0.75}
          >
            <Text style={[pf.numTxt, value === n && pf.numTxtActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function PrefsScreen({ onRun, onBack }) {
  const [careerTrack,      setCareerTrack]      = useState('corporate');
  const [intensityByTrack, setIntensityByTrack] = useState({
    corporate: 'medium',
    startup: 'medium',
    freelance: 'medium',
  });
  const [workHours,        setWorkHours]        = useState(65);
  const [includeEggFreezing, setIncludeEggFreezing] = useState(false);
  const [eggFreezingMonth, setEggFreezingMonth] = useState(12);
  const [priorities, setPriorities] = useState({ career: 4, health: 3, relationships: 2 });

  function setPriority(key, val) {
    setPriorities(p => ({ ...p, [key]: val }));
  }
  function setTrackIntensity(track, intensity) {
    setCareerTrack(track);
    setIntensityByTrack(p => ({ ...p, [track]: intensity }));
  }

  function handleRun() {
    onRun({
      careerTrack,
      intensity: intensityByTrack[careerTrack],
      workHours,
      eggFreezingMonth: includeEggFreezing ? eggFreezingMonth : null,
      priorities,
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={pf.scroll} showsVerticalScrollIndicator={false}>

        <View style={pf.header}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={pf.back}>Back</Text>
          </TouchableOpacity>
          <Text style={pf.title}>Your Scenario</Text>
          <Text style={pf.sub}>Personalise the 36-month simulation</Text>
        </View>

        <View style={pf.card}>
          <Text style={pf.sectionLabel}>CAREER PATH</Text>
          {CAREER_OPTIONS.map(opt => {
            const selected = careerTrack === opt.key;
            const intensity = intensityByTrack[opt.key];
            return (
              <View key={opt.key} style={[pf.trackBlock, selected && pf.trackBlockActive]}>
                <TouchableOpacity onPress={() => setCareerTrack(opt.key)} activeOpacity={0.78}>
                  <Text style={[pf.trackTitle, selected && pf.trackTitleActive]}>{opt.label}</Text>
                </TouchableOpacity>
                <IntensityBar value={intensity} onChange={level => setTrackIntensity(opt.key, level)} />
              </View>
            );
          })}
        </View>

        <View style={pf.card}>
          <Text style={pf.sectionLabel}>WEEKLY HOURS</Text>
          <PillRow options={HOURS_OPTIONS} selected={workHours} onSelect={setWorkHours} />
        </View>

        <View style={pf.card}>
          <Text style={pf.sectionLabel}>EGG FREEZING</Text>
          <Text style={pf.question}>Do you want to include egg freezing in this simulation?</Text>
          <View style={pf.pillRow}>
            <TouchableOpacity
              style={[pf.pill, !includeEggFreezing && pf.pillActive]}
              onPress={() => setIncludeEggFreezing(false)}
              activeOpacity={0.78}
            >
              <Text style={[pf.pillTxt, !includeEggFreezing && pf.pillTxtActive]}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[pf.pill, includeEggFreezing && pf.pillActive]}
              onPress={() => {
                setIncludeEggFreezing(true);
                if (!eggFreezingMonth) setEggFreezingMonth(12);
              }}
              activeOpacity={0.78}
            >
              <Text style={[pf.pillTxt, includeEggFreezing && pf.pillTxtActive]}>Yes</Text>
            </TouchableOpacity>
          </View>
          {includeEggFreezing && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={[pf.pillRow, { flexWrap: 'nowrap', marginTop: 10 }]}>
                {FREEZE_OPTIONS.filter(opt => opt.key !== null).map(opt => {
                  const active = eggFreezingMonth === opt.key;
                  return (
                    <TouchableOpacity
                      key={String(opt.key)}
                      style={[pf.pill, active && pf.pillActive, { minWidth: 80 }]}
                      onPress={() => setEggFreezingMonth(opt.key)}
                      activeOpacity={0.78}
                    >
                      <Text style={[pf.pillTxt, active && pf.pillTxtActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={pf.card}>
          <Text style={pf.sectionLabel}>PRIORITIES  <Text style={pf.sectionHint}>1 = low - 5 = high</Text></Text>
          <PriorityRow label="Career"      value={priorities.career}       onChange={v => setPriority('career', v)} />
          <PriorityRow label="Health"      value={priorities.health}       onChange={v => setPriority('health', v)} />
          <PriorityRow label="Relationships" value={priorities.relationships} onChange={v => setPriority('relationships', v)} />
        </View>

        <TouchableOpacity style={pf.runBtn} onPress={handleRun} activeOpacity={0.85}>
          <Text style={pf.runBtnTxt}>Run simulation -></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
const pf = StyleSheet.create({
  scroll:      { paddingHorizontal: 20, paddingBottom: 48 },
  header:      { paddingTop: 20, paddingBottom: 20 },
  back:        { fontSize: 14, color: ROSE_D, fontWeight: '600', marginBottom: 14 },
  title:       { fontSize: 28, fontWeight: '800', color: PLUM, letterSpacing: -0.5 },
  sub:         { fontSize: 13, color: MUTED, marginTop: 4 },

  card:        { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  sectionLabel:{ fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 1.4, marginBottom: 12 },
  sectionHint: { fontSize: 10, fontWeight: '500', letterSpacing: 0.5 },
  question:    { fontSize: 13, color: PLUM, marginBottom: 10, lineHeight: 20 },
  trackBlock:  { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 12, marginBottom: 10, backgroundColor: '#FBF7FC' },
  trackBlockActive: { borderColor: ROSE_D, backgroundColor: '#FFF0F5' },
  trackTitle:  { fontSize: 14, fontWeight: '700', color: PLUM, marginBottom: 10 },
  trackTitleActive: { color: ROSE_D },
  intensityWrap: { flexDirection: 'row', borderWidth: 1, borderColor: BORDER, borderRadius: 999, overflow: 'hidden', backgroundColor: WHITE },
  intensityPill: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  intensityPillActive: { backgroundColor: PLUM },
  intensityTxt: { fontSize: 12, fontWeight: '600', color: PLUM },
  intensityTxtActive: { color: WHITE },

  pillRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill:        { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100, backgroundColor: '#F5EEF8', borderWidth: 1.5, borderColor: BORDER },
  pillActive:  { backgroundColor: PLUM, borderColor: PLUM },
  pillTxt:     { fontSize: 13, fontWeight: '600', color: PLUM },
  pillTxtActive:{ color: WHITE },
  pillSub:     { fontSize: 10, color: MUTED, marginTop: 2 },
  pillSubActive:{ color: 'rgba(255,255,255,0.75)' },

  priorityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFF0F5' },
  priorityLabel:{ fontSize: 14, color: PLUM, fontWeight: '500', flex: 1 },
  priorityNums:{ flexDirection: 'row', gap: 6 },
  numBtn:      { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5EEF8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER },
  numBtnActive:{ backgroundColor: ROSE_D, borderColor: ROSE_D },
  numTxt:      { fontSize: 13, fontWeight: '700', color: PLUM },
  numTxtActive:{ color: WHITE },

  runBtn:      { backgroundColor: ROSE_D, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  runBtnTxt:   { fontSize: 17, fontWeight: '700', color: WHITE },
});

// â”€â”€ Life Plan view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const TYPE_CONFIG = {
  start:       { borderColor: '#C5E1A5', bg: '#F1F8E9', tag: 'START',        tagColor: GREEN },
  checkpoint:  { borderColor: BORDER,   bg: WHITE,     tag: 'MONTH',        tagColor: MUTED },
  egg_freezing:{ borderColor: '#CE93D8', bg: '#F3E5F5', tag: 'EGG FREEZING', tagColor: PURPLE },
  burnout:     { borderColor: '#F48FB1', bg: '#FCE4EC', tag: 'BURNOUT',      tagColor: ROSE_D },
  end:         { borderColor: ROSE,     bg: '#FFF0F5', tag: 'FINAL',         tagColor: ROSE },
};

function TimelineCard({ item, prefs }) {
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.checkpoint;
  const { career, health, stress, flexibility } = item.scores;
  const desc = shortDesc(item.type, item.month, item.scores, prefs);

  return (
    <View style={[lp.card, { borderColor: cfg.borderColor, backgroundColor: cfg.bg }]}>
      <View style={lp.cardTop}>
        <View style={lp.monthBadge}>
          <Text style={lp.monthNum}>{item.month}</Text>
          <Text style={lp.monthWord}>mo</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[lp.typeTag, { color: cfg.tagColor }]}>{cfg.tag}</Text>
          <Text style={lp.desc}>{desc}</Text>
        </View>
      </View>

      <View style={lp.scoresRow}>
        {[
          { label: 'Career', val: career,      color: AMBER_D },
          { label: 'Health', val: health,      color: ROSE_D },
          { label: 'Stress', val: stress,      color: PURPLE },
          { label: 'Flex', val: flexibility, color: GREEN },
        ].map(({ label, val, color }) => (
          <View key={label} style={lp.scoreItem}>
            <Text style={lp.scoreEmoji}>{label}</Text>
            <View style={lp.scoreBarBg}>
              <View style={[lp.scoreBarFill, { width: `${Math.min(val, 100)}%`, backgroundColor: color }]} />
            </View>
            <Text style={[lp.scoreVal, { color }]}>{val}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function LifePlanView({ result, prefs, onBack }) {
  const { timeline, final, burnoutCount, burnoutMonths } = result;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={lp.scroll} showsVerticalScrollIndicator={false}>

        <View style={lp.header}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={lp.back}>Edit</Text>
          </TouchableOpacity>
          <Text style={lp.title}>36-Month Plan</Text>
          <Text style={lp.sub}>{getTrackLabel(prefs.careerTrack, prefs.intensity)} - {prefs.workHours}h/week</Text>
          <View style={lp.underline} />
        </View>

        <View style={lp.summaryCard}>
          <View style={lp.summaryRow}>
            <View style={lp.summaryItem}>
              <Text style={lp.summaryVal}>{final.career}</Text>
              <Text style={lp.summaryLbl}>Career</Text>
            </View>
            <View style={lp.summaryDivider} />
            <View style={lp.summaryItem}>
              <Text style={[lp.summaryVal, { color: final.health < 40 ? ROSE_D : GREEN }]}>{final.health}</Text>
              <Text style={lp.summaryLbl}>Health</Text>
            </View>
            <View style={lp.summaryDivider} />
            <View style={lp.summaryItem}>
              <Text style={[lp.summaryVal, { color: burnoutCount > 0 ? ROSE_D : GREEN }]}>{burnoutCount}</Text>
              <Text style={lp.summaryLbl}>Burnouts</Text>
            </View>
          </View>
          {prefs.eggFreezingMonth && (
            <Text style={lp.fertileTag}>Egg freezing secured at month {prefs.eggFreezingMonth}</Text>
          )}
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          {timeline.map(item => <TimelineCard key={item.month} item={item} prefs={prefs} />)}
        </View>

        <TouchableOpacity style={lp.backBtn} onPress={onBack} activeOpacity={0.82}>
          <Text style={lp.backBtnTxt}>Edit scenario</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
const lp = StyleSheet.create({
  scroll:        { paddingBottom: 56 },
  header:        { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  back:          { fontSize: 14, color: ROSE_D, fontWeight: '600', marginBottom: 14 },
  title:         { fontSize: 28, fontWeight: '800', color: PLUM, letterSpacing: -0.5 },
  sub:           { fontSize: 13, color: MUTED, marginTop: 3 },
  underline:     { width: 80, height: 2, backgroundColor: ROSE, borderRadius: 1, marginTop: 8 },

  summaryCard:   { marginHorizontal: 20, marginBottom: 20, backgroundColor: WHITE, borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: BORDER },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem:   { flex: 1, alignItems: 'center' },
  summaryVal:    { fontSize: 22, fontWeight: '900', color: PLUM },
  summaryLbl:    { fontSize: 11, color: MUTED, fontWeight: '500', marginTop: 2 },
  summaryDivider:{ width: 1, height: 36, backgroundColor: BORDER },
  fertileTag:    { marginTop: 12, fontSize: 12, color: PURPLE, fontWeight: '600', textAlign: 'center' },

  card:          { borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  cardTop:       { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  monthBadge:    { width: 40, height: 40, borderRadius: 20, backgroundColor: WHITE, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BORDER, flexShrink: 0 },
  monthNum:      { fontSize: 14, fontWeight: '900', color: PLUM, lineHeight: 16 },
  monthWord:     { fontSize: 8, color: MUTED, fontWeight: '600' },
  typeTag:       { fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 3 },
  desc:          { fontSize: 13, color: PLUM, lineHeight: 19 },

  scoresRow:     { gap: 5, marginBottom: 8 },
  scoreItem:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreEmoji:    { fontSize: 11, width: 46, color: MUTED },
  scoreBarBg:    { flex: 1, height: 4, backgroundColor: '#EEE8F5', borderRadius: 2, overflow: 'hidden' },
  scoreBarFill:  { height: '100%', borderRadius: 2 },
  scoreVal:      { fontSize: 10, fontWeight: '700', width: 24, textAlign: 'right' },
  backBtn:       { marginHorizontal: 20, marginTop: 8, backgroundColor: ROSE_D, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  backBtnTxt:    { fontSize: 15, fontWeight: '700', color: WHITE },
});

// â”€â”€ Popup helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function FamilyPopup({ visible, currentAge, fpPref, onPlanning, onChildFree, onClose }) {
  const fpTrack = simulationData.tracks[getFPTrack(currentAge)];
  const cfTrack = simulationData.tracks['track_child_free'];
  if (!fpPref) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={s.popOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
          <View style={s.popCard}>
            <Text style={s.popTitle}>Explore family planning?</Text>
            <Text style={s.popBody}>This personalises the next part of your journey. You can change it any time.</Text>
            <TouchableOpacity style={s.popPrimary} onPress={onPlanning} activeOpacity={0.82}><Text style={s.popPrimaryTxt}>Yes, it's part of my thinking</Text></TouchableOpacity>
            <TouchableOpacity style={[s.popPrimary, { backgroundColor: '#F3E5F5', marginTop: 10 }]} onPress={onChildFree} activeOpacity={0.82}><Text style={[s.popPrimaryTxt, { color: PURPLE }]}>Not planning to have children</Text></TouchableOpacity>
            <TouchableOpacity style={s.popSecondary} onPress={onClose} activeOpacity={0.82}><Text style={s.popSecondaryTxt}>Ask me later</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  const isChildFree = fpPref === 'child_free';
  const td = isChildFree ? cfTrack : fpTrack;
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.popOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={s.popCard}>
          <Text style={s.popTitle}>{isChildFree ? 'Your health, your terms' : 'Family planning'}</Text>
          <Text style={s.popBody}>{td?.framing ?? 'Explore what this looks like for you.'}</Text>
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
          <Text style={s.popTitle}>Relationship scenarios</Text>
          <Text style={s.popBody}>When on, LEA includes moments about partnerships and life planning with a partner.</Text>
          <TouchableOpacity style={s.popPrimary} onPress={onClose} activeOpacity={0.82}><Text style={s.popPrimaryTxt}>Got it</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// â”€â”€ Main screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  const [showPrefs,     setShowPrefs]     = useState(false);
  const [planResult,    setPlanResult]    = useState(null);
  const [planPrefs,     setPlanPrefs]     = useState(null);
  const [leaOpen,       setLeaOpen]       = useState(true);
  const [leaTail,       setLeaTail]       = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [metrics,       setMetrics]       = useState({ ...BASE_METRICS });
  const [showTransition,  setShowTransition]  = useState(false);
  const [transToAge,      setTransToAge]      = useState(null);
  const [transNode,       setTransNode]       = useState(null);
  const [showCheckpoint,  setShowCheckpoint]  = useState(false);
  const [showMidInsights, setShowMidInsights] = useState(false);
  const [exitSummary,     setExitSummary]     = useState(null);

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
  function advanceAge(from) {
    const next = from + 1;
    if (next > 35) { finish(); return; }
    const node = findNode(next, simulationData.ages);
    if (!node) { finish(); return; }
    setTransToAge(next); setTransNode(node); setShowTransition(true);
  }
  function handleTransitionDone() {
    setShowTransition(false);
    setCurrentAge(transToAge); setCurrentNode(transNode);
    setDecIdx(0); setCurrentTrack(null); setTrackIdx(0);
    setLeaOpen(true); setLeaTail(false);
    if (transToAge > startAge && (transToAge - startAge) % 2 === 0 && transToAge < 35) setShowCheckpoint(true);
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
    setShowPrefs(false); setPlanResult(null); setPlanPrefs(null);
  }, []);

  const handleExitToLanding = useCallback(async () => {
    const insights = generateInsights(decisions, metrics, currentAge);
    setExitSummary({
      ageReached: currentAge,
      decisionsCount: decisions.length,
      insights,
    });
    await handleReset();
  }, [currentAge, decisions, metrics, handleReset]);

  // â”€â”€ Guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) return <SafeAreaView style={s.loadWrap}><Text style={s.loadTxt}>Loading...</Text></SafeAreaView>;

  if (showPrefs && !planResult) {
    return (
      <PrefsScreen
        onRun={prefs => { setPlanPrefs(prefs); setPlanResult(runSimulation(prefs)); setShowPrefs(false); }}
        onBack={() => { setShowPrefs(false); setShowStarter(true); }}
      />
    );
  }

  if (planResult && planPrefs) {
    return <LifePlanView result={planResult} prefs={planPrefs} onBack={() => { setPlanResult(null); setPlanPrefs(null); setShowPrefs(true); }} />;
  }

  if (showTransition) {
    return (
      <SafeAreaView style={s.root}>
        <JourneyTransition toAge={transToAge} leaImage={getDog(transToAge, true, false)} onComplete={handleTransitionDone} />
      </SafeAreaView>
    );
  }
  if (showCheckpoint) {
    return (
      <SafeAreaView style={s.root}>
        <CheckpointScreen currentAge={currentAge} metrics={metrics}
          onContinue={() => setShowCheckpoint(false)}
          onInsights={() => { setShowCheckpoint(false); setShowMidInsights(true); }} />
      </SafeAreaView>
    );
  }
  if (showMidInsights) {
    return (
      <SafeAreaView style={s.root}>
        <MidInsightsScreen currentAge={currentAge} metrics={metrics} decisionsMade={decisions}
          onContinue={() => setShowMidInsights(false)} onReset={handleReset} />
      </SafeAreaView>
    );
  }

  // â”€â”€ Starter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (showStarter) {
    const condText = userConds.length ? userConds.join(', ') : 'No conditions selected yet';
    return (
      <SafeAreaView style={s.starterRoot}>
        <ScrollView contentContainerStyle={s.starterScroll} showsVerticalScrollIndicator={false}>
          <Image source={DOGS.puppy.open} style={s.starterLea} resizeMode="contain" />
          <Text style={s.starterEyebrow}>SIMULATION</Text>
          <Text style={s.starterTitle}>Set up your simulation</Text>
          <Text style={s.starterHint}>Lea wants to confirm your simulation setup before you begin.</Text>
          <View style={s.conditionsCard}>
            <Text style={s.conditionsTitle}>Conditions for this run</Text>
            <Text style={s.conditionsBody}>{condText}</Text>
          </View>
          {exitSummary && (
            <View style={s.exitSummaryCard}>
              <Text style={s.exitSummaryTitle}>Previous run summary</Text>
              <Text style={s.exitSummaryMeta}>Reached age {exitSummary.ageReached} · {exitSummary.decisionsCount} decisions</Text>
              {exitSummary.insights.length > 0 && exitSummary.insights.map((insight, idx) => (
                <Text key={`${insight}-${idx}`} style={s.exitSummaryLine}>• {insight}</Text>
              ))}
            </View>
          )}
          <View style={s.starterStops}>
            {[21, 25, 28, 32, 35].map((age, i) => (
              <React.Fragment key={age}>
                {i > 0 && <View style={s.starterLine} />}
                <View style={s.starterStop}><Text style={s.starterStopAge}>{age}</Text></View>
              </React.Fragment>
            ))}
          </View>
          <TouchableOpacity style={s.starterBtnSecondary} onPress={() => { setShowStarter(false); setShowPrefs(true); }} activeOpacity={0.82}>
            <Text style={s.starterBtnSecondaryTxt}>Set preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.starterBtn} onPress={() => { setExitSummary(null); setShowStarter(false); }} activeOpacity={0.82}>
            <Text style={s.starterBtnTxt}>Start simulation</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
  if (simDone) {
    return (
      <SafeAreaView style={s.root}>
        <EndScreen decisionsMade={decisions} metrics={metrics}
          onLifePlan={() => setShowPrefs(true)} onReset={handleReset} />
      </SafeAreaView>
    );
  }

  if (!currentNode) return <SafeAreaView style={s.loadWrap}><Text style={s.loadTxt}>Almost there...</Text></SafeAreaView>;

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
          <TouchableOpacity style={[s.iconBtn, relEnabled && s.iconBtnRel]} onPress={handleRelToggle} activeOpacity={0.8}>
            <Text style={s.iconBtnTxt}>Rel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, currentTrack && s.iconBtnFam]} onPress={handleFamPress} activeOpacity={0.8}>
            <Text style={s.iconBtnTxt}>FP</Text>
            {fpBadge && <View style={s.badgeDot} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={handleExitToLanding} activeOpacity={0.8}>
            <Text style={s.iconBtnTxt}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>
      <MetricsStrip metrics={metrics} />
    </View>
  );

  const Nudge = fpNudge ? (
    <TouchableOpacity style={s.nudge} onPress={() => { setFpNudge(false); handleFamPress(); }} activeOpacity={0.9}>
      <Text style={s.nudgeTxt}>Tap to explore family planning whenever you're ready</Text>
    </TouchableOpacity>
  ) : null;

  const Footer = history.length > 0 ? (
    <View style={s.footer}>
      <TouchableOpacity style={s.undoBtn} onPress={handleUndo} activeOpacity={0.8}>
        <Text style={s.undoBtnTxt}>Undo</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  const Popups = (
    <>
      <FamilyPopup visible={showFamPopup} currentAge={currentAge} fpPref={fpPref} onPlanning={handlePlanning} onChildFree={handleChildFree} onClose={() => setShowFamPopup(false)} />
      <RelInfoPopup visible={showRelInfo} onClose={handleRelInfoClose} />
    </>
  );

  if (isInTrack && trackStage && !showResult) {
    const moment = trackStage.career_moment;
    return (
      <SafeAreaView style={s.root}>
        {Header}{Nudge}
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.trackTag}><Text style={s.trackTagTxt}>{track.title}</Text></View>
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

  if (showResult && resultData) {
    return (
      <SafeAreaView style={s.root}>
        {Header}{Nudge}
        <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {resultData.isTrack && track && <View style={s.trackTag}><Text style={s.trackTagTxt}>{track.title}</Text></View>}
          <View style={s.ageBlock}><Text style={s.ageBig}>{currentAge}</Text><Text style={s.ageWord}>years old</Text></View>
          <View style={s.resultCard}>
            <View style={s.resultRow}><View style={s.resultDot} /><Text style={s.resultLabel}>{resultData.chosenLabel}</Text></View>
            <View style={s.resultDivider} />
            <Text style={s.resultConsequence}>{resultData.consequence}</Text>
            <DeltaPills deltas={resultData.deltas} />
          </View>
          <HealthInsight data={resultData.healthData} />
          <TouchableOpacity style={s.continueBtn} onPress={handleContinue} activeOpacity={0.82}>
            <Text style={s.continueBtnTxt}>Continue -></Text>
          </TouchableOpacity>
        </ScrollView>
        {Footer}{Popups}
      </SafeAreaView>
    );
  }

  if (!decision) return null;

  return (
    <SafeAreaView style={s.root}>
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

// â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BG },
  loadWrap: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  loadTxt:  { fontSize: 15, color: MUTED },

  header:     { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  headerBtns: { flexDirection: 'row', gap: 8, marginLeft: 12 },
  iconBtn:    { minWidth: 44, height: 36, borderRadius: 18, paddingHorizontal: 10, backgroundColor: WHITE, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  iconBtnTxt: { fontSize: 11, fontWeight: '700', color: PLUM },
  iconBtnRel: { backgroundColor: '#FFF0F5', borderColor: '#F48FB1' },
  iconBtnFam: { backgroundColor: '#F3E5F5', borderColor: ROSE },
  badgeDot:   { position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: 4, backgroundColor: ROSE_D, borderWidth: 1.5, borderColor: WHITE },

  nudge:    { marginHorizontal: 16, marginBottom: 6, backgroundColor: AMBER, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  nudgeTxt: { fontSize: 13, color: AMBER_D, fontWeight: '500' },

  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12 },

  ageBlock: { alignItems: 'flex-start', marginBottom: 16 },
  ageBig:   { fontSize: 52, fontWeight: '900', color: PLUM, lineHeight: 58, letterSpacing: -1 },
  ageWord:  { fontSize: 14, fontWeight: '500', color: MUTED, marginTop: -4 },

  storyCard:    { backgroundColor: WHITE, borderRadius: 20, padding: 22, marginBottom: 20, borderWidth: 1.5, borderColor: BORDER, shadowColor: ROSE, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  storyContext: { fontSize: 11, fontWeight: '700', color: ROSE_D, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  storyTxt:     { fontSize: 16, lineHeight: 26, color: PLUM },

  chooseLbl:  { fontSize: 12, fontWeight: '700', color: MUTED, letterSpacing: 0.5, marginBottom: 10 },
  choicesCol: { gap: 10, marginBottom: 16 },

  resultCard:       { backgroundColor: '#FFF0F5', borderRadius: 20, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: BORDER },
  resultRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  resultDot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: ROSE_D, marginTop: 7, flexShrink: 0 },
  resultLabel:      { fontSize: 14, fontWeight: '700', color: PLUM, flex: 1, lineHeight: 22 },
  resultDivider:    { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  resultConsequence:{ fontSize: 15, lineHeight: 24, color: PLUM },

  continueBtn:    { backgroundColor: ROSE_D, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 8 },
  continueBtnTxt: { fontSize: 16, fontWeight: '700', color: WHITE },

  insightCard:    { backgroundColor: WHITE, borderRadius: 18, padding: 20, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: ROSE_D, borderWidth: 1, borderColor: BORDER },
  insightHeadline:{ fontSize: 16, fontWeight: '700', color: PLUM, lineHeight: 24, marginBottom: 8 },
  insightBody:    { fontSize: 14, lineHeight: 22, color: PLUM, marginBottom: 12 },
  insightBox:     { backgroundColor: '#F3E5F5', borderRadius: 12, padding: 14 },
  insightBoxLabel:{ fontSize: 10, fontWeight: '700', color: PURPLE, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  insightBoxTxt:  { fontSize: 13, lineHeight: 20, color: PLUM },

  trackTag:    { backgroundColor: '#F3E5F5', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12, alignSelf: 'flex-start' },
  trackTagTxt: { fontSize: 13, fontWeight: '700', color: PLUM },

  footer:     { paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: BG },
  undoBtn:    { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  undoBtnTxt: { fontSize: 13, fontWeight: '600', color: MUTED },

  popOverlay:    { flex: 1, backgroundColor: 'rgba(61,12,78,0.2)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  popCard:       { backgroundColor: WHITE, borderRadius: 24, padding: 28, width: '100%', maxWidth: 400, alignItems: 'center' },
  popTitle:      { fontSize: 18, fontWeight: '700', color: PLUM, marginBottom: 12, textAlign: 'center' },
  popBody:       { fontSize: 14, lineHeight: 22, color: PLUM, textAlign: 'center' },
  popPrimary:    { backgroundColor: ROSE_D, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center', marginTop: 20 },
  popPrimaryTxt: { fontSize: 15, fontWeight: '700', color: WHITE },
  popSecondary:  { paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 6 },
  popSecondaryTxt:{ fontSize: 14, fontWeight: '500', color: MUTED },

  starterRoot:           { flex: 1, backgroundColor: BG },
  starterScroll:         { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  starterLea:            { width: 130, height: 130, marginBottom: 16 },
  starterEyebrow:        { fontSize: 11, fontWeight: '700', color: ROSE, letterSpacing: 2, marginBottom: 8 },
  starterTitle:          { fontSize: 30, fontWeight: '900', color: PLUM, marginBottom: 10, textAlign: 'center', letterSpacing: -0.5 },
  starterHint:           { fontSize: 14, lineHeight: 21, color: MUTED, textAlign: 'center', marginBottom: 16 },
  conditionsCard:        { width: '100%', backgroundColor: WHITE, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 14 },
  conditionsTitle:       { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 1.2, marginBottom: 8 },
  conditionsBody:        { fontSize: 13, lineHeight: 20, color: PLUM },
  exitSummaryCard:       { width: '100%', backgroundColor: '#FFF0F5', borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 14, marginBottom: 16 },
  exitSummaryTitle:      { fontSize: 12, fontWeight: '800', color: ROSE_D, marginBottom: 6 },
  exitSummaryMeta:       { fontSize: 12, color: PLUM, marginBottom: 6 },
  exitSummaryLine:       { fontSize: 12, color: PLUM, lineHeight: 18, marginTop: 2 },
  starterStops:          { flexDirection: 'row', alignItems: 'center', marginBottom: 32, width: '100%' },
  starterStop:           { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FCE4EC', borderWidth: 2, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  starterStopAge:        { fontSize: 11, fontWeight: '800', color: PLUM },
  starterLine:           { flex: 1, height: 2, backgroundColor: BORDER },
  starterBtn:            { backgroundColor: ROSE_D, borderRadius: 16, paddingVertical: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  starterBtnTxt:         { fontSize: 17, fontWeight: '700', color: WHITE },
  starterBtnSecondary:   { borderRadius: 16, paddingVertical: 14, alignItems: 'center', width: '100%', borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  starterBtnSecondaryTxt:{ fontSize: 15, fontWeight: '600', color: PLUM },

  endWrap:        { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  endLea:         { width: 110, height: 110, marginTop: 24, marginBottom: 14 },
  endTitle:       { fontSize: 20, fontWeight: '800', color: PLUM, textAlign: 'center', marginBottom: 8 },
  endSub:         { fontSize: 14, lineHeight: 22, color: MUTED, textAlign: 'center', marginBottom: 22 },
  endMetricsCard: { width: '100%', backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 22, borderWidth: 1, borderColor: BORDER },
  endMH:          { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 14 },
  endMetricRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  endMetricLabel: { fontSize: 13, fontWeight: '600', color: PLUM, width: 60 },
  endBarBg:       { flex: 1, height: 7, backgroundColor: '#EEE8F5', borderRadius: 4, overflow: 'hidden' },
  endBarFill:     { height: '100%', borderRadius: 4 },
  endMetricVal:   { fontSize: 12, fontWeight: '700', width: 28, textAlign: 'right' },
  endDropRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  endDropLabel:   { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1 },
  endRow:         { backgroundColor: WHITE, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  endRowAge:      { fontSize: 11, fontWeight: '700', color: ROSE_D, textTransform: 'capitalize', marginBottom: 4 },
  endRowTxt:      { fontSize: 13, lineHeight: 20, color: PLUM },
  endPrimary:     { backgroundColor: ROSE_D, borderRadius: 16, paddingVertical: 15, width: '100%', alignItems: 'center', marginBottom: 12 },
  endPrimaryTxt:  { fontSize: 16, fontWeight: '700', color: WHITE },
  endSecondary:   { borderRadius: 16, paddingVertical: 14, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: BORDER, backgroundColor: WHITE },
  endSecondaryTxt:{ fontSize: 15, fontWeight: '600', color: PLUM },
});



