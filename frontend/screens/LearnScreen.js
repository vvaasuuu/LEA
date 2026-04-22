import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Animated, DevSettings, Platform, UIManager,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../utils/storage';
import { Points } from '../utils/points';
import nudges from '../data/nudges.json';
import weeklyActions from '../data/weekly_actions.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Palette ───────────────────────────────────────────────────────────────────
const BG      = '#FAF6F0';
const PLUM    = '#3D0C4E';
const ROSE    = '#C2748A';
const ROSE_D  = '#C2185B';
const MUTED   = '#B39DBC';
const WHITE   = '#FFFFFF';

// ── Dog images ────────────────────────────────────────────────────────────────
const STAGE_IMAGES = {
  puppy: require('../assets/dogs/Puppy open eyes.png'),
  young: require('../assets/dogs/teen1 eyes open.png'),
  adult: require('../assets/dogs/adult dog eyes open tail up.png'),
};
const STAGE_LABELS = { puppy: 'Puppy', young: 'Teen', adult: 'Adult' };

// ── Derive Life Mode from priorities ─────────────────────────────────────────
function getLifeMode(priorities = []) {
  if (priorities.includes('Career growth'))          return 'Hustle Mode';
  if (priorities.includes('Family planning (someday)')) return 'Nesting Mode';
  if (priorities.includes('Travel'))                 return 'Exploration Mode';
  if (priorities.includes('Personal health'))        return 'Self-Care Mode';
  if (priorities.includes('Relationships'))          return 'Connection Mode';
  return 'Discovery Mode';
}

// ── Power Level scores ────────────────────────────────────────────────────────
function careerScore(lifeStage, points) {
  const base = lifeStage === 'Mid-career' ? 72 : lifeStage === 'Early career' ? 54 : 30;
  const bonus = Math.min(points / 10, 20);
  return Math.min(Math.round(base + bonus), 100);
}

function healthScore(conditions = []) {
  if (!conditions.length || conditions.includes('None') || conditions.includes('Prefer not to say')) return 82;
  return Math.max(82 - conditions.filter(c => c !== 'None' && c !== 'Prefer not to say').length * 14, 38);
}

function flexScore(points) {
  return Math.min(Math.round(30 + points * 0.12), 95);
}

function scoreStatus(score) {
  if (score >= 70) return { label: 'Strong', color: '#388E3C' };
  if (score >= 45) return { label: 'Building', color: '#F57C00' };
  return { label: 'Watch', color: '#C2748A' };
}

// ── Horizon card copy ─────────────────────────────────────────────────────────
function horizonCopy(lifeStage, priorities = []) {
  const hasCareer  = priorities.includes('Career growth');
  const hasFamily  = priorities.includes('Family planning (someday)');
  const hasHealth  = priorities.includes('Personal health');
  if (hasCareer && hasFamily) {
    const yrs = lifeStage === 'Student' ? 5 : lifeStage === 'Early career' ? 3 : 2;
    return {
      body: `In ${yrs} years, your goal of 'Senior Role' intersects with your 'Optimal Fertility Window.' Explore how policies can bridge this gap →`,
      hasIntersection: true,
    };
  }
  if (hasCareer) {
    return {
      body: `Your career momentum is picking up. Now's the time to map out how your workplace benefits align with your bigger life goals →`,
      hasIntersection: true,
    };
  }
  if (hasHealth) {
    return {
      body: `Small health investments now compound over time. See how your current habits map against your future milestones →`,
      hasIntersection: true,
    };
  }
  return {
    body: `Build your personal timeline — see where your life goals and health milestones are heading →`,
    hasIntersection: false,
  };
}

