import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';
import simulationData from '../data/simulation.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Dog images ───────────────────────────────────────────────────────────────
const DOG_IMAGES = {
  puppy: {
    eyesOpen: require('../assets/dogs/Puppy open eyes.png'),
    eyesClosed: require('../assets/dogs/puppy eyes closed.png'),
  },
  teen: {
    eyesOpen: require('../assets/dogs/teen1 eyes open.png'),
    eyesClosed: require('../assets/dogs/teen1 eyes closed.png'),
  },
  adult: {
    eyesOpen: require('../assets/dogs/adult dog eyes open tail down.png'),
    eyesClosed: require('../assets/dogs/adult dog eyes closed tail down.png'),
    eyesOpenTailUp: require('../assets/dogs/adult dog eyes open tail up.png'),
    eyesClosedTailUp: require('../assets/dogs/adult dog eyes closed tail up.png'),
  },
};

function getLeaStage(age) {
  if (age <= 23) return 'puppy';
  if (age <= 27) return 'teen';
  return 'adult';
}

function getDogImage(age, eyesOpen, tailUp = false) {
  const stage = getLeaStage(age);
  if (stage === 'puppy') return eyesOpen ? DOG_IMAGES.puppy.eyesOpen : DOG_IMAGES.puppy.eyesClosed;
  if (stage === 'teen') return eyesOpen ? DOG_IMAGES.teen.eyesOpen : DOG_IMAGES.teen.eyesClosed;
  if (tailUp) {
    return eyesOpen ? DOG_IMAGES.adult.eyesOpenTailUp : DOG_IMAGES.adult.eyesClosedTailUp;
  }
  return eyesOpen ? DOG_IMAGES.adult.eyesOpen : DOG_IMAGES.adult.eyesClosed;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function AgeProgressBar({ currentAge, startAge }) {
  const total = 35 - startAge;
  const done = Math.max(0, currentAge - startAge);
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressLabel}>Age {currentAge}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>
      <Text style={styles.progressEnd}>35</Text>
    </View>
  );
}

// ─── Lea avatar in screen ─────────────────────────────────────────────────────
function LeaInline({ age, eyesOpen, tailUp, size = 130 }) {
  const src = getDogImage(age, eyesOpen, tailUp);
  return (
    <View style={[styles.leaWrapper, { width: size, height: size }]}>
      <Image source={src} style={{ width: size, height: size }} resizeMode="contain" />
    </View>
  );
}

