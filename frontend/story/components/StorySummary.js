import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fetchRecommendations } from '../../utils/openai';
import { Storage } from '../../utils/storage';

function ScoreBar({ label, value, color }) {
  const clamped = Math.max(-10, Math.min(value, 50));
  const percent = ((clamped + 10) / 60) * 100;

  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>
        {value > 0 ? `+${value}` : value}
      </Text>
    </View>
  );
}

export default function StorySummary({
  scenarioTitle,
  endingText,
  scores,
  scoreLabels,
  scoreColors,
  history,
  onRestart,
  onExit,
}) {
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [choicesExpanded, setChoicesExpanded] = useState(false);

  useEffect(() => {
    async function loadRecs() {
      try {
        const [age, conditions, priorities] = await Promise.all([
          Storage.get(Storage.KEYS.USER_AGE),
          Storage.get(Storage.KEYS.USER_CONDITIONS),
          Storage.get(Storage.KEYS.USER_PRIORITIES),
        ]);

        const recs = await fetchRecommendations({
          age: age || 22,
          conditions: conditions || [],
          priorities: priorities || [],
          scores,
          history,
        });
        setRecommendations(recs);
      } catch (e) {
        console.error('Failed to fetch recommendations:', e);
        setRecommendations([]);
      } finally {
        setLoadingRecs(false);
      }
    }

    loadRecs();
  }, []);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Simulation Complete</Text>
        <Text style={styles.heroTitle}>{scenarioTitle}</Text>
        <Text style={styles.heroBody}>{endingText}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Scores</Text>
        {Object.entries(scores).map(([key, value]) => (
          <ScoreBar
            key={key}
            label={scoreLabels[key]}
            value={value}
            color={scoreColors[key]}
          />
        ))}
      </View>

      <View style={styles.card}>
        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setChoicesExpanded((v) => !v)}
        >
          <Text style={styles.cardLabelInline}>Your Choices</Text>
          <Text style={styles.chevron}>{choicesExpanded ? '▲' : '▼'}</Text>
        </Pressable>
        {choicesExpanded
          ? history.map((entry, index) => (
              <View
                key={entry.id}
                style={[
                  styles.timelineItem,
                  index === history.length - 1 && styles.timelineItemLast,
                ]}
              >
                <Text style={styles.timelineAge}>
                  Age {entry.age} - {entry.episodeTitle}
                </Text>
                <Text style={styles.timelineChoice}>{entry.choiceLabel}</Text>
                <Text style={styles.timelineConsequence}>{entry.consequenceSummary}</Text>
              </View>
            ))
          : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Your Next Steps</Text>
        {loadingRecs ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#C2185B" />
            <Text style={styles.loadingText}>Personalising your next steps…</Text>
          </View>
        ) : recommendations && recommendations.length > 0 ? (
          recommendations.map((rec, i) => (
            <View
              key={i}
              style={[styles.recItem, i === recommendations.length - 1 && styles.recItemLast]}
            >
              <Text style={styles.recTitle}>{rec.title}</Text>
              <Text style={styles.recBody}>{rec.body}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.loadingText}>Could not load recommendations right now.</Text>
        )}
      </View>

      <Pressable style={styles.primaryButton} onPress={onRestart}>
        <Text style={styles.primaryButtonText}>Play Again</Text>
      </Pressable>

      {onExit ? (
        <Pressable style={styles.secondaryButton} onPress={onExit}>
          <Text style={styles.secondaryButtonText}>Back to Scenarios</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  heroEyebrow: {
    marginBottom: 6,
    color: '#C2185B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginBottom: 10,
    color: '#3D0C4E',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  heroBody: {
    color: '#546E7A',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDD5E4',
    backgroundColor: '#FFF0F5',
    padding: 18,
  },
  cardLabel: {
    marginBottom: 14,
    color: '#C2185B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabelInline: {
    color: '#C2185B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  chevron: {
    color: '#C2185B',
    fontSize: 12,
    fontWeight: '700',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  barLabel: {
    width: 92,
    color: '#3D0C4E',
    fontSize: 13,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5DCE8',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    width: 36,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  timelineItem: {
    marginTop: 14,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EDD5E4',
    paddingBottom: 14,
  },
  timelineItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  timelineAge: {
    marginBottom: 4,
    color: '#B39DBC',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timelineChoice: {
    color: '#3D0C4E',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  timelineConsequence: {
    marginTop: 4,
    color: '#546E7A',
    fontSize: 12,
    lineHeight: 18,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#B39DBC',
    fontSize: 13,
    fontStyle: 'italic',
  },
  recItem: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDD5E4',
    paddingBottom: 14,
  },
  recItemLast: {
    marginBottom: 0,
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  recTitle: {
    marginBottom: 4,
    color: '#3D0C4E',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  recBody: {
    color: '#546E7A',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    marginTop: 6,
    marginBottom: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#C2185B',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: '#B39DBC',
    fontSize: 15,
    fontWeight: '600',
  },
});
