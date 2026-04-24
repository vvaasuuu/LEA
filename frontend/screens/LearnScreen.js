import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, DevSettings, Platform, UIManager,
  Image, Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../utils/storage';
import { Points } from '../utils/points';
import nudges from '../data/nudges.json';
import companies from '../data/company_details.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#FFFFFF';
const PLUM   = '#3D0C4E';
const ROSE   = '#C2185B';
const ROSE_D = '#C2185B';
const MUTED  = '#B39DBC';
const BORDER = '#EDD5E4';

// ── Tag labels ───────────────────────────────────────────────────────────────
const TAG_LABELS = {
  extended_maternity:   'Maternity Leave',
  fertility_coverage:   'Fertility Support',
  menstrual_leave:      'Menstrual Leave',
  flexible_remote_work: 'Flexible Work',
  women_leadership:     'Leadership',
  mental_health:        'Mental Health',
  menopause_support:    'Menopause',
  childcare_support:    'Childcare',
  wellness:             'Wellness',
};

// ── Dog images ────────────────────────────────────────────────────────────────
const STAGE_IMAGES = {
  puppy: require('../assets/dogs/Puppy open eyes.png'),
  young: require('../assets/dogs/adult dog eyes open.jpeg'),
  adult: require('../assets/dogs/adult dog eyes open.jpeg'),
};
const STAGE_LABELS = { puppy: 'Puppy', young: 'Teen', adult: 'Adult' };

function getLifeMode(priorities = []) {
  if (priorities.includes('Career growth'))             return 'Hustle Mode';
  if (priorities.includes('Family planning (someday)')) return 'Nesting Mode';
  if (priorities.includes('Travel'))                    return 'Exploration Mode';
  if (priorities.includes('Personal health'))           return 'Self-Care Mode';
  if (priorities.includes('Relationships'))             return 'Connection Mode';
  return 'Discovery Mode';
}