// ─── Health sidebar (bottom sheet modal) ─────────────────────────────────────
function HealthSidebar({ visible, sidebar, onGotIt }) {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  if (!sidebar) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity style={styles.sidebarBackdrop} activeOpacity={1} onPress={onGotIt} />
        <Animated.View style={[styles.sidebarSheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sidebarHandle} />
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.sidebarPill}>
              <Text style={styles.sidebarPillText}>Health insight</Text>
            </View>
            <Text style={styles.sidebarHeadline}>{sidebar.headline}</Text>
            <Text style={styles.sidebarBody}>{sidebar.body}</Text>
            {sidebar.action ? (
              <View style={styles.sidebarActionBox}>
                <Text style={styles.sidebarActionLabel}>What to do</Text>
                <Text style={styles.sidebarActionText}>{sidebar.action}</Text>
              </View>
            ) : null}
            <TouchableOpacity style={styles.gotItButton} onPress={onGotIt} activeOpacity={0.82}>
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Track prompt overlay ─────────────────────────────────────────────────────
function TrackPromptOverlay({ trackPrompt, onYes, onNo }) {
  return (
    <View style={styles.trackOverlay}>
      <View style={styles.trackCard}>
        <View style={styles.trackIconRow}>
          <Text style={styles.trackIcon}>✦</Text>
        </View>
        <Text style={styles.trackTitle}>A moment to explore</Text>
        <Text style={styles.trackPromptText}>{trackPrompt.prompt}</Text>
        <TouchableOpacity style={styles.trackYesButton} onPress={onYes} activeOpacity={0.82}>
          <Text style={styles.trackYesText}>Yes, explore this</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trackNoButton} onPress={onNo} activeOpacity={0.82}>
          <Text style={styles.trackNoText}>Not right now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── End screen ───────────────────────────────────────────────────────────────
function EndScreen({ decisionsMade, healthHeadlinesSeen, onPlannerPress, onHomePress }) {
  const endData = simulationData.end_screen;
  return (
    <ScrollView style={styles.endScroll} contentContainerStyle={styles.endContent}>
      <Image
        source={DOG_IMAGES.adult.eyesOpenTailUp}
        style={styles.endLeaImage}
        resizeMode="contain"
      />
      <Text style={styles.endTitle}>{endData.title}</Text>
      <Text style={styles.endClosingLine}>{endData.closing_line}</Text>

      {decisionsMade.length > 0 && (
        <View style={styles.endSection}>
          <Text style={styles.endSectionTitle}>{endData.decisions_summary_label}</Text>
          {decisionsMade.map((d, i) => (
            <View key={i} style={styles.endDecisionRow}>
              <Text style={styles.endDecisionAge}>Age {d.age}</Text>
              <Text style={styles.endDecisionTheme}>{d.theme}</Text>
              <Text style={styles.endDecisionConsequence}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}

      {healthHeadlinesSeen.length > 0 && (
        <View style={styles.endSection}>
          <Text style={styles.endSectionTitle}>{endData.health_insights_label}</Text>
          {healthHeadlinesSeen.map((h, i) => (
            <View key={i} style={styles.endInsightRow}>
              <Text style={styles.endInsightDot}>•</Text>
              <Text style={styles.endInsightText}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.endRoadmapPrompt}>{endData.roadmap_prompt}</Text>

      <TouchableOpacity style={styles.endPrimaryButton} onPress={onPlannerPress} activeOpacity={0.82}>
        <Text style={styles.endPrimaryButtonText}>Add to my planner</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.endSecondaryButton} onPress={onHomePress} activeOpacity={0.82}>
        <Text style={styles.endSecondaryButtonText}>Back to home</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SimulationScreen({ navigation }) {
  // ── Persistent data loaded once ──
  const [startAge, setStartAge] = useState(21);
  const [userConditions, setUserConditions] = useState([]);
  const [relationshipEnabled, setRelationshipEnabled] = useState(true);

  // ── Simulation flow state ──
  const [currentAge, setCurrentAge] = useState(21);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);
  const [showHealthSidebar, setShowHealthSidebar] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackStageIndex, setTrackStageIndex] = useState(0);
  const [showTrackPrompt, setShowTrackPrompt] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [decisionsMade, setDecisionsMade] = useState([]);
  const [healthHeadlinesSeen, setHealthHeadlinesSeen] = useState([]);

  // ── Avatar animation ──
  const [leaEyesOpen, setLeaEyesOpen] = useState(true);
  const [leaTailUp, setLeaTailUp] = useState(false);

  // ── Loading ──
  const [isLoading, setIsLoading] = useState(true);

  // ── Track which sidebar corresponds to (used to award points exactly once) ──
  const pendingSidebarHeadline = useRef(null);

  // ─── Load initial data ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const age = (await Storage.get('user_age')) ?? 21;
      const conditions = (await Storage.get('user_conditions')) ?? [];
      const relStr = await Storage.get('relationship_content_enabled');
      const relEnabled = relStr === null ? true : relStr === true || relStr === 'true';

      const safeAge = typeof age === 'number' ? age : parseInt(age, 10) || 21;
      const safeConditions = Array.isArray(conditions) ? conditions : [];

      setStartAge(safeAge);
      setCurrentAge(safeAge);
      setUserConditions(safeConditions);
      setRelationshipEnabled(relEnabled);

      const node = findNode(safeAge, simulationData.ages);
      setCurrentNode(node);
      setIsLoading(false);
    }
    init();
  }, []);

  // ─── Update lea_stage in storage when age changes ──────────────────────────
  useEffect(() => {
    if (!isLoading) {
      Storage.set(Storage.KEYS.LEA_STAGE, getLeaStage(currentAge));
    }
  }, [currentAge, isLoading]);

  // ─── Guard: invalid/exhausted track — advance age via effect, not render ───
  useEffect(() => {
    if (!currentTrack || isLoading) return;
    const track = simulationData.tracks[currentTrack];
    if (!track || !track.stages || trackStageIndex >= track.stages.length) {
      advanceAge(currentAge);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, trackStageIndex, isLoading]);

  // ─── Guard: all decisions hidden — advance age via effect, not render ──────
  useEffect(() => {
    if (!currentNode || isLoading || currentTrack || showTrackPrompt || simulationComplete) return;
    const visible = currentNode.decisions.filter(
      (d) => !(d.hidden_if_relationship_disabled === true && !relationshipEnabled)
    );
    if (visible.length === 0) {
      advanceAge(currentAge);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentNode, relationshipEnabled, isLoading, currentTrack, showTrackPrompt, simulationComplete]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function findNode(age, agesObj) {
    const key = `age_${age}`;
    if (agesObj[key]) return agesObj[key];
    // Skip forward if node missing
    for (let a = age + 1; a <= 36; a++) {
      if (agesObj[`age_${a}`]) return agesObj[`age_${a}`];
    }
    return null;
  }

  function getVisibleDecisions(node, relEnabled) {
    if (!node) return [];
    return node.decisions.filter(
      (d) => !(d.hidden_if_relationship_disabled === true && !relEnabled)
    );
  }

  async function getSidebarForAge(ageNode) {
    if (!ageNode || !ageNode.health_sidebar) return null;
    const sidebar = ageNode.health_sidebar;
    const condIndex = (await Storage.get('simulation_condition_index')) ?? 0;
    const safeIndex = typeof condIndex === 'number' ? condIndex : parseInt(condIndex, 10) || 0;

    let chosen = null;
    if (userConditions.length > 0) {
      const condKey = userConditions[safeIndex % userConditions.length];
      chosen = sidebar[condKey] ?? sidebar.default ?? null;
    } else {
      chosen = sidebar.default ?? null;
    }

    await Storage.set('simulation_condition_index', safeIndex + 1);
    return chosen;
  }

  async function getTrackSidebar(stage) {
    if (!stage || !stage.health_sidebar) return null;
    const sidebar = stage.health_sidebar;
    const condIndex = (await Storage.get('simulation_condition_index')) ?? 0;
    const safeIndex = typeof condIndex === 'number' ? condIndex : parseInt(condIndex, 10) || 0;
    let chosen = null;
    if (userConditions.length > 0) {
      const condKey = userConditions[safeIndex % userConditions.length];
      chosen = sidebar[condKey] ?? sidebar.default ?? null;
    } else {
      chosen = sidebar.default ?? null;
    }
    await Storage.set('simulation_condition_index', safeIndex + 1);
    return chosen;
  }

  function celebrateWithLea(tailShouldBeUp, callback) {
    setLeaEyesOpen(false);
    setLeaTailUp(tailShouldBeUp);
    setTimeout(() => {
      setLeaEyesOpen(true);
      if (callback) callback();
    }, 1000);
  }

  async function advanceAge(fromAge) {
    const nextAge = fromAge + 1;
    if (nextAge > 35) {
      await finishSimulation();
      return;
    }
    const nextNode = findNode(nextAge, simulationData.ages);
    if (!nextNode) {
      await finishSimulation();
      return;
    }
    setCurrentAge(nextAge);
    setCurrentNode(nextNode);
    setCurrentDecisionIndex(0);
    setCurrentTrack(null);
    setTrackStageIndex(0);
    setLeaEyesOpen(true);
    setLeaTailUp(false);
  }

  async function finishSimulation() {
    await Points.add(POINTS.SIMULATION_COMPLETE);
    const history = decisionsMade.map(({ age, theme, choice }) => ({ age, theme, choice }));
    await Storage.set('simulation_history', history);
    setSimulationComplete(true);
  }

  // ─── Decision handler ────────────────────────────────────────────────────────
  const handleChoice = useCallback(async (decision, choiceKey) => {
    const chosen = decision[choiceKey];
    const newDecision = {
      age: currentAge,
      theme: decision.theme,
      choice: chosen.label,
      consequence: chosen.consequence,
    };

    setDecisionsMade((prev) => [...prev, newDecision]);

    // Update history key immediately
    await Storage.set(
      'simulation_history',
      [...decisionsMade, newDecision].map(({ age, theme, choice }) => ({ age, theme, choice }))
    );

    celebrateWithLea(true, async () => {
      const sidebar = await getSidebarForAge(currentNode);
      pendingSidebarHeadline.current = sidebar ? sidebar.headline : null;
      setActiveSidebar(sidebar);
      setShowHealthSidebar(true);
    });
  }, [currentAge, currentNode, decisionsMade, userConditions]);

  // ─── Track choice handler ─────────────────────────────────────────────────
  const handleTrackChoice = useCallback(async (stage, choiceKey) => {
    const moment = stage.career_moment;
    const chosen = moment[choiceKey];
    const newDecision = {
      age: currentAge,
      theme: 'family_planning',
      choice: chosen.label,
      consequence: chosen.consequence,
    };
    setDecisionsMade((prev) => [...prev, newDecision]);

    celebrateWithLea(true, async () => {
      const sidebar = await getTrackSidebar(stage);
      pendingSidebarHeadline.current = sidebar ? sidebar.headline : null;
      setActiveSidebar(sidebar);
      setShowHealthSidebar(true);
    });
  }, [currentAge, userConditions]);

  // ─── Sidebar "Got it" ─────────────────────────────────────────────────────
  const handleGotIt = useCallback(async () => {
    await Points.add(POINTS.CONDITION_CARD_READ);

    if (pendingSidebarHeadline.current) {
      setHealthHeadlinesSeen((prev) => {
        if (!prev.includes(pendingSidebarHeadline.current)) {
          return [...prev, pendingSidebarHeadline.current];
        }
        return prev;
      });
      pendingSidebarHeadline.current = null;
    }

    setShowHealthSidebar(false);
    setActiveSidebar(null);
    setLeaTailUp(false);

    // If we're in a track stage, advance to next stage or back to ages
    if (currentTrack) {
      const track = simulationData.tracks[currentTrack];
      const nextStageIndex = trackStageIndex + 1;
      if (nextStageIndex < track.stages.length) {
        setTrackStageIndex(nextStageIndex);
      } else {
        // Track done — advance age
        await advanceAge(currentAge);
      }
      return;
    }

    // Normal flow — next decision or track prompt
    const visibleDecisions = getVisibleDecisions(currentNode, relationshipEnabled);
    const nextDecisionIndex = currentDecisionIndex + 1;

    if (nextDecisionIndex < visibleDecisions.length) {
      setCurrentDecisionIndex(nextDecisionIndex);
    } else {
      // All decisions done — check for track prompt
      if (currentNode.track_prompt) {
        setShowTrackPrompt(true);
      } else {
        await advanceAge(currentAge);
      }
    }
  }, [currentTrack, trackStageIndex, currentNode, currentDecisionIndex, relationshipEnabled, currentAge]);

  // ─── Track prompt handlers ────────────────────────────────────────────────
  const handleTrackYes = useCallback(() => {
    setShowTrackPrompt(false);
    const trackId = currentNode.track_prompt.yes_leads_to;
    setCurrentTrack(trackId);
    setTrackStageIndex(0);
  }, [currentNode]);

  const handleTrackNo = useCallback(async () => {
    setShowTrackPrompt(false);
    await advanceAge(currentAge);
  }, [currentAge]);

  // ─── End screen nav ───────────────────────────────────────────────────────
  const handlePlannerPress = useCallback(() => {
    navigation.navigate('Planning');
  }, [navigation]);

  const handleHomePress = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  // ─── Render guards ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your journey…</Text>
      </SafeAreaView>
    );
  }

  if (simulationComplete) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />
        <EndScreen
          decisionsMade={decisionsMade}
          healthHeadlinesSeen={healthHeadlinesSeen}
          onPlannerPress={handlePlannerPress}
          onHomePress={handleHomePress}
        />
      </SafeAreaView>
    );
  }

  if (!currentNode) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Almost there…</Text>
      </SafeAreaView>
    );
  }

  // ─── Track prompt screen ──────────────────────────────────────────────────
  if (showTrackPrompt && currentNode.track_prompt) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAF4FF" />
        <AgeProgressBar currentAge={currentAge} startAge={startAge} />
        <TrackPromptOverlay
          trackPrompt={currentNode.track_prompt}
          onYes={handleTrackYes}
          onNo={handleTrackNo}
        />
      </SafeAreaView>
    );
  }

  // ─── Track stage screen ───────────────────────────────────────────────────
  if (currentTrack) {
    const track = simulationData.tracks[currentTrack];
    if (!track || !track.stages || trackStageIndex >= track.stages.length) {
      return null;
    }
    const stage = track.stages[trackStageIndex];
    const moment = stage.career_moment;

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AgeProgressBar currentAge={currentAge} startAge={startAge} />

          <View style={styles.trackBanner}>
            <Text style={styles.trackBannerText}>{track.title}</Text>
          </View>

          <View style={styles.leaRow}>
            <LeaInline age={currentAge} eyesOpen={leaEyesOpen} tailUp={leaTailUp} />
          </View>

          <View style={styles.decisionCard}>
            <Text style={styles.narrativeText}>{moment.narrative}</Text>
          </View>

          <View style={styles.choicesRow}>
            <TouchableOpacity
              style={styles.choiceButton}
              onPress={() => handleTrackChoice(stage, 'choice_a')}
              activeOpacity={0.82}
            >
              <Text style={styles.choiceText}>{moment.choice_a.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.choiceButton}
              onPress={() => handleTrackChoice(stage, 'choice_b')}
              activeOpacity={0.82}
            >
              <Text style={styles.choiceText}>{moment.choice_b.label}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <HealthSidebar
          visible={showHealthSidebar}
          sidebar={activeSidebar}
          onGotIt={handleGotIt}
        />
      </SafeAreaView>
    );
  }

  // ─── Normal decision screen ───────────────────────────────────────────────
  const visibleDecisions = getVisibleDecisions(currentNode, relationshipEnabled);

  // Edge case: all decisions hidden — useEffect above handles advancing age
  if (visibleDecisions.length === 0) {
    return null;
  }

  const safeDecisionIndex = Math.min(currentDecisionIndex, visibleDecisions.length - 1);
  const decision = visibleDecisions[safeDecisionIndex];

  const themeLabel = {
    career: 'Career',
    health: 'Health',
    relationships: 'Relationships',
    family_planning: 'Family planning',
  }[decision.theme] ?? decision.theme;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F7FF" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AgeProgressBar currentAge={currentAge} startAge={startAge} />

        <View style={styles.leaRow}>
          <LeaInline age={currentAge} eyesOpen={leaEyesOpen} tailUp={leaTailUp} />
        </View>

        <View style={styles.themePillRow}>
          <View style={styles.themePill}>
            <Text style={styles.themePillText}>{themeLabel}</Text>
          </View>
          <Text style={styles.decisionCounter}>
            {safeDecisionIndex + 1} of {visibleDecisions.length}
          </Text>
        </View>

        <View style={styles.decisionCard}>
          <Text style={styles.narrativeText}>{decision.narrative}</Text>
        </View>

        <View style={styles.choicesRow}>
          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => handleChoice(decision, 'choice_a')}
            activeOpacity={0.82}
          >
            <Text style={styles.choiceText}>{decision.choice_a.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.choiceButton}
            onPress={() => handleChoice(decision, 'choice_b')}
            activeOpacity={0.82}
          >
            <Text style={styles.choiceText}>{decision.choice_b.label}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <HealthSidebar
        visible={showHealthSidebar}
        sidebar={activeSidebar}
        onGotIt={handleGotIt}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const BLUE = '#0277BD';
