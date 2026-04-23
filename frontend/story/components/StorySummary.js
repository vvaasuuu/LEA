import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScorePills from './ScorePills';

function buildEndingText(scores) {
  if (scores.fertility >= 30 && scores.career >= 25) {
    return 'You built a path with strong momentum and preserved room to choose later.';
  }

  if (scores.fertility >= 30) {
    return 'You repeatedly chose clarity and option-preserving moves, even when they cost momentum.';
  }

  if (scores.career >= 30) {
    return 'Your story leaned hard into acceleration, and the later tradeoffs became more concrete.';
  }

  return 'Your story stayed mixed and human: part planning, part timing, part tradeoff.';
}

export default function StorySummary({ scenarioTitle, scores, history, onRestart }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>Scenario Complete</Text>
      <Text style={styles.title}>{scenarioTitle}</Text>
      <Text style={styles.body}>{buildEndingText(scores)}</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Final Scores</Text>
        <ScorePills scores={scores} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Choice History</Text>
        {history.map((entry) => (
          <View key={entry.id} style={styles.historyItem}>
            <Text style={styles.historyAge}>Age {entry.age}</Text>
            <Text style={styles.historyChoice}>{entry.choiceLabel}</Text>
            <Text style={styles.historyConsequence}>{entry.consequenceSummary}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.restartButton} onPress={onRestart}>
        <Text style={styles.restartText}>Play Again</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5EFE6',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
  },
  eyebrow: {
    color: '#7E3F37',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.3,
  },
  title: {
    color: '#211814',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    marginTop: 8,
  },
  body: {
    color: '#4D433B',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#FFF9F2',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 63, 55, 0.14)',
  },
  cardLabel: {
    color: '#7E3F37',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  historyItem: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(126, 63, 55, 0.08)',
  },
  historyAge: {
    color: '#8E7A6B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  historyChoice: {
    color: '#261A15',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  historyConsequence: {
    color: '#5D534C',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  restartButton: {
    backgroundColor: '#7E3F37',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  restartText: {
    color: '#FFF9F2',
    fontSize: 16,
    fontWeight: '700',
  },
});
