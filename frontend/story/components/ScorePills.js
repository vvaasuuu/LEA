import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SCORE_COLORS, SCORE_LABELS } from '../data/fertilityWindowScenario';

function formatScore(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

export default function ScorePills({ scores }) {
  return (
    <View style={styles.row}>
      {Object.entries(scores).map(([key, value]) => (
        <View
          key={key}
          style={[
            styles.pill,
            { borderColor: SCORE_COLORS[key], backgroundColor: `${SCORE_COLORS[key]}20` },
          ]}
        >
          <Text style={[styles.value, { color: SCORE_COLORS[key] }]}>{formatScore(value)}</Text>
          <Text style={styles.label}>{SCORE_LABELS[key]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    minWidth: 78,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    color: '#5D534C',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});