// ── Health card (tappable) ────────────────────────────────────────────────────
function TopicCard({ nudge, onPress }) {
  return (
    <TouchableOpacity style={styles.topicCard} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.topicTitle} numberOfLines={2}>{nudge.title}</Text>
      <Text style={styles.topicDesc} numberOfLines={3}>{nudge.nudge}</Text>
      <Text style={styles.topicCta}>Read more →</Text>
    </TouchableOpacity>
  );
}
// ── Company card ─────────────────────────────────────────────────────────────
function CompanyCard({ company, onPress }) {
  return (
    <TouchableOpacity style={styles.companyCard} onPress={onPress} activeOpacity={0.82}>
      <Text style={styles.companyName} numberOfLines={2}>{company.name}</Text>
      <View style={styles.companyTags}>
        {company.tags.slice(0, 2).map(tag => (
          <View key={tag} style={styles.companyTag}>
            <Text style={styles.companyTagText}>{TAG_LABELS[tag] || tag}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.companyCta}>Learn more →</Text>
    </TouchableOpacity>
  );
}
// ── Nudge detail modal ────────────────────────────────────────────────────────
function NudgeModal({ nudge, onClose, navigation }) {
  if (!nudge) return null;
  return (
    <Modal
      visible={!!nudge}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalScroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.modalEyebrow}>HEALTH INFO</Text>
          <Text style={styles.modalTitle}>{nudge.title}</Text>

          <View style={styles.divider} />

          <Text style={styles.modalBody}>{nudge.nudge}</Text>

          {nudge.action ? (
            <View style={styles.actionCard}>
              <Text style={styles.actionLabel}>WHAT TO DO</Text>
              <Text style={styles.actionText}>{nudge.action}</Text>
              <TouchableOpacity style={styles.addToUpcomingBtn} onPress={() => { onClose(); navigation.navigate('Planning', { addAction: nudge.action, category: 'Health' }); }}>
                <Text style={styles.addToUpcomingText}>Add to Upcoming</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {nudge.source ? (
            <Text style={styles.sourceText}>Source: {nudge.source}</Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const navigation = useNavigation();

  const [leaName,       setLeaName]       = useState('Lea');
  const [leaStage,      setLeaStage]      = useState('puppy');
  const [points,        setPoints]        = useState(0);
  const [priorities,    setPriorities]    = useState([]);
  const [selectedNudge, setSelectedNudge] = useState(null);

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
  const recommendedNudges = nudges.filter(n => !n.conditions || n.conditions.length === 0).slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.welcomeText}>Welcome,</Text>
            <Text style={styles.tagline}>Learn. Explore. Act.</Text>
            <View style={styles.taglineUnderline} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7} style={{ padding: 4 }}>
              <Ionicons name="person-circle-outline" size={32} color={ROSE_D} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Dog Companion ──────────────────────────────────────────── */}
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

        {/* ── Lea's simulation nudge ──────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.leaSimCard}
            onPress={() => navigation.navigate('Simulation')}
            activeOpacity={0.85}
          >
            <Image
              source={STAGE_IMAGES[leaStage] || STAGE_IMAGES.puppy}
              style={styles.leaSimImage}
              resizeMode="contain"
            />
            <View style={styles.leaSimBubble}>
              <Text style={styles.leaSimText}>
                I have a personalised scenario for you — want to try it?
              </Text>
              <Text style={styles.leaSimCta}>Start Simulation →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Health cards ───────────────────────────────────────────── */}
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
                nudge={n}
                onPress={() => setSelectedNudge(n)}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Career section ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={COMPANY_CARD_W + 14}
            decelerationRate="fast"
            contentContainerStyle={styles.hScrollContent}
          >
            {companies.slice(0, 3).map(c => (
              <CompanyCard
                key={c.id}
                company={c}
                onPress={() => navigation.navigate('CompanyDetail', { company: c })}
              />
            ))}
            <TouchableOpacity onPress={() => navigation.navigate('CompanyExplore')} style={styles.exploreMoreCard}>
              <Text style={styles.exploreMoreText}>Explore more →</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Dev controls ───────────────────────────────────────────── */}
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

      {/* ── Health info modal ──────────────────────────────────────────── */}
      <NudgeModal nudge={selectedNudge} onClose={() => setSelectedNudge(null)} navigation={navigation} />

    </SafeAreaView>
  );
}

// ── Dimensions ────────────────────────────────────────────────────────────────
const TOPIC_CARD_W  = 220;
const COMPANY_CARD_W = 160;

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 56 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 8,
  },
  headerLeft:       { flex: 1 },
  welcomeText:      { fontSize: 30, fontWeight: '800', color: PLUM, letterSpacing: -0.5 },
  tagline:          { fontSize: 13, fontWeight: '600', color: ROSE, marginTop: 2 },
  taglineUnderline: { width: 110, height: 2, backgroundColor: ROSE, borderRadius: 1, marginTop: 4 },

  // Section
  section:      { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: PLUM, marginBottom: 12 },

  // Dog widget
  dogSection: {
    alignItems: 'center', marginBottom: 24,
    backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 20,
    paddingVertical: 22, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  dogImage:      { width: 130, height: 130 },
  dogName:       { fontSize: 20, fontWeight: '800', color: PLUM, marginTop: 10 },
  dogStageLabel: { fontSize: 13, color: MUTED, fontWeight: '500', marginTop: 3 },
  lifeModeTag: {
    marginTop: 10,
    backgroundColor: '#F3E5F5', borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 5,
    borderWidth: 1, borderColor: '#CE93D8',
  },
  lifeModeText: { fontSize: 12, fontWeight: '700', color: '#6A1B9A' },

  // Horizontal scroll
  hScrollContent: { paddingLeft: 2, paddingRight: 20, gap: 14 },

  // Topic / health cards
  topicCard: {
    width: TOPIC_CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: BORDER,
    shadowColor: ROSE, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2,
    justifyContent: 'space-between',
    minHeight: 150,
  },
  topicTitle: { fontSize: 14, fontWeight: '700', color: PLUM, marginBottom: 6, lineHeight: 20 },
  topicDesc:  { fontSize: 12, color: '#546E7A', lineHeight: 18, marginBottom: 12, flex: 1 },
  topicCta:   { fontSize: 12, color: ROSE_D, fontWeight: '600' },

  // Company cards
  companyCard: {
    width: COMPANY_CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F5DCE8',
    shadowColor: ROSE, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    justifyContent: 'space-between',
    minHeight: 100,
  },
  companyName: { fontSize: 14, fontWeight: '700', color: PLUM, marginBottom: 6, lineHeight: 18 },
  companyTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 8 },
  companyTag: {
    backgroundColor: '#FCE4EC', borderRadius: 100,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  companyTagText: { fontSize: 10, color: ROSE, fontWeight: '600' },
  companyCta: { fontSize: 12, color: ROSE_D, fontWeight: '600' },
  exploreMoreCard: {
    width: COMPANY_CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#FFFFFF',
    shadowColor: ROSE, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    justifyContent: 'center', alignItems: 'center',
    minHeight: 100,
  },
  exploreMoreText: { fontSize: 14, color: ROSE, fontWeight: '600' },

  // Lea simulation nudge card
  leaSimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F5',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: BORDER,
    padding: 16,
    gap: 14,
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  leaSimImage: { width: 64, height: 64 },
  leaSimBubble: { flex: 1 },
  leaSimText: {
    fontSize: 14, fontWeight: '600', color: PLUM, lineHeight: 21, marginBottom: 8,
  },
  leaSimCta: {
    fontSize: 13, fontWeight: '700', color: ROSE,
  },

  // Dev controls
  devRow:     { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8 },
  devBtn:     { backgroundColor: '#FCE4EC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  devBtnText: { fontWeight: '700', fontSize: 12, color: ROSE_D },
  resetBtn:   { alignSelf: 'center', marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 },
  resetBtnText: { fontSize: 12, color: MUTED, fontWeight: '600' },

  // Modal
  modalSafe: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, alignItems: 'flex-end',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#FFF0F5', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#546E7A', fontWeight: '700' },
  modalScroll:  { paddingHorizontal: 24, paddingBottom: 40 },
  modalEyebrow: {
    fontSize: 11, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24, fontWeight: '800', color: PLUM, lineHeight: 32, marginBottom: 4,
  },
  divider: { height: 1, backgroundColor: BORDER, marginVertical: 16 },
  modalBody: { fontSize: 15, color: '#263238', lineHeight: 25, marginBottom: 20 },
  actionCard: {
    backgroundColor: '#FFF0F5',
    borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderLeftColor: ROSE,
    marginBottom: 16,
  },
  actionLabel: {
    fontSize: 10, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6,
  },
  actionText: { fontSize: 14, color: PLUM, lineHeight: 22 },
  addToUpcomingBtn: {
    backgroundColor: ROSE,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  addToUpcomingText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  sourceText: { fontSize: 12, color: MUTED, fontStyle: 'italic' },
});
