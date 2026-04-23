import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, Image, Dimensions, Linking,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const BG1     = require('../assets/Background 1.png');
const BG      = '#FFFFFF';
const PLUM    = '#6A1B9A';
const ROSE    = '#C2185B';
const MUTED   = '#B39DBC';
const HEADING = '#3D0C4E';

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

const TAG_COLORS = {
  extended_maternity:   { bg: '#F5DCE8', text: ROSE },
  fertility_coverage:   { bg: '#EDE7F6', text: PLUM },
  menstrual_leave:      { bg: '#FCE4EC', text: ROSE },
  flexible_remote_work: { bg: '#EDE7F6', text: PLUM },
  women_leadership:     { bg: '#EDE7F6', text: PLUM },
  mental_health:        { bg: '#FCE4EC', text: ROSE },
  menopause_support:    { bg: '#EDE7F6', text: PLUM },
  childcare_support:    { bg: '#F5DCE8', text: ROSE },
  wellness:             { bg: '#FCE4EC', text: ROSE },
};

const BENEFIT_FILTERS = [
  { key: 'fertility_coverage',   label: 'Fertility Support' },
  { key: 'menstrual_leave',      label: 'Menstrual Leave' },
  { key: 'flexible_remote_work', label: 'Flexible Work' },
  { key: 'mental_health',        label: 'Mental Health Support' },
  { key: 'women_leadership',     label: 'Leadership Programmes' },
  { key: 'extended_maternity',   label: 'Maternity Leave' },
  { key: 'wellness',             label: 'Wellness Subsidy' },
];

const CAREER_STAGES = [
  { key: 'student', label: 'Student / Fresh Graduate' },
  { key: 'early',   label: 'Early Career (1–3 years)' },
  { key: 'mid',     label: 'Mid Career (3–7 years)' },
];

export default function CompanyDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { company } = route.params;

  const [showPrefs,     setShowPrefs]     = useState(false);
  const [region,        setRegion]        = useState('Singapore');
  const [activeFilters, setActiveFilters] = useState([]);
  const [careerStage,   setCareerStage]   = useState('');

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(company.name + ' employee benefits Singapore')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: '#FFF0F5' }]}>
          <View style={styles.heroHeader}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.heroIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.heroBackArrow}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowPrefs(true)}
              style={styles.heroIconBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="options-outline" size={22} color={HEADING} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <View style={styles.content}>

          {/* Company name */}
          <Text style={styles.companyName}>{company.name}</Text>

          {/* Tag pills */}
          <View style={styles.tagRow}>
            {company.tags.map(tag => {
              const tc = TAG_COLORS[tag] || { bg: '#F0E4F8', text: PLUM };
              return (
                <View key={tag} style={[styles.tagPill, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.tagPillText, { color: tc.text }]}>
                    {TAG_LABELS[tag] || tag}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Tagline / quote */}
          <Text style={styles.tagline}>
            "{company.notable}"
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {company.highlight}
          </Text>

          <View style={styles.divider} />

          {/* Learn more */}
          <Text style={styles.learnMoreLabel}>
            Learn more about {company.name}'s work and culture :
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(searchUrl)} activeOpacity={0.75}>
            <Text style={styles.learnMoreLink}>View company culture & benefits →</Text>
          </TouchableOpacity>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            Note: The above information is based on reviews available online and is subjective. Details may change over time.
          </Text>
        </View>
      </ScrollView>

      {/* Preferences bottom sheet */}
      <Modal
        visible={showPrefs}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrefs(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setShowPrefs(false)} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your Preferences</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.prefLabel}>REGION</Text>
              <View style={styles.prefToggleRow}>
                {['Singapore', 'Global'].map(r => {
                  const active = r === region;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.prefToggleBtn, active && styles.prefToggleBtnActive]}
                      onPress={() => setRegion(r)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefToggleBtnText, active && styles.prefToggleBtnTextActive]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.prefLabel}>BENEFITS</Text>
              <View style={styles.prefChipRow}>
                {BENEFIT_FILTERS.map(f => {
                  const active = activeFilters.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.prefChip, active && styles.prefChipActive]}
                      onPress={() => toggleFilter(f.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.prefLabel}>CAREER STAGE</Text>
              <View style={styles.prefChipRow}>
                {CAREER_STAGES.map(s => {
                  const active = careerStage === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.prefChip, active && styles.prefChipActive]}
                      onPress={() => setCareerStage(prev => prev === s.key ? '' : s.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowPrefs(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Hero
  hero: {
    width: '100%',
    height: 300,
    justifyContent: 'flex-start',
  },
  heroHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16,
  },
  heroIconBtn:    { padding: 6 },
  heroBackArrow:  { fontSize: 22, color: HEADING, fontWeight: '600' },

  // Content
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 0,
    padding: 24,
    paddingBottom: 48,
  },
  companyName: {
    fontSize: 26, fontWeight: '800', color: HEADING,
    marginBottom: 12,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
  tagPill: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 5 },
  tagPillText: { fontSize: 12, fontWeight: '700' },

  tagline: {
    fontSize: 18, fontWeight: '700', color: HEADING,
    textAlign: 'center', fontStyle: 'italic',
    lineHeight: 26, marginBottom: 18, paddingHorizontal: 8,
  },
  description: {
    fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: '#EDD5E4', marginBottom: 20 },

  learnMoreLabel: { fontSize: 14, color: HEADING, marginBottom: 6 },
  learnMoreLink:  { fontSize: 14, color: ROSE, fontWeight: '600', marginBottom: 24 },

  disclaimer: {
    fontSize: 12, fontStyle: 'italic', color: MUTED, lineHeight: 18,
    borderTopWidth: 1, borderTopColor: '#F0D0E0', paddingTop: 16,
  },

  // Modals
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '72%',
  },
  sheetTall:   { maxHeight: '85%' },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 18, fontWeight: '700', color: HEADING, marginBottom: 14 },

  prefLabel:    { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  prefToggleRow:{ flexDirection: 'row', gap: 8, marginBottom: 4 },
  prefToggleBtn:{
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: ROSE, alignItems: 'center', backgroundColor: '#FDF0F0',
  },
  prefToggleBtnActive:    { backgroundColor: ROSE, borderColor: ROSE },
  prefToggleBtnText:      { fontSize: 14, fontWeight: '600', color: ROSE },
  prefToggleBtnTextActive:{ color: '#FFFFFF' },
  prefChipRow:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100, backgroundColor: '#F5F5F5',
  },
  prefChipActive:     { backgroundColor: '#EDE7F6' },
  prefChipText:       { fontSize: 13, color: MUTED, fontWeight: '500' },
  prefChipTextActive: { color: PLUM, fontWeight: '600' },
  applyBtn: {
    backgroundColor: ROSE, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
