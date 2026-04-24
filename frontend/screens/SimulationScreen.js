import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import StoryScreen from './StoryScreen';
import { STORY_SCENARIOS, STORY_SCENARIO_MAP } from '../story/data/scenarios';
import { Storage } from '../utils/storage';

const PLUM   = '#3D0C4E';
const ROSE   = '#C2185B';
const MUTED  = '#B39DBC';
const BORDER = '#EDD5E4';

const COMING_SOON_CARDS = [
  { id: 'coming_soon_01' },
  { id: 'coming_soon_02' },
  { id: 'coming_soon_03' },
];

const SCENARIO_META = {
  fertility_window_vs_career_acceleration: {
    summary: 'Follow Lea as she navigates the tension between career acceleration and her fertility timeline. Every choice shapes her options — and her future. Will she prioritise her career, her fertility, or somehow hold both?',
    getRelevance: (priorities) => priorities.includes('Family planning (someday)') ? 91 : 68,
  },
  money_habits_and_tradeoffs: {
    summary: 'Lea lands her first real salary and faces the classic dilemma: save, spend, or invest? From lifestyle creep to financial independence, every decision has a ripple effect on her freedom and future.',
    getRelevance: () => 82,
  },
};

function RelevanceBar({ score }) {
  return (
    <View style={styles.relRow}>
      <Text style={styles.relLabel}>Relevance to your goals</Text>
      <View style={styles.relTrack}>
        <View style={[styles.relFill, { width: `${score}%` }]} />
      </View>
      <Text style={styles.relScore}>{score}%</Text>
    </View>
  );
}

function formatScore(value) {
  if (value > 0) return `+${value}`;
  if (value < 0) return `${value}`;
  return '0';
}

function generateInitialScores(baseScores, age = 22) {
  const result = {};
  const base = age >= 26 ? 5 : 4;

  Object.keys(baseScores).forEach((key) => {
    result[key] = base + Math.floor(Math.random() * 4);
  });

  return result;
}

function getScenarioInitialScores(scenario) {
  const generated = generateInitialScores(
    scenario.initialScores,
    scenario.episodes[scenario.initialEpisodeId]?.age
  );

  return scenario.fixedStartScores
    ? { ...generated, ...scenario.fixedStartScores }
    : generated;
}

