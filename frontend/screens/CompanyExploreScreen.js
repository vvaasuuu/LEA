import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import companies from '../data/company_details.json';
import { Storage } from '../utils/storage';
import {
  CAREER_STAGES,
  DEFAULT_COMPANY_PREFERENCES,
  TAG_LABELS,
  filterCompanies,
  getCompanyPreferenceCount,
  normalizeCompanyPreferences,
} from '../utils/companyPreferences';

const BG = '#FFFFFF';
const PLUM = '#6A1B9A';
const ROSE = '#C2185B';
const MUTED = '#B39DBC';
const HEADING = '#3D0C4E';

export default function CompanyExploreScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [preferences, setPreferences] = useState(DEFAULT_COMPANY_PREFERENCES);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    Storage.get(Storage.KEYS.COMPANY_PREFERENCES).then((saved) => {
      if (!isMounted) return;
      setPreferences(normalizeCompanyPreferences(saved || DEFAULT_COMPANY_PREFERENCES));
    });

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  const filtered = filterCompanies(companies, preferences, searchQuery);
  const activePreferenceCount = getCompanyPreferenceCount(preferences);
  const selectedCareerStage = CAREER_STAGES.find((stage) => stage.key === preferences.careerStage);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back-outline" size={22} color={HEADING} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleArea}>
          <Text style={styles.titleText}>
            <Text style={styles.titleBold}>Explore </Text>
            <Text style={styles.titleNormal}>companies that{'\n'}invest in your future</Text>
          </Text>
          <View style={styles.titleUnderline} />
        </View>

        <View style={styles.preferenceSummaryRow}>
          <View style={[styles.summaryPill, styles.summaryPillActive]}>
            <Text style={[styles.summaryPillText, styles.summaryPillTextActive]}>
              {preferences.region}
            </Text>
          </View>
          {preferences.activeFilters.length > 0 ? (
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>
                {preferences.activeFilters.length} preference{preferences.activeFilters.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : null}
          {selectedCareerStage ? (
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>{selectedCareerStage.label}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={MUTED} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Explore companies..."
            placeholderTextColor={MUTED}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={16} color={MUTED} />
            </TouchableOpacity>
          ) : null}
          <View style={styles.searchDivider} />
          <TouchableOpacity
            onPress={() => navigation.navigate('CompanyFilter', { preferences })}
            style={styles.filterBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="options-outline" size={18} color={HEADING} />
            {activePreferenceCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activePreferenceCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No companies match those preferences yet.</Text>
            </View>
          ) : null}
          {filtered.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={styles.card}
              onPress={() => navigation.navigate('CompanyDetail', { company })}
              activeOpacity={0.82}
            >
              <Text style={styles.cardName}>{company.name}</Text>
              <View style={styles.cardTagRow}>
                {company.tags.slice(0, 4).map((tag) => (
                  <View key={tag} style={styles.cardTagPill}>
                    <Text style={styles.cardTagText}>{TAG_LABELS[tag] || tag}</Text>
                  </View>
                ))}
              </View>
              {company.notable ? (
                <Text style={styles.cardNotable} numberOfLines={1}>
                  {company.notable}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleArea: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleText: {
    fontSize: 22,
    lineHeight: 30,
    color: HEADING,
    marginBottom: 6,
  },
  titleBold: { fontWeight: '800' },
  titleNormal: { fontWeight: '400' },
  titleUnderline: {
    height: 2,
    width: '55%',
    backgroundColor: ROSE,
    borderRadius: 1,
  },
  preferenceSummaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F0DCE8',
    backgroundColor: '#FFF5FA',
  },
  summaryPillActive: {
    backgroundColor: ROSE,
    borderColor: ROSE,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: PLUM,
  },
  summaryPillTextActive: {
    color: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F5DCE8',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: HEADING },
  searchDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#F0DCE8',
    marginLeft: 10,
    marginRight: 2,
  },
  filterBtn: {
    marginLeft: 6,
    paddingVertical: 2,
    paddingLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: ROSE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  list: { paddingHorizontal: 16, gap: 10 },
  card: {
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F5DCE8',
    shadowColor: ROSE,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: HEADING,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  cardTagPill: {
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#F5DCE8',
    backgroundColor: '#FFF0F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: PLUM,
  },
  cardNotable: {
    fontSize: 12,
    marginTop: 2,
    color: MUTED,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },
});