// ── Circular progress ring ────────────────────────────────────────────────────
function RingProgress({ size = 72, strokeWidth = 7, progress = 0, color = ROSE_D, children }) {
  const half = size / 2;
  const p    = Math.min(1, Math.max(0, progress));
  const deg  = p * 360;

  // Right half (0–180°): borderTop + borderRight rotate from -90 to +90
  const rightRot = Math.min(deg, 180) - 90;
  // Left half (180–360°): borderBottom + borderLeft rotate from +90 to -90
  const leftRot  = 90 - Math.max(deg - 180, 0);

  return (
    <View style={{ width: size, height: size }}>
      {/* Background ring */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: '#EEE8F5',
      }} />

      {/* Right half fill */}
      <View style={{ position: 'absolute', left: half, top: 0, width: half, height: size, overflow: 'hidden' }}>
        <View style={{
          position: 'absolute', left: -half, top: 0,
          width: size, height: size, borderRadius: half, borderWidth: strokeWidth,
          borderTopColor: color, borderRightColor: color,
          borderBottomColor: 'transparent', borderLeftColor: 'transparent',
          transform: [{ rotate: `${rightRot}deg` }],
        }} />
      </View>

      {/* Left half fill (only needed once > 50%) */}
      {p > 0.5 && (
        <View style={{ position: 'absolute', left: 0, top: 0, width: half, height: size, overflow: 'hidden' }}>
          <View style={{
            position: 'absolute', left: 0, top: 0,
            width: size, height: size, borderRadius: half, borderWidth: strokeWidth,
            borderTopColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: color, borderLeftColor: color,
            transform: [{ rotate: `${leftRot}deg` }],
          }} />
        </View>
      )}

      {/* Inner white fill to make it a ring */}
      <View style={{
        position: 'absolute',
        top: strokeWidth, left: strokeWidth,
        width: size - strokeWidth * 2, height: size - strokeWidth * 2,
        borderRadius: (size - strokeWidth * 2) / 2,
        backgroundColor: BG,
      }} />

      {/* Centre content */}
      <View style={{ position: 'absolute', width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ── Animated ring wrapper ─────────────────────────────────────────────────────
function AnimatedRing({ targetProgress, delay, size, strokeWidth, color, icon, label, status, statusColor, onPress }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: targetProgress,
      duration: 900,
      delay,
      useNativeDriver: false,
    }).start();
  }, [targetProgress]);

  const [displayProgress, setDisplayProgress] = useState(0);
  useEffect(() => {
    const id = anim.addListener(({ value }) => setDisplayProgress(value));
    return () => anim.removeListener(id);
  }, []);

  return (
    <TouchableOpacity style={styles.ringWrapper} onPress={onPress} activeOpacity={0.8}>
      <RingProgress size={size} strokeWidth={strokeWidth} progress={displayProgress} color={color}>
        <Text style={styles.ringIcon}>{icon}</Text>
      </RingProgress>
      <Text style={styles.ringLabel}>{label}</Text>
      <Text style={[styles.ringStatus, { color: statusColor }]}>{status}</Text>
    </TouchableOpacity>
  );
}

// ── Horizon card shimmer ──────────────────────────────────────────────────────
function HorizonCard({ body, onPress }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={styles.horizonOuter}>
      <Animated.View style={[styles.horizonCard, { opacity: shimmerOpacity }]}>
        <Text style={styles.horizonEyebrow}>WHAT'S ON THE HORIZON</Text>
        <Text style={styles.horizonBody}>{body}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Recommended topic card ────────────────────────────────────────────────────
function TopicCard({ title, desc, onPress }) {
  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.topicTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.topicDesc} numberOfLines={2}>{desc}</Text>
      <Text style={styles.topicCta}>Learn more →</Text>
    </TouchableOpacity>
  );
}

