import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SCORE_COLORS, SCORE_LABELS } from '../data/fertilityWindowScenario';

function formatDelta(delta) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function ChoiceList({ choices, onSelect }) {
  return (
    <View style={styles.list}>
      {choices.map((choice, index) => (
        <Pressable
          key={choice.id}
          onPress={() => onSelect(choice)}
          style={({ pressed }) => [
            styles.choice,
            pressed && styles.choicePressed,
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={styles.letter}>{String.fromCharCode(65 + index)}</Text>
            <Text style={styles.label}>{choice.label}</Text>
          </View>
          <View style={styles.effectRow}>
            {Object.entries(choice.effect).map(([key, delta]) => (
              <View
                key={key}
                style={[
                  styles.effectPill,
                  { borderColor: SCORE_COLORS[key], backgroundColor: `${SCORE_COLORS[key]}1A` },
                ]}
              >
                <Text style={[styles.effectText, { color: SCORE_COLORS[key] }]}>
                  {SCORE_LABELS[key]} {formatDelta(delta)}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 18,
    gap: 12,
  },
  choice: {
    backgroundColor: '#FFF9F2',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(126, 63, 55, 0.16)',
    padding: 14,
  },
  choicePressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#FFF3E8',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  letter: {
    width: 24,
    color: '#7E3F37',
    fontSize: 16,
    fontWeight: '900',
  },
  label: {
    flex: 1,
    color: '#261A15',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  effectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  effectPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  effectText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
