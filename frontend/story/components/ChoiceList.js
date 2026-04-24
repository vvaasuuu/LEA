import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLUM = '#3D0C4E';
const ROSE = '#C2185B';

function formatDelta(delta) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function ChoiceList({ choices, onSelect, scoreLabels, scoreColors }) {
  return (
    <View style={styles.list}>
      {choices.map((choice, index) => (
        <Pressable
          key={choice.id}
          onPress={() => onSelect(choice)}
          style={({ pressed }) => [styles.choice, pressed && styles.choicePressed]}
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
                  { borderColor: scoreColors[key], backgroundColor: `${scoreColors[key]}18` },
                ]}
              >
                <Text style={[styles.effectText, { color: scoreColors[key] }]}>
                  {scoreLabels[key]} {formatDelta(delta)}
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
    gap: 12,
  },
  choice: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
    backgroundColor: '#FFF0F5',
    padding: 14,
  },
  choicePressed: {
    backgroundColor: '#FCE4EC',
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  letter: {
    width: 24,
    color: ROSE,
    fontSize: 16,
    fontWeight: '900',
  },
  label: {
    flex: 1,
    color: PLUM,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
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
