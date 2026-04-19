import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Animated, ScrollView,
} from 'react-native';
import companies from '../data/company_details.json';

// ── Config ────────────────────────────────────────────────────────────────────
const TOGGLE_W  = 248;          // total toggle pill width
const HALF      = (TOGGLE_W - 6) / 2;   // each side (121)
const PILL_W    = HALF - 2;     // sliding pill width (119)

const FILTERS = [
  { key: 'fertility_coverage',   label: 'Fertility Support' },
  { key: 'menstrual_leave',      label: 'Menstrual Leave' },
  { key: 'women_leadership',     label: 'Leadership Programs' },
  { key: 'menopause_support',    label: 'Menopause Support' },
  { key: 'extended_maternity',   label: 'Maternity Leave' },
  { key: 'flexible_remote_work', label: 'Flexible Work' },
  { key: 'mental_health',        label: 'Mental Health' },
  { key: 'childcare_support',    label: 'Childcare' },
  { key: 'wellness',             label: 'Wellness' },
];

const TAG_META = {
  extended_maternity:   { label: 'Maternity Leave',    bg: '#FCE4EC', text: '#C2185B' },
  fertility_coverage:   { label: 'Fertility',          bg: '#F3E5F5', text: '#7B1FA2' },
  flexible_remote_work: { label: 'Flexible Work',      bg: '#E3F2FD', text: '#1565C0' },
  mental_health:        { label: 'Mental Health',      bg: '#E0F2F1', text: '#00695C' },
  menopause_support:    { label: 'Menopause',          bg: '#FFF3E0', text: '#E65100' },
  menstrual_leave:      { label: 'Menstrual Leave',    bg: '#FFE0E6', text: '#AD1457' },
  women_leadership:     { label: 'Leadership',         bg: '#E8EAF6', text: '#283593' },
  childcare_support:    { label: 'Childcare',          bg: '#FFFDE7', text: '#F9A825' },
  wellness:             { label: 'Wellness',           bg: '#F1F8E9', text: '#33691E' },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ActScreen() {
  const [region,        setRegion]        = useState('Singapore');
  const [activeFilters, setActiveFilters] = useState([]);
  const toggleAnim = useRef(new Animated.Value(0)).current;

  function switchRegion(r) {
    Animated.spring(toggleAnim, {
      toValue: r === 'Singapore' ? 0 : 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 18,
    }).start();
    setRegion(r);
    setActiveFilters([]);
  }

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }

  const pillX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 3 + PILL_W + 2],
  });

  const filtered = companies.filter(c => {
    if (!c.region.includes(region)) return false;
    if (activeFilters.length === 0) return true;
    return activeFilters.some(f => c.benefits[f]);
  });

  function headlineBenefit(company) {
    if (company.maternity_weeks) return `${company.maternity_weeks} Weeks Parental Leave`;
    // pull first notable clause
    const parts = company.highlight.split(',');
    return parts[0].trim();
  }

  const ListHeader = (
    <View>
      {/* Page header */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>SECTION 4</Text>
        <Text style={styles.title}>Planning</Text>
        <Text style={styles.subtitle}>Companies that invest in women's health</Text>
      </View>

      {/* Region toggle */}
      <View style={styles.toggleWrapper}>
        <View style={styles.toggleTrack}>
          {/* Sliding pill */}
          <Animated.View style={[styles.togglePill, { transform: [{ translateX: pillX }] }]} />
          <TouchableOpacity style={styles.toggleOption} onPress={() => switchRegion('Singapore')} activeOpacity={1}>
            <Text style={[styles.toggleLabel, region === 'Singapore' && styles.toggleLabelActive]}>
              Singapore
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleOption} onPress={() => switchRegion('Global')} activeOpacity={1}>
            <Text style={[styles.toggleLabel, region === 'Global' && styles.toggleLabelActive]}>
              Global
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Benefit filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => {
          const active = activeFilters.includes(f.key);
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => toggleFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={styles.resultCount}>{filtered.length} companies</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.companyName}>{item.name}</Text>
            <Text style={styles.bestBenefit}>{headlineBenefit(item)}</Text>
            <Text style={styles.notable} numberOfLines={2}>{item.notable}</Text>
            <View style={styles.tagRow}>
              {item.tags.slice(0, 4).map(tag => {
                const m = TAG_META[tag] ?? { label: tag, bg: '#E3F2FD', text: '#1565C0' };
                return (
                  <View key={tag} style={[styles.tag, { backgroundColor: m.bg }]}>
                    <Text style={[styles.tagText, { color: m.text }]}>{m.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 48 },

  // Header
  header:       { paddingTop: 20, marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#0288D1', letterSpacing: 1.5, marginBottom: 4 },
  title:        { fontSize: 32, fontWeight: '800', color: '#01579B', marginBottom: 4 },
  subtitle:     { fontSize: 14, color: '#546E7A' },

  // Region toggle
  toggleWrapper: { alignItems: 'center', marginBottom: 16 },
  toggleTrack: {
    width: TOGGLE_W,
    height: 42,
    backgroundColor: '#E1F5FE',
    borderRadius: 100,
    flexDirection: 'row',
    padding: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  togglePill: {
    position: 'absolute',
    top: 3,
    width: PILL_W,
    bottom: 3,
    backgroundColor: '#0288D1',
    borderRadius: 100,
    shadowColor: '#0288D1',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0288D1',
  },
  toggleLabelActive: {
    color: '#FFFFFF',
  },

  // Filter pills
  filterRow:       { paddingBottom: 4, gap: 8, paddingRight: 20 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#F0F8FF',
    borderWidth: 1.5,
    borderColor: '#B3E5FC',
  },
  filterPillActive: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  filterPillText:       { fontSize: 13, fontWeight: '600', color: '#0288D1' },
  filterPillTextActive: { color: '#FFFFFF' },

  resultCount: { fontSize: 12, color: '#90A4AE', marginTop: 12, marginBottom: 8 },

  // Company card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E1F5FE',
    shadowColor: '#0288D1',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  companyName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#01579B',
    marginBottom: 4,
  },
  bestBenefit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0288D1',
    marginBottom: 6,
  },
  notable: {
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 19,
    marginBottom: 12,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tagText: { fontSize: 11, fontWeight: '700' },
});
