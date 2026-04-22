import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import companies from '../data/company_details.json';

const BG      = '#FAF6F0';
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

export default function CompanyExploreScreen() {
  const navigation = useNavigation();
  const [region,        setRegion]        = useState('Singapore');
  const [activeFilters, setActiveFilters] = useState([]);
  const [careerStage,   setCareerStage]   = useState('');
  const [showPrefs,     setShowPrefs]     = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }

  const filtered = companies.filter(c => {
    const regionMatch = region === 'Global' ? true : c.region.includes('Singapore');
    if (!regionMatch) return false;
    if (activeFilters.length > 0 && !activeFilters.some(f => c.benefits && c.benefits[f])) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name.toLowerCase().includes(q);
      const tagMatch  = c.tags.some(t => (TAG_LABELS[t] || t).toLowerCase().includes(q));
      return nameMatch || tagMatch;
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowPrefs(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="options-outline" size={22} color={HEADING} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Title */}
        <View style={styles.titleArea}>
          <Text style={styles.titleText}>
            <Text style={styles.titleBold}>Explore </Text>
            <Text style={styles.titleNormal}>companies that{'\n'}invest in your future</Text>
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Region filter — below title underline */}
        <View style={styles.regionRow}>
          {['Singapore', 'Global'].map(r => (
            <TouchableOpacity
              key={r}
              onPress={() => setRegion(r)}
              style={[styles.regionPill, region === r && styles.regionPillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.regionPillText, region === r && styles.regionPillTextActive]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by company or benefit…"
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Company list */}
        <View style={styles.list}>
          {filtered.length === 0 && (
            <View style={styles.emptyState}>

              <Text style={styles.emptyText}>No companies found</Text>
            </View>
          )}
          {filtered.map((company) => {
            return (
              <TouchableOpacity
                key={company.id}
                style={styles.card}
                onPress={() => navigation.navigate('CompanyDetail', { company })}
                activeOpacity={0.8}
              >
                <Text style={styles.cardName}>
                  {company.name}
                </Text>
                <View style={styles.cardTagRow}>
                  {company.tags.slice(0, 4).map(tag => (
                    <View key={tag} style={styles.cardTagPill}>
                      <Text style={styles.cardTagText}>
                        {TAG_LABELS[tag] || tag}
                      </Text>
                    </View>
                  ))}
                </View>
                {!!company.notable && (
                  <Text style={styles.cardNotable} numberOfLines={1}>
                    {company.notable}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
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
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  backArrow: { fontSize: 22, color: HEADING, fontWeight: '600' },

  // Title area — full width, no region pills
  titleArea: {
    paddingHorizontal: 20, marginBottom: 16,
  },
  titleText:    { fontSize: 22, lineHeight: 30, color: HEADING, marginBottom: 6 },
  titleBold:    { fontWeight: '800' },
  titleNormal:  { fontWeight: '400' },
  titleUnderline: { height: 2, width: '55%', backgroundColor: ROSE, borderRadius: 1 },

  // Region filter — below title underline
  regionRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, marginBottom: 14,
  },
  regionPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 100, borderWidth: 1.5, borderColor: ROSE,
    backgroundColor: 'transparent',
  },
  regionPillActive:     { backgroundColor: ROSE },
  regionPillText:       { fontSize: 12, fontWeight: '700', color: ROSE },
  regionPillTextActive: { color: '#FFFFFF' },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF0F5', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#F5DCE8',
    marginHorizontal: 16, marginBottom: 16,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: HEADING },
  searchClear: { fontSize: 13, color: MUTED, paddingLeft: 8 },

  // Company list
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    borderRadius: 16, padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: ROSE,
    shadowColor: ROSE, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  cardName:    { fontSize: 18, fontWeight: '700', marginBottom: 10, color: HEADING },
  cardTagRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  cardTagPill: { borderRadius: 100, borderWidth: 1, borderColor: '#F5DCE8', backgroundColor: '#FFF0F5', paddingHorizontal: 8, paddingVertical: 4 },
  cardTagText: { fontSize: 11, fontWeight: '600', color: PLUM },
  cardNotable: { fontSize: 12, marginTop: 2, color: MUTED },

  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyText:  { fontSize: 14, color: MUTED },

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
