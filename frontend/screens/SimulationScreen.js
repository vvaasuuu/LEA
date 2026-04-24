import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import StoryScreen from './StoryScreen';
import { STORY_SCENARIOS, STORY_SCENARIO_MAP } from '../story/data/scenarios';

const COMING_SOON_CARDS = [
  { id: 'coming_soon_01', title: 'Coming Soon' },
  { id: 'coming_soon_02', title: 'Coming Soon' },
  { id: 'coming_soon_03', title: 'Coming Soon' },
];

function ScenarioPicker({ onSelect }) {
  const cards = [
    ...STORY_SCENARIOS.map((scenario) => ({
      id: scenario.id,
      title: scenario.selectorTitle || scenario.title,
      interactive: true,
    })),
    ...COMING_SOON_CARDS.map((card) => ({
      ...card,
      interactive: false,
    })),
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.cardList}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card, index) => (
            <Pressable
              key={card.id}
              disabled={!card.interactive}
              onPress={card.interactive ? () => onSelect(card.id) : undefined}
              style={({ pressed }) => [
                styles.card,
                card.interactive && pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.cardIndex}>Scenario {String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.disclaimer}>
          Scenarios are fictional based on general health research.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default function SimulationScreen() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);

  const activeScenario = useMemo(
    () => (selectedScenarioId ? STORY_SCENARIO_MAP[selectedScenarioId] : null),
    [selectedScenarioId]
  );

  if (activeScenario) {
    return (
      <StoryScreen
        key={activeScenario.id}
        scenario={activeScenario}
        onExit={() => setSelectedScenarioId(null)}
      />
    );
  }

  return <ScenarioPicker onSelect={setSelectedScenarioId} />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFDF8',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  scroll: {
    flex: 1,
  },
  cardList: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    minHeight: 138,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#C2185B',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardIndex: {
    marginBottom: 10,
    color: '#F6D7E3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 31,
  },
  disclaimer: {
    color: '#7C6E76',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