// ── Act card (weekly action) ──────────────────────────────────────────────────
function ActCard({ emoji, title, accentColor, borderColor }) {
  return (
    <View style={[styles.actCard, { borderColor }]}>
      <Text style={styles.actEmoji}>{emoji}</Text>
      <Text style={styles.actTitle} numberOfLines={3}>{title}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const navigation = useNavigation();

  const [leaName,    setLeaName]    = useState('Lea');
  const [leaStage,   setLeaStage]   = useState('puppy');
  const [points,     setPoints]     = useState(0);
  const [lifeStage,  setLifeStage]  = useState(null);
  const [conditions, setConditions] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [leaKey,     setLeaKey]     = useState(0);

  useEffect(() => {
    async function load() {
      const n  = await Storage.get(Storage.KEYS.LEA_NAME);
      const s  = await Storage.get(Storage.KEYS.LEA_STAGE);
      const p  = await Storage.get(Storage.KEYS.USER_POINTS);
      const ls = await Storage.get(Storage.KEYS.USER_LIFE_STAGE);
      const c  = await Storage.get(Storage.KEYS.USER_CONDITIONS);
      const pr = await Storage.get(Storage.KEYS.USER_PRIORITIES);
      if (n)          setLeaName(n);
      if (s)          setLeaStage(s);
      if (p !== null) setPoints(p);
      if (ls)         setLifeStage(ls);
      if (c)          setConditions(c);
      if (pr)         setPriorities(pr);
    }
    load();
  }, []);

  // Derived scores
  const cScore = careerScore(lifeStage, points);
  const hScore = healthScore(conditions);
  const fScore = flexScore(points);

  const cStatus = scoreStatus(cScore);
  const hStatus = scoreStatus(hScore);
  const fStatus = scoreStatus(fScore);

  const lifeMode = getLifeMode(priorities);
  const { body: horizonBody } = horizonCopy(lifeStage, priorities);

  // Pick 3 nudges (first 3 general ones)
  const recommendedNudges = nudges.filter(n => !n.conditions || n.conditions.length === 0).slice(0, 3);

  // Pick act cards: prefer priority category, else all
  const actCategory = priorities.includes('Career growth') ? 'career'
    : priorities.includes('Personal health') ? 'health'
    : 'balance';
  const actCards = (weeklyActions[actCategory]?.actions || []).slice(0, 5);
  const actMeta  = weeklyActions[actCategory];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── SECTION 1: Welcome Header ──────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.tagline}>Learn. Explore. Act.</Text>
            <View style={styles.taglineUnderline} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 40, marginTop: -4 }}>🌸</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7} style={{ padding: 4 }}>
              <Ionicons name="person-circle-outline" size={32} color={ROSE_D} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SECTION 2: What's on the Horizon ──────────────────────── */}
        <HorizonCard
          body={horizonBody}
          onPress={() => navigation.navigate('Planning')}
        />

        {/* ── SECTION 3: Power Levels ────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Power Levels</Text>
          <Text style={styles.sectionSub}>Your three core dimensions</Text>

          <View style={styles.ringsRow}>
            <AnimatedRing
              targetProgress={cScore / 100}
              delay={0}
              size={80}
              strokeWidth={8}
              color="#E65100"
              icon="🚀"
              label="Career"
              status={cStatus.label}
              statusColor={cStatus.color}
              onPress={() => navigation.navigate('Planning')}
            />
            <AnimatedRing
              targetProgress={hScore / 100}
              delay={150}
              size={80}
              strokeWidth={8}
              color={ROSE_D}
              icon="🌿"
              label="Health"
              status={hStatus.label}
              statusColor={hStatus.color}
              onPress={() => navigation.navigate('Explore')}
            />
            <AnimatedRing
              targetProgress={fScore / 100}
              delay={300}
              size={80}
              strokeWidth={8}
              color="#6A1B9A"
              icon="∞"
              label="Flex"
              status={fStatus.label}
              statusColor={fStatus.color}
              onPress={() => navigation.navigate('Planning')}
            />
          </View>
        </View>

        {/* ── SECTION 4: Dog Companion ───────────────────────────────── */}
        <View style={styles.dogSection}>
          <Image
            source={STAGE_IMAGES[leaStage] || STAGE_IMAGES.puppy}
            style={styles.dogImage}
            resizeMode="contain"
          />
          <Text style={styles.dogName}>{leaName}</Text>
          <Text style={styles.dogStageLabel}>{STAGE_LABELS[leaStage] || 'Puppy'}</Text>
          <View style={styles.lifeModeTag}>
            <Text style={styles.lifeModeText}>{lifeMode}</Text>
          </View>
        </View>

        {/* ── SECTION 5a: Recommended for You ───────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TOPIC_CARD_W + 14}
            decelerationRate="fast"
            contentContainerStyle={styles.hScrollContent}
          >
            {recommendedNudges.map(n => (
              <TopicCard
                key={n.id}
                title={n.title}
                desc={n.nudge?.slice(0, 80) + '…'}
                onPress={() => navigation.navigate('Explore')}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── SECTION 5b: Personalised Act Cards ────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalised act cards <Text style={styles.arrowLabel}>→</Text></Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ACT_CARD_W + 12}
            decelerationRate="fast"
            contentContainerStyle={styles.hScrollContent}
          >
            {actCards.map(a => (
              <ActCard
                key={a.id}
                emoji={a.emoji}
                title={a.title}
                accentColor={actMeta?.accentColor || ROSE}
                borderColor={actMeta?.borderColor || '#F5DCE8'}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Dev controls (unchanged) ───────────────────────────────── */}
        <View style={styles.devRow}>
          {[
            { label: '🐶 Puppy', pts: 10,  stage: 'puppy' },
            { label: '🐕 Teen',  pts: 100, stage: 'young' },
            { label: '🦮 Adult', pts: 600, stage: 'adult' },
          ].map(({ label, pts, stage }) => (
            <TouchableOpacity
              key={label}
              style={styles.devBtn}
              onPress={async () => {
                await Storage.set(Storage.KEYS.USER_POINTS, pts);
                await Points.updateLeaStage(pts);
                await Storage.set(Storage.KEYS.LEA_STAGE, stage);
                setPoints(pts);
                setLeaStage(stage);
                setLeaKey(k => k + 1);
              }}
            >
              <Text style={styles.devBtnText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={async () => { await Storage.clearAll(); DevSettings.reload(); }}
        >
          <Text style={styles.resetBtnText}>↺ Reset onboarding</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Dimensions ────────────────────────────────────────────────────────────────
const TOPIC_CARD_W = 220;
const ACT_CARD_W   = 160;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 56 },

  // Section 1 — Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8,
  },
  headerLeft:       { flex: 1 },
  welcomeText:      { fontSize: 30, fontWeight: '800', color: PLUM, letterSpacing: -0.5 },
  tagline:          { fontSize: 13, fontWeight: '600', color: ROSE, marginTop: 2 },
  taglineUnderline: { width: 110, height: 2, backgroundColor: ROSE, borderRadius: 1, marginTop: 4 },

  // Section 2 — Horizon card
  horizonOuter: { marginHorizontal: 20, marginBottom: 22 },
  horizonCard: {
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E8C9D8',
    shadowColor: ROSE,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  horizonEyebrow: {
    fontSize: 10, fontWeight: '800', color: ROSE, letterSpacing: 1.8,
    marginBottom: 8,
  },
  horizonBody: {
    fontSize: 14, lineHeight: 21, color: PLUM, fontWeight: '500',
  },

  // Section 3 — Power Levels
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: PLUM, marginBottom: 2 },
  sectionSub:   { fontSize: 12, color: MUTED, marginBottom: 16 },
  arrowLabel:   { fontWeight: '400', color: ROSE },

  ringsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start',
    backgroundColor: WHITE, borderRadius: 20, paddingVertical: 22,
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  ringWrapper:  { alignItems: 'center', gap: 8 },
  ringIcon:     { fontSize: 22 },
  ringLabel:    { fontSize: 12, fontWeight: '700', color: PLUM, marginTop: 8 },
  ringStatus:   { fontSize: 11, fontWeight: '600', marginTop: 2 },

  // Section 4 — Dog widget
  dogSection: {
    alignItems: 'center', marginBottom: 24,
    backgroundColor: WHITE, marginHorizontal: 20, borderRadius: 20,
    paddingVertical: 22, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  dogImage:      { width: 130, height: 130 },
  dogName:       { fontSize: 20, fontWeight: '800', color: PLUM, marginTop: 10 },
  dogStageLabel: { fontSize: 13, color: MUTED, fontWeight: '500', marginTop: 3 },
  lifeModeTag: {
    marginTop: 10,
    backgroundColor: '#F3E5F5',
    borderRadius: 100, paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: '#CE93D8',
  },
  lifeModeText: { fontSize: 12, fontWeight: '700', color: '#6A1B9A' },

  // Horizontal scroll
  hScrollContent: { paddingLeft: 2, paddingRight: 20, gap: 14 },

  // Topic cards
  topicCard: {
    width: TOPIC_CARD_W,
    backgroundColor: WHITE,
    borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#F5DCE8',
    shadowColor: ROSE, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
    justifyContent: 'space-between',
  },
  topicTitle: { fontSize: 14, fontWeight: '700', color: PLUM, marginBottom: 6, lineHeight: 20 },
  topicDesc:  { fontSize: 12, color: '#546E7A', lineHeight: 18, marginBottom: 12, flex: 1 },
  topicCta:   { fontSize: 12, color: ROSE_D, fontWeight: '600', fontStyle: 'italic' },

  // Act cards
  actCard: {
    width: ACT_CARD_W,
    backgroundColor: WHITE,
    borderRadius: 18, padding: 16,
    borderWidth: 1.5,
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    minHeight: 120, justifyContent: 'flex-start',
  },
  actEmoji: { fontSize: 26, marginBottom: 10 },
  actTitle: { fontSize: 13, fontWeight: '600', color: PLUM, lineHeight: 19 },

  // Dev controls
  devRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8 },
  devBtn: { backgroundColor: '#FCE4EC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  devBtnText: { fontWeight: '700', fontSize: 12, color: ROSE_D },
  resetBtn: { alignSelf: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
  resetBtnText: { fontSize: 12, color: MUTED, fontWeight: '600' },
});
