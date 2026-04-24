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
const PUPPY_SIDE = require('../assets/dogs/Puppy side.png');
const STAGE_LABELS = { puppy: 'Puppy', young: 'Teen', adult: 'Adult' };

// ── Recommended cards ────────────────────────────────────────────────────────
const RECOMMENDED_CARDS_DEFAULT = [
  {
    id: 'pcos_basics',
    title: 'What Is PCOS?',
    nudge: 'Polycystic ovary syndrome affects 1 in 10 women of reproductive age. Common signs include irregular periods, acne, excess hair growth, and difficulty managing weight. Many women don\'t know they have it until they try to conceive — but early diagnosis means earlier, easier management.',
    action: 'Ask your GP for an ultrasound and hormone panel if you have irregular cycles, unexpected weight changes, or persistent acne.',
  },
  {
    id: 'cervical_screening',
    title: 'Don\'t Skip Your Smear Test',
    nudge: 'Cervical screening can detect abnormal cells before they become cancer. Women who attend routine screenings are diagnosed 3× more often at early, treatable stages. It takes under 5 minutes and could save your life.',
    action: 'If you\'re due for a smear test, book it with your GP or women\'s health clinic.',
  },
  {
    id: 'iron_deficiency',
    title: 'Are You Iron Deficient?',
    nudge: 'Iron deficiency is the most common nutritional deficiency worldwide, and women with heavy periods are especially at risk. Fatigue, brain fog, and cold hands are often chalked up to stress — but a simple blood test can confirm it.',
    action: 'Ask your GP for a full blood count including ferritin levels at your next routine visit.',
  },
  {
    id: 'cycle_mood',
    title: 'Your Cycle Affects Your Mind Too',
    nudge: 'Hormone fluctuations throughout your cycle affect mood, focus, and energy — not just your body. Tracking your cycle alongside your mood can reveal patterns and flag issues like PMDD, which affects 1 in 20 women.',
    action: 'Start logging your mood daily for one full cycle to see if patterns emerge.',
  },
];

const CERVICAL_FACT_CARD = {
  id: 'cervical_fact',
  title: 'Don\'t Skip Your Cervical Screening',
  nudge: 'Women who attend routine cervical screenings are diagnosed 3× more often at early, treatable stages — before symptoms even appear. The test takes under 5 minutes. Skipping even one round can mean a later, harder diagnosis.',
  action: 'Book a cervical screening (smear test) with your GP or women\'s health clinic if you\'re overdue.',
  source: 'NHS, WHO',
};

const RECOMMENDED_CARDS_FERTILITY = [
  {
    id: 'pcos_fertility',
    title: 'PCOS and Fertility: What to Know',
    nudge: 'PCOS is one of the most common causes of irregular ovulation. The good news: most people with PCOS can conceive — often with lifestyle changes alone. Tracking ovulation via LH strips is a practical first step.',
    action: 'Talk to your GP about fertility-focused management if you have PCOS and are planning to conceive in the next 1–2 years.',
  },
  {
    id: 'amh_testing',
    title: 'What\'s Your Ovarian Reserve?',
    nudge: 'AMH (anti-Müllerian hormone) is a blood test that gives you a snapshot of your egg supply. It helps fertility specialists plan treatment if needed — and helps you make time-informed decisions.',
    action: 'Ask your GP or a private fertility clinic about AMH testing if you\'re planning to conceive in the next few years.',
  },
  {
    id: 'fertility_window',
    title: 'Understanding Your Fertile Window',
    nudge: 'Your fertile window is typically the 5 days before ovulation plus ovulation day. Knowing when this falls gives you the best chance of timing conception naturally — and cycle length varies more than most people realise.',
    action: 'Track your cycle for 3 months to identify your ovulation pattern, or use LH predictor strips for precision.',
  },
  {
    id: 'endometriosis',
    title: 'Could It Be Endometriosis?',
    nudge: 'Endometriosis affects 1 in 10 women and can impact fertility. The average diagnosis takes 7–8 years because severe period pain is so often dismissed. Don\'t accept it as normal.',
    action: 'If your period pain significantly disrupts daily life, ask your GP for a referral to a gynaecologist.',
  },
];

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

  const hasFertilityPlanning = priorities.includes('Family planning (someday)');
  const recommendedCards = hasFertilityPlanning ? RECOMMENDED_CARDS_FERTILITY : RECOMMENDED_CARDS_DEFAULT;

  function getSimText() {
    if (priorities.includes('Family planning (someday)')) return `${leaName} found a scenario built around your family goals.`;
    if (priorities.includes('Career growth'))             return `${leaName} found a scenario built around your career goals.`;
    if (priorities.includes('Personal health'))           return `${leaName} found a scenario built around your health goals.`;
    if (priorities.includes('Relationships'))             return `${leaName} found a scenario built around your relationships.`;
    if (priorities.includes('Travel'))                    return `${leaName} found a scenario built around your life goals.`;
    return `${leaName} found a personalised scenario just for you.`;
  }

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
        </View>

        {/* ── Lea's simulation nudge ──────────────────────────────────── */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.leaSimCard}
            onPress={() => navigation.navigate('Simulation')}
            activeOpacity={0.85}
          >
            <View style={styles.leaSimBubble}>
              <Text style={styles.leaSimText}>{getSimText()}</Text>
              <Text style={styles.leaSimCta}>Start Simulation →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Health cards ───────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.factRow}>
            <Image source={PUPPY_SIDE} style={styles.factPuppy} resizeMode="contain" />
            <TouchableOpacity style={styles.factBanner} onPress={() => setSelectedNudge(CERVICAL_FACT_CARD)} activeOpacity={0.82}>
              <Text style={styles.factText}>"We aren't choosing a path; we're the ones paving it."</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={TOPIC_CARD_W + 14}
            decelerationRate="fast"
            contentContainerStyle={styles.hScrollContent}
          >
            {recommendedCards.map(n => (
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

  // Fact banner
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 0,
  },
  factPuppy: {
    width: 115,
    height: 115,
    zIndex: 1,
  },
  factBanner: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  factText: {
    fontSize: 12,
    color: PLUM,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  factCta: {
    fontSize: 12,
    color: ROSE,
    fontWeight: '700',
  },

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
