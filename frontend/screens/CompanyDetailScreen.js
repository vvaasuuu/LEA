import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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


export default function CompanyDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { company } = route.params;


  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(company.name + ' employee benefits Singapore')}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.heroIconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.heroBackArrow}>←</Text>
          </TouchableOpacity>
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  topBar: {
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  heroIconBtn:   { padding: 6, alignSelf: 'flex-start' },
  heroBackArrow: { fontSize: 22, color: HEADING, fontWeight: '600' },

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

});
