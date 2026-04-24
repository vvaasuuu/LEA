import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function formatScore(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

export default function ScorePills({ scores, scoreLabels, scoreColors }) {
  return (
    <View style={styles.row}>
      {Object.entries(scores).map(([key, value]) => (
        <View
          key={key}
          style={[
            styles.pill,
            { borderColor: scoreColors[key], backgroundColor: `${scoreColors[key]}20` },
          ]}
        >
          <Text style={[styles.value, { color: scoreColors[key] }]}>{formatScore(value)}</Text>
          <Text style={styles.label}>{scoreLabels[key]}</Text>
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
    justifyContent: 'flex-end',
  },
  pill: {
    minWidth: 78,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  value: {
    fontSize: 16,
    fontWeight: '800',
  },
  label: {
    marginTop: 2,
    color: '#7B6E7A',
    fontSize: 11,
    fontWeight: '600',
  },
});