const BLUE_LIGHT = '#E1F5FE';
const BLUE_MID = '#0288D1';
const BLUE_DEEP = '#01579B';
const TEAL_SOFT = '#E0F2F1';
const TEXT_DARK = '#1A2D3E';
const TEXT_MID = '#4A6275';
const TEXT_SOFT = '#7A94A6';
const CARD_BG = '#FFFFFF';
const SCREEN_BG = '#F0F7FF';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: SCREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: TEXT_MID,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
    gap: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: BLUE_DEEP,
    minWidth: 46,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: BLUE_LIGHT,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BLUE_MID,
    borderRadius: 100,
  },
  progressEnd: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_SOFT,
    minWidth: 20,
    textAlign: 'right',
  },

  // Lea
  leaWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaRow: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },

  // Theme pill & counter
  themePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 8,
  },
  themePill: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: BLUE_DEEP,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  decisionCounter: {
    fontSize: 12,
    color: TEXT_SOFT,
    fontWeight: '500',
  },

  // Decision card
  decisionCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  narrativeText: {
    fontSize: 16,
    lineHeight: 24,
    color: TEXT_DARK,
    fontWeight: '400',
  },

  // Choices
  choicesRow: {
    gap: 12,
    marginBottom: 24,
  },
  choiceButton: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#B3D9F2',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  choiceText: {
    fontSize: 15,
    lineHeight: 22,
    color: BLUE_DEEP,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Track banner
  trackBanner: {
    backgroundColor: '#EAF4FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    alignItems: 'center',
  },
  trackBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: BLUE_DEEP,
    letterSpacing: 0.3,
  },

  // Track prompt overlay
  trackOverlay: {
    flex: 1,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  trackCard: {
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  trackIconRow: {
    marginBottom: 12,
  },
  trackIcon: {
    fontSize: 28,
    color: BLUE_MID,
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BLUE_DEEP,
    marginBottom: 14,
    textAlign: 'center',
  },
  trackPromptText: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 24,
  },
  trackYesButton: {
    backgroundColor: BLUE_MID,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  trackYesText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackNoButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
  },
  trackNoText: {
    fontSize: 15,
    fontWeight: '500',
    color: TEXT_MID,
  },

  // Health sidebar
  sidebarOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sidebarBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(1, 87, 155, 0.18)',
  },
  sidebarSheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 16,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  sidebarHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#B3D9F2',
    borderRadius: 100,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sidebarPill: {
    backgroundColor: BLUE_LIGHT,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  sidebarPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: BLUE_DEEP,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sidebarHeadline: {
    fontSize: 18,
    fontWeight: '700',
    color: BLUE_DEEP,
    lineHeight: 26,
    marginBottom: 12,
  },
  sidebarBody: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT_DARK,
    marginBottom: 16,
  },
  sidebarActionBox: {
    backgroundColor: TEAL_SOFT,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  sidebarActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00796B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sidebarActionText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#004D40',
  },
  gotItButton: {
    backgroundColor: BLUE_MID,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  gotItText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // End screen
  endScroll: {
    flex: 1,
    backgroundColor: SCREEN_BG,
  },
  endContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
  },
  endLeaImage: {
    width: 160,
    height: 160,
    marginTop: 32,
    marginBottom: 16,
  },
  endTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: BLUE_DEEP,
    textAlign: 'center',
    marginBottom: 10,
  },
  endClosingLine: {
    fontSize: 16,
    lineHeight: 24,
    color: TEXT_DARK,
    textAlign: 'center',
    marginBottom: 28,
  },
  endSection: {
    width: '100%',
    marginBottom: 24,
  },
  endSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BLUE_DEEP,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  endDecisionRow: {
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  endDecisionAge: {
    fontSize: 11,
    fontWeight: '700',
    color: BLUE_MID,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  endDecisionTheme: {
    fontSize: 11,
    color: TEXT_SOFT,
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  endDecisionConsequence: {
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_DARK,
  },
  endInsightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  endInsightDot: {
    fontSize: 16,
    color: BLUE_MID,
    lineHeight: 22,
    marginTop: 1,
  },
  endInsightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_DARK,
  },
  endRoadmapPrompt: {
    fontSize: 15,
    lineHeight: 23,
    color: TEXT_MID,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  endPrimaryButton: {
    backgroundColor: BLUE_MID,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: BLUE_MID,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  endPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  endSecondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#B3D9F2',
    backgroundColor: CARD_BG,
  },
  endSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: BLUE_DEEP,
  },
});
