import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../utils/storage';
import {
  BENEFIT_FILTERS,
  CAREER_STAGES,
  DEFAULT_COMPANY_PREFERENCES,
  normalizeCompanyPreferences,
} from '../utils/companyPreferences';

const BG = '#FFFFFF';
const PLUM = '#6A1B9A';
const ROSE = '#C2185B';
const HEADING = '#3D0C4E';

export default function CompanyFilterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const [preferences, setPreferences] = useState(
    normalizeCompanyPreferences(route.params?.preferences || DEFAULT_COMPANY_PREFERENCES)
  );

  useEffect(() => {
    let isMounted = true;

    Storage.get(Storage.KEYS.COMPANY_PREFERENCES).then((saved) => {
      if (!isMounted || route.params?.preferences) return;
      setPreferences(normalizeCompanyPreferences(saved || DEFAULT_COMPANY_PREFERENCES));
    });

    return () => {
      isMounted = false;
    };
  }, [route.params?.preferences]);

  function setRegion(region) {
    setPreferences((prev) => ({ ...prev, region }));
  }

  function toggleFilter(key) {
    setPreferences((prev) => ({
      ...prev,
      activeFilters: prev.activeFilters.includes(key)
        ? prev.activeFilters.filter((item) => item !== key)
        : [...prev.activeFilters, key],
    }));
  }

  function toggleCareerStage(key) {
    setPreferences((prev) => ({
      ...prev,
      careerStage: prev.careerStage === key ? '' : key,
    }));
  }

  async function applyPreferences() {
    const next = normalizeCompanyPreferences(preferences);
    await Storage.set(Storage.KEYS.COMPANY_PREFERENCES, next);
    navigation.goBack();
  }

  async function resetPreferences() {
    await Storage.set(Storage.KEYS.COMPANY_PREFERENCES, DEFAULT_COMPANY_PREFERENCES);
    setPreferences(DEFAULT_COMPANY_PREFERENCES);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back-outline" size={22} color={HEADING} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Filters</Text>
        <TouchableOpacity
          onPress={resetPreferences}
          style={styles.resetBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="refresh-outline" size={18} color={ROSE} />
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Set what matters most to you, and LEA will narrow the company list around those preferences.
        </Text>

        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.toggleRow}>
          {['Singapore', 'Global'].map((region) => {
            const active = preferences.region === region;
            return (
              <TouchableOpacity
                key={region}
                style={[styles.toggleBtn, active && styles.toggleBtnActive]}
                onPress={() => setRegion(region)}
                activeOpacity={0.8}
              >
                <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
                  {region}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Benefits</Text>
        <View style={styles.optionList}>
          {BENEFIT_FILTERS.map((filter, index) => {
            const active = preferences.activeFilters.includes(filter.key);
            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.optionRow,
                  index > 0 && styles.optionRowBorder,
                  active && styles.optionRowActive,
                ]}
                onPress={() => toggleFilter(filter.key)}
                activeOpacity={0.8}
              >
                {active ? <View style={styles.optionAccent} /> : <View style={styles.optionAccentSpacer} />}
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{filter.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={ROSE} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Career Stage</Text>
        <View style={styles.optionList}>
          {CAREER_STAGES.map((stage, index) => {
            const active = preferences.careerStage === stage.key;
            return (
              <TouchableOpacity
                key={stage.key}
                style={[
                  styles.optionRow,
                  index > 0 && styles.optionRowBorder,
                  active && styles.optionRowActive,
                ]}
                onPress={() => toggleCareerStage(stage.key)}
                activeOpacity={0.8}
              >
                {active ? <View style={styles.optionAccent} /> : <View style={styles.optionAccentSpacer} />}
                <Text style={[styles.optionText, active && styles.optionTextActive]}>{stage.label}</Text>
                {active ? <Ionicons name="checkmark" size={18} color={ROSE} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={applyPreferences} activeOpacity={0.85}>
          <Text style={styles.applyBtnText}>Apply Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3DFEA',
  },
  iconBtn: {
    paddingVertical: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: HEADING,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetText: {
    color: ROSE,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 36,
  },
  intro: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6F6270',
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8D7C8A',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: ROSE,
    backgroundColor: '#FFF6FA',
    paddingVertical: 12,
  },
  toggleBtnActive: {
    backgroundColor: ROSE,
  },
  toggleBtnText: {
    color: ROSE,
    fontSize: 14,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  optionList: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#F0DCE8',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  optionRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  optionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F4E6EE',
  },
  optionRowActive: {
    backgroundColor: '#FFF6FB',
  },
  optionAccent: {
    width: 4,
    height: 18,
    borderRadius: 999,
    backgroundColor: ROSE,
    marginRight: 12,
  },
  optionAccentSpacer: {
    width: 4,
    height: 18,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#6A5B67',
    fontWeight: '500',
  },
  optionTextActive: {
    color: PLUM,
    fontWeight: '700',
  },
  applyBtn: {
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: ROSE,
    alignItems: 'center',
    paddingVertical: 15,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
