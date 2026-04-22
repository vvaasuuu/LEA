import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, DevSettings, Platform, UIManager,
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
// need to edit -kavya
function getLifeMode(priorities = []) {
  if (priorities.includes('Career growth'))          return 'Hustle Mode';
  if (priorities.includes('Family planning (someday)')) return 'Nesting Mode';
  if (priorities.includes('Travel'))                 return 'Exploration Mode';
  if (priorities.includes('Personal health'))        return 'Self-Care Mode';
  if (priorities.includes('Relationships'))          return 'Connection Mode';
  return 'Discovery Mode';
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


function ActCard({ emoji, title, borderColor }) {
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
  const [priorities, setPriorities] = useState([]);

  useEffect(() => {
    async function load() {
      const n  = await Storage.get(Storage.KEYS.LEA_NAME);
      const s  = await Storage.get(Storage.KEYS.LEA_STAGE);
      const p  = await Storage.get(Storage.KEYS.USER_POINTS);
      const pr = await Storage.get(Storage.KEYS.USER_PRIORITIES);
      if (n)          setLeaName(n);
      if (s)          setLeaStage(s);
      if (p !== null) setPoints(p);
      if (pr)         setPriorities(pr);
    }
    load();
  }, []);

  const lifeMode = getLifeMode(priorities);


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
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: PLUM, marginBottom: 2 },
  arrowLabel:   { fontWeight: '400', color: ROSE },



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