function ScenarioCard({ card, index, expanded, onToggle, onStart, isPlayed }) {
  const meta = SCENARIO_META[card.id];

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      {/* ── Title section ──────────────────────────────────────────── */}
      <Pressable
        onPress={onToggle}
        style={[styles.cardTop, expanded ? styles.cardTopExpanded : styles.cardTopCollapsed]}
      >
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardIndex, expanded ? styles.cardIndexExpanded : styles.cardIndexCollapsed]}>
            Scenario {String(index + 1).padStart(2, '0')}
          </Text>
          {isPlayed && (
            <View style={[styles.playedBadge, expanded && styles.playedBadgeExpanded]}>
              <Text style={[styles.playedBadgeText, expanded && styles.playedBadgeTextExpanded]}>Played</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardTitle, expanded ? styles.cardTitleExpanded : styles.cardTitleCollapsed]}>
          {card.title}
        </Text>
        {!expanded && (
          <Text style={styles.cardHint}>Tap to explore →</Text>
        )}
      </Pressable>

      {/* ── Expanded detail section ─────────────────────────────────── */}
      {expanded && meta && (
        <View style={styles.cardBottom}>
          <Text style={styles.summaryText}>{meta.summary}</Text>

          <View style={styles.startingScoresWrap}>
            <Text style={styles.startingScoresLabel}>Starting points</Text>
            <View style={styles.startingScoresRow}>
              {Object.entries(card.initialScores).map(([key, value]) => (
                <View
                  key={key}
                  style={[
                    styles.startingScorePill,
                    {
                      borderColor: card.scoreColors[key],
                      backgroundColor: `${card.scoreColors[key]}14`,
                    },
                  ]}
                >
                  <Text style={[styles.startingScoreValue, { color: card.scoreColors[key] }]}>
                    {formatScore(value)}
                  </Text>
                  <Text style={styles.startingScoreName}>{card.scoreLabels[key]}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <RelevanceBar score={card.relevance} />

          <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.88}>
            <Text style={styles.startBtnText}>
              {isPlayed ? 'Play Again →' : 'Start Simulation →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Tab({ label, active, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.tab, active && styles.tabActive]} activeOpacity={0.7}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ScenarioPicker({ onSelect, priorities, completedIds }) {
  const [expandedId, setExpandedId] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [scenarioPreviews] = useState(() =>
    STORY_SCENARIOS.reduce((map, scenario) => {
      map[scenario.id] = getScenarioInitialScores(scenario);
      return map;
    }, {})
  );

  const allCards = STORY_SCENARIOS.map((scenario) => {
    const meta = SCENARIO_META[scenario.id];
    return {
      id: scenario.id,
      title: scenario.selectorTitle || scenario.title,
      relevance: meta ? meta.getRelevance(priorities) : 75,
      isPlayed: completedIds.includes(scenario.id),
      initialScores: scenarioPreviews[scenario.id],
      scoreLabels: scenario.scoreLabels,
      scoreColors: scenario.scoreColors,
    };
  });

  const newCards    = allCards.filter((c) => !c.isPlayed);
  const playedCards = allCards.filter((c) => c.isPlayed);

  const visibleCards = activeTab === 'new' ? newCards : playedCards;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            <Text style={styles.headerBold}>Worlds</Text>
            {' '}to explore
          </Text>
          <View style={styles.headerLine} />
        </View>

        {/* ── Tabs ───────────────────────────────────────────────────── */}
        <View style={styles.tabRow}>
          <Tab label="New Scenarios"  active={activeTab === 'new'}    onPress={() => { setActiveTab('new');    setExpandedId(null); }} />
          <Tab label="Old Scenarios"  active={activeTab === 'played'} onPress={() => { setActiveTab('played'); setExpandedId(null); }} />
        </View>

        {/* ── Cards ──────────────────────────────────────────────────── */}
        <View style={styles.cardList}>
          {visibleCards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {activeTab === 'new'
                  ? 'You\'ve played everything — more worlds coming soon.'
                  : 'Complete a simulation to see it here.'}
              </Text>
            </View>
          ) : (
            visibleCards.map((card, index) => (
              <ScenarioCard
                key={card.id}
                card={card}
                index={index}
                expanded={expandedId === card.id}
                onToggle={() => setExpandedId(expandedId === card.id ? null : card.id)}
                onStart={() => onSelect(card.id, card.initialScores)}
                isPlayed={card.isPlayed}
              />
            ))
          )}

          {/* Coming soon only shown on New tab */}
          {activeTab === 'new' && COMING_SOON_CARDS.map((card) => (
            <View key={card.id} style={styles.cardDull}>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
              <Text style={styles.cardTitleDull}>New world{'\n'}in the making...</Text>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimer}>
          Scenarios are fictional, based on general health research.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SimulationScreen() {
  const [selectedScenarioId, setSelectedScenarioId] = useState(null);
  const [selectedInitialScores, setSelectedInitialScores] = useState(null);
  const [priorities,         setPriorities]         = useState([]);
  const [completedIds,       setCompletedIds]       = useState([]);

  useEffect(() => {
    Storage.get(Storage.KEYS.USER_PRIORITIES).then((pr) => { if (pr) setPriorities(pr); });
    Storage.get(Storage.KEYS.COMPLETED_SCENARIOS).then((ids) => { if (ids) setCompletedIds(ids); });
  }, []);

  // Refresh completed list when returning from a simulation
  useEffect(() => {
    if (!selectedScenarioId) {
      Storage.get(Storage.KEYS.COMPLETED_SCENARIOS).then((ids) => { if (ids) setCompletedIds(ids); });
    }
  }, [selectedScenarioId]);

  const activeScenario = useMemo(
    () => (selectedScenarioId ? STORY_SCENARIO_MAP[selectedScenarioId] : null),
    [selectedScenarioId]
  );

  if (activeScenario) {
    return (
      <StoryScreen
        key={activeScenario.id}
        scenario={activeScenario}
        initialScoresOverride={selectedInitialScores}
        onExit={() => {
          setSelectedScenarioId(null);
          setSelectedInitialScores(null);
        }}
      />
    );
  }

  return (
    <ScenarioPicker
      onSelect={(scenarioId, initialScores) => {
        setSelectedScenarioId(scenarioId);
        setSelectedInitialScores(initialScores);
      }}
      priorities={priorities}
      completedIds={completedIds}
    />
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 40 },

  // Header
  header:      { marginBottom: 24 },
  headerTitle: { fontSize: 30, fontWeight: '400', color: PLUM, letterSpacing: -0.5 },
  headerBold:  { fontWeight: '800' },
  headerLine:  { marginTop: 8, width: 120, height: 2, backgroundColor: ROSE, borderRadius: 1 },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    backgroundColor: ROSE,
    borderColor: ROSE,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Card list
  cardList: { gap: 16, marginBottom: 32 },

  // Card shell
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: ROSE,
    backgroundColor: '#FFFFFF',
  },
  cardExpanded: {
    borderColor: ROSE,
  },

  // Title section
  cardTop: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    minHeight: 120,
    justifyContent: 'center',
  },
  cardTopCollapsed: { backgroundColor: '#FFFFFF' },
  cardTopExpanded:  { backgroundColor: ROSE },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  cardIndex: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardIndexCollapsed: { color: ROSE },
  cardIndexExpanded:  { color: '#F6D7E3' },

  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 29,
    marginBottom: 10,
  },
  cardTitleCollapsed: { color: PLUM },
  cardTitleExpanded:  { color: '#FFFFFF' },

  cardHint: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },

  // Played badge
  playedBadge: {
    backgroundColor: '#FCE4EC',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  playedBadgeExpanded: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  playedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ROSE,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  playedBadgeTextExpanded: {
    color: '#FFFFFF',
  },

  // Expanded bottom section
  cardBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 20,
  },
  summaryText: {
    fontSize: 13,
    color: '#546E7A',
    lineHeight: 21,
    marginBottom: 16,
  },
  startingScoresWrap: {
    marginBottom: 16,
  },
  startingScoresLabel: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: ROSE,
  },
  startingScoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  startingScorePill: {
    minWidth: 82,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  startingScoreValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  startingScoreName: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '600',
    color: '#7B6E7A',
  },
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 14,
  },

  // Relevance bar
  relRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  relLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MUTED,
    flex: 1,
  },
  relTrack: {
    width: 80,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F5DCE8',
    overflow: 'hidden',
  },
  relFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: ROSE,
  },
  relScore: {
    fontSize: 13,
    fontWeight: '800',
    color: ROSE,
    width: 36,
    textAlign: 'right',
  },

  // Start button
  startBtn: {
    backgroundColor: ROSE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Coming soon cards
  cardDull: {
    borderRadius: 24,
    backgroundColor: '#FAF0F5',
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 22,
    paddingVertical: 20,
    minHeight: 110,
    justifyContent: 'center',
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDD5E4',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  comingSoonBadgeText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardTitleDull: {
    color: '#C4A8BB',
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },

  // Empty state
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Footer
  disclaimer: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
