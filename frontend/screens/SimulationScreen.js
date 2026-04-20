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
} from 'react-native';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';
import simulationData from '../data/simulation.json';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  blue: '#0277BD',
  blueMid: '#0288D1',
  blueDeep: '#01579B',
  blueLight: '#E1F5FE',
  blueGhost: '#F0F7FF',
  tealSoft: '#E0F2F1',
  tealDark: '#004D40',
  tealMid: '#00796B',
  text: '#1A2D3E',
  textMid: '#4A6275',
  textSoft: '#7A94A6',
  white: '#FFFFFF',
  border: '#B3D9F2',
  amber: '#FFF8E1',
  amberDark: '#E65100',
};

// ─── Dog images ───────────────────────────────────────────────────────────────
const DOG_IMAGES = {
  puppy: {
    open: require('../assets/dogs/Puppy open eyes.png'),
    closed: require('../assets/dogs/puppy eyes closed.png'),
  },
  teen: {
    open: require('../assets/dogs/teen1 eyes open.png'),
    closed: require('../assets/dogs/teen1 eyes closed.png'),
  },
  adult: {
    open: require('../assets/dogs/adult dog eyes open tail down.png'),
    closed: require('../assets/dogs/adult dog eyes closed tail down.png'),
    openUp: require('../assets/dogs/adult dog eyes open tail up.png'),
    closedUp: require('../assets/dogs/adult dog eyes closed tail up.png'),
  },
};

function getLeaStage(age) {
  if (age <= 23) return 'puppy';
  if (age <= 27) return 'teen';
  return 'adult';
}

function getDogImage(age, eyesOpen, tailUp = false) {
  const s = getLeaStage(age);
  if (s === 'puppy') return eyesOpen ? DOG_IMAGES.puppy.open : DOG_IMAGES.puppy.closed;
  if (s === 'teen') return eyesOpen ? DOG_IMAGES.teen.open : DOG_IMAGES.teen.closed;
  if (tailUp) return eyesOpen ? DOG_IMAGES.adult.openUp : DOG_IMAGES.adult.closedUp;
  return eyesOpen ? DOG_IMAGES.adult.open : DOG_IMAGES.adult.closed;
}

function getFamilyTrackId(age) {
  if (age <= 27) return 'track_family_planning_21_23';
  if (age <= 31) return 'track_family_planning_28_31';
  return 'track_family_planning_32_35';
}

// ─── Small components ─────────────────────────────────────────────────────────

function LeaInline({ age, eyesOpen, tailUp, size = 110 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Image
        source={getDogImage(age, eyesOpen, tailUp)}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

function HealthInsightCard({ data }) {
  if (!data) return null;
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightPillRow}>
        <Text style={styles.insightEmoji}>💡</Text>
        <Text style={styles.insightPill}>Health insight</Text>
      </View>
      <Text style={styles.insightHeadline}>{data.headline}</Text>
      <Text style={styles.insightBody}>{data.body}</Text>
      {data.action ? (
        <View style={styles.insightActionBox}>
          <Text style={styles.insightActionLabel}>WHAT TO DO</Text>
          <Text style={styles.insightActionText}>{data.action}</Text>
        </View>
      ) : null}
    </View>
  );
}

function FamilyPlanningPopup({ visible, currentAge, fpPreference, onPlanningFamily, onChildFree, onClose }) {
  const fpTrackId = getFamilyTrackId(currentAge);
  const cfTrack = simulationData.tracks['track_child_free'];
  const fpTrack = simulationData.tracks[fpTrackId];

  // First time: ask preference
  if (!fpPreference) {
    return (
      <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.popupOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
          <View style={styles.popupCard}>
            <Text style={styles.popupEmoji}>👪</Text>
            <Text style={styles.popupTitle}>Quick question</Text>
            <Text style={styles.popupBody}>
              Are you thinking about having children as part of your life plan? This helps LEA personalise this section just for you.
            </Text>
            <TouchableOpacity style={styles.popupPrimary} onPress={onPlanningFamily} activeOpacity={0.82}>
              <Text style={styles.popupPrimaryText}>Yes, it's part of my plan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.popupPrimary, styles.popupPrimaryAlt]} onPress={onChildFree} activeOpacity={0.82}>
              <Text style={[styles.popupPrimaryText, { color: C.tealDark }]}>Not planning to have children</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.popupSecondary} onPress={onClose} activeOpacity={0.82}>
              <Text style={styles.popupSecondaryText}>Ask me later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Preference already set — show relevant track
  const isChildFree = fpPreference === 'child_free';
  const trackData = isChildFree ? cfTrack : fpTrack;
  const framing = trackData?.framing ?? 'Explore what this looks like for you at this stage.';
  const onExplore = isChildFree ? onChildFree : onPlanningFamily;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.popupOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.popupCard}>
          <Text style={styles.popupEmoji}>{isChildFree ? '🌿' : '👨‍👩‍👧'}</Text>
          <Text style={styles.popupTitle}>{isChildFree ? 'Your health, your terms' : 'Family planning'}</Text>
          <Text style={styles.popupBody}>{framing}</Text>
          <TouchableOpacity style={styles.popupPrimary} onPress={onExplore} activeOpacity={0.82}>
            <Text style={styles.popupPrimaryText}>Explore this</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.popupSecondary} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.popupSecondaryText}>Not right now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function RelationshipInfoPopup({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.popupOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} activeOpacity={1} onPress={onClose} />
        <View style={styles.popupCard}>
          <Text style={styles.popupEmoji}>💕</Text>
          <Text style={styles.popupTitle}>Relationship scenarios</Text>
          <Text style={styles.popupBody}>
            When this is on, LEA includes scenarios about romantic partnerships, cohabitation, and life planning with a partner.
          </Text>
          <Text style={[styles.popupBody, { marginTop: 8 }]}>
            Turn it off at any time to focus on career and health decisions only. You can switch it back on whenever you're ready.
          </Text>
          <TouchableOpacity style={styles.popupPrimary} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.popupPrimaryText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EndScreen({ decisionsMade, healthHeadlinesSeen, onPlannerPress, onReset }) {
  const [journeyExpanded, setJourneyExpanded] = useState(false);
  const endData = simulationData.end_screen;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.blueGhost }} contentContainerStyle={styles.endContent}>
      <Image source={DOG_IMAGES.adult.openUp} style={styles.endLea} resizeMode="contain" />
      <Text style={styles.endTitle}>{endData.title}</Text>
      <Text style={styles.endClosing}>{endData.closing_line}</Text>

      {/* Health insights FIRST */}
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

      {/* Your journey — collapsible dropdown */}
      {decisionsMade.length > 0 && (
        <View style={styles.endSection}>
          <TouchableOpacity
            style={styles.endDropdownHeader}
            onPress={() => setJourneyExpanded((e) => !e)}
            activeOpacity={0.8}
          >
            <Text style={styles.endSectionTitle}>{endData.decisions_summary_label}</Text>
            <Text style={styles.endDropdownArrow}>{journeyExpanded ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {journeyExpanded && decisionsMade.map((d, i) => (
            <View key={i} style={styles.endRow}>
              <Text style={styles.endRowAge}>Age {d.age} · {d.theme}</Text>
              <Text style={styles.endRowConsequence}>{d.consequence}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.endRoadmapPrompt}>{endData.roadmap_prompt}</Text>
      <TouchableOpacity style={styles.endPrimary} onPress={onPlannerPress} activeOpacity={0.82}>
        <Text style={styles.endPrimaryText}>Add to my planner</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.endSecondary} onPress={onReset} activeOpacity={0.82}>
        <Text style={styles.endSecondaryText}>↺  Reset simulation</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function SimulationScreen({ navigation }) {
  // ── Loaded once ──
  const [startAge, setStartAge] = useState(21);
  const [userConditions, setUserConditions] = useState([]);
  const [relationshipEnabled, setRelationshipEnabled] = useState(true);

  // ── Age / node flow ──
  const [currentAge, setCurrentAge] = useState(21);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentDecisionIndex, setCurrentDecisionIndex] = useState(0);

  // ── Choice result state (inline, replaces modal) ──
  const [showChoiceResult, setShowChoiceResult] = useState(false);
  const [choiceResultData, setChoiceResultData] = useState(null);
  // choiceResultData: { choiceKey, chosenLabel, consequence, healthData, isTrack }

  // ── Family planning track ──
  const [currentTrack, setCurrentTrack] = useState(null);
  const [trackStageIndex, setTrackStageIndex] = useState(0);

  // ── End screen ──
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [decisionsMade, setDecisionsMade] = useState([]);
  const [healthHeadlinesSeen, setHealthHeadlinesSeen] = useState([]);

  // ── Back / undo ──
  const [historyStack, setHistoryStack] = useState([]);

  // ── Header UI ──
  const [showFamilyPopup, setShowFamilyPopup] = useState(false);
  const [fpBadgeVisible, setFpBadgeVisible] = useState(false);
  const [fpNudgeBanner, setFpNudgeBanner] = useState(false);
  const [fpPreference, setFpPreference] = useState(null); // null | 'planning' | 'child_free'
  const [showRelInfo, setShowRelInfo] = useState(false);
  const relInfoShown = useRef(false);

  // ── Starter screen ──
  const [showStarter, setShowStarter] = useState(true);

  // ── Lea avatar ──
  const [leaEyesOpen, setLeaEyesOpen] = useState(true);
  const [leaTailUp, setLeaTailUp] = useState(false);

  // ── Loading ──
  const [isLoading, setIsLoading] = useState(true);

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const rawAge = (await Storage.get('user_age')) ?? 21;
      const rawConds = (await Storage.get('user_conditions')) ?? [];
      const relStr = await Storage.get('relationship_content_enabled');
      const fpBadgeSeen = await Storage.get('fp_badge_seen');
      const savedFpPref = await Storage.get('fp_preference');

      const age = typeof rawAge === 'number' ? rawAge : parseInt(rawAge, 10) || 21;
      const conds = Array.isArray(rawConds) ? rawConds : [];
      const relEnabled = relStr === null ? true : relStr === true || relStr === 'true';

      setStartAge(age);
      setCurrentAge(age);
      setUserConditions(conds);
      setRelationshipEnabled(relEnabled);
      if (savedFpPref) setFpPreference(savedFpPref);
      if (!fpBadgeSeen) setFpBadgeVisible(true);

      const node = findNode(age, simulationData.ages);
      setCurrentNode(node);
      setIsLoading(false);
    }
    init();
  }, []);

  // ─── Age-25 nudge banner ───────────────────────────────────────────────────
  useEffect(() => {
    if (currentAge === 25 && fpBadgeVisible && !isLoading) {
      setFpNudgeBanner(true);
      const t = setTimeout(() => setFpNudgeBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [currentAge, fpBadgeVisible, isLoading]);

  // ─── Persist lea_stage ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) Storage.set(Storage.KEYS.LEA_STAGE, getLeaStage(currentAge));
  }, [currentAge, isLoading]);

  // ─── Guard: all decisions hidden ─────────────────────────────────────────
  useEffect(() => {
    if (!currentNode || isLoading || currentTrack || showChoiceResult || simulationComplete) return;
    const visible = currentNode.decisions.filter(
      (d) => !(d.hidden_if_relationship_disabled === true && !relationshipEnabled)
    );
    if (visible.length === 0) advanceAge(currentAge);
  }, [currentNode, relationshipEnabled, isLoading, currentTrack, showChoiceResult, simulationComplete]);

  // ─── Guard: track exhausted ───────────────────────────────────────────────
  useEffect(() => {
    if (!currentTrack || isLoading || showChoiceResult) return;
    const track = simulationData.tracks[currentTrack];
    if (!track || !track.stages || trackStageIndex >= track.stages.length) {
      handleTrackComplete();
    }
  }, [currentTrack, trackStageIndex, isLoading, showChoiceResult]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function findNode(age, agesObj) {
    if (agesObj[`age_${age}`]) return agesObj[`age_${age}`];
    for (let a = age + 1; a <= 36; a++) {
      if (agesObj[`age_${a}`]) return agesObj[`age_${a}`];
    }
    return null;
  }

  function visibleDecisions(node, relEnabled) {
    if (!node) return [];
    return node.decisions.filter(
      (d) => !(d.hidden_if_relationship_disabled === true && !relEnabled)
    );
  }

  async function pickSidebar(sidebarObj) {
    if (!sidebarObj) return null;
    const rawIdx = (await Storage.get('simulation_condition_index')) ?? 0;
    const idx = typeof rawIdx === 'number' ? rawIdx : parseInt(rawIdx, 10) || 0;
    let chosen = null;
    if (userConditions.length > 0) {
      const key = userConditions[idx % userConditions.length];
      chosen = sidebarObj[key] ?? sidebarObj.default ?? null;
    } else {
      chosen = sidebarObj.default ?? null;
    }
    await Storage.set('simulation_condition_index', idx + 1);
    return chosen;
  }

  function celebrate(callback) {
    setLeaEyesOpen(false);
    setLeaTailUp(true);
    setTimeout(() => {
      setLeaEyesOpen(true);
      if (callback) callback();
    }, 900);
  }

  async function advanceAge(fromAge) {
    const next = fromAge + 1;
    if (next > 35) { await finishSimulation(); return; }
    const nextNode = findNode(next, simulationData.ages);
    if (!nextNode) { await finishSimulation(); return; }
    setCurrentAge(next);
    setCurrentNode(nextNode);
    setCurrentDecisionIndex(0);
    setCurrentTrack(null);
    setTrackStageIndex(0);
    setLeaEyesOpen(true);
    setLeaTailUp(false);
  }

  async function finishSimulation() {
    await Points.add(POINTS.SIMULATION_COMPLETE);
    await Storage.set('simulation_history',
      decisionsMade.map(({ age, theme, choice }) => ({ age, theme, choice }))
    );
    setSimulationComplete(true);
  }

  function handleTrackComplete() {
    setCurrentTrack(null);
    setTrackStageIndex(0);
    setLeaEyesOpen(true);
    setLeaTailUp(false);
    // return to current age's decision flow; advanceAge if no decisions remain
    if (currentNode) {
      const vis = visibleDecisions(currentNode, relationshipEnabled);
      if (currentDecisionIndex >= vis.length) advanceAge(currentAge);
    }
  }

  // ─── Decision choice ──────────────────────────────────────────────────────
  const handleChoice = useCallback(async (decision, choiceKey) => {
    const chosen = decision[choiceKey];
    const newEntry = {
      age: currentAge,
      theme: decision.theme,
      choice: chosen.label,
      consequence: chosen.consequence,
    };

    // Save undo snapshot before mutating state
    setHistoryStack((prev) => [
      ...prev,
      {
        age: currentAge,
        node: currentNode,
        decisionIndex: currentDecisionIndex,
        decisionsMade: [...decisionsMade],
        healthHeadlinesSeen: [...healthHeadlinesSeen],
        track: currentTrack,
        trackStageIndex,
      },
    ]);

    const updatedDecisions = [...decisionsMade, newEntry];
    setDecisionsMade(updatedDecisions);
    await Storage.set(
      'simulation_history',
      updatedDecisions.map(({ age, theme, choice }) => ({ age, theme, choice }))
    );

    celebrate(async () => {
      // Only fetch and show health insight for health-themed decisions
      const healthData = decision.theme === 'health'
        ? await pickSidebar(currentNode?.health_sidebar)
        : null;
      setChoiceResultData({
        choiceKey,
        chosenLabel: chosen.label,
        consequence: chosen.consequence,
        healthData,
        isTrack: false,
      });
      setShowChoiceResult(true);
    });
  }, [currentAge, currentNode, currentDecisionIndex, decisionsMade, healthHeadlinesSeen, currentTrack, trackStageIndex, userConditions]);

  // ─── Track stage choice ───────────────────────────────────────────────────
  const handleTrackChoice = useCallback(async (stage, choiceKey) => {
    const moment = stage.career_moment;
    const chosen = moment[choiceKey];
    const newEntry = {
      age: currentAge,
      theme: 'family_planning',
      choice: chosen.label,
      consequence: chosen.consequence,
    };

    setHistoryStack((prev) => [
      ...prev,
      {
        age: currentAge,
        node: currentNode,
        decisionIndex: currentDecisionIndex,
        decisionsMade: [...decisionsMade],
        healthHeadlinesSeen: [...healthHeadlinesSeen],
        track: currentTrack,
        trackStageIndex,
      },
    ]);

    setDecisionsMade((prev) => [...prev, newEntry]);

    celebrate(async () => {
      const healthData = await pickSidebar(stage.health_sidebar);
      setChoiceResultData({
        choiceKey,
        chosenLabel: chosen.label,
        consequence: chosen.consequence,
        healthData,
        isTrack: true,
      });
      setShowChoiceResult(true);
    });
  }, [currentAge, currentNode, currentDecisionIndex, decisionsMade, healthHeadlinesSeen, currentTrack, trackStageIndex, userConditions]);

  // ─── Continue (after result + health insight) ─────────────────────────────
  const handleContinue = useCallback(async () => {
    await Points.add(POINTS.CONDITION_CARD_READ);

    const headline = choiceResultData?.healthData?.headline;
    if (headline) {
      setHealthHeadlinesSeen((prev) =>
        prev.includes(headline) ? prev : [...prev, headline]
      );
    }

    setShowChoiceResult(false);
    setChoiceResultData(null);
    setLeaTailUp(false);

    if (choiceResultData?.isTrack) {
      // Advance to next track stage or finish track
      const track = simulationData.tracks[currentTrack];
      const next = trackStageIndex + 1;
      if (track && next < track.stages.length) {
        setTrackStageIndex(next);
      } else {
        handleTrackComplete();
      }
      return;
    }

    // Normal decision flow
    const vis = visibleDecisions(currentNode, relationshipEnabled);
    const next = currentDecisionIndex + 1;
    if (next < vis.length) {
      setCurrentDecisionIndex(next);
    } else {
      await advanceAge(currentAge);
    }
  }, [choiceResultData, currentTrack, trackStageIndex, currentNode, currentDecisionIndex, relationshipEnabled, currentAge]);

  // ─── Go back / undo ───────────────────────────────────────────────────────
  const handleGoBack = useCallback(() => {
    if (historyStack.length === 0) return;
    const snapshot = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));
    setCurrentAge(snapshot.age);
    setCurrentNode(snapshot.node);
    setCurrentDecisionIndex(snapshot.decisionIndex);
    setDecisionsMade(snapshot.decisionsMade);
    setHealthHeadlinesSeen(snapshot.healthHeadlinesSeen);
    setCurrentTrack(snapshot.track);
    setTrackStageIndex(snapshot.trackStageIndex);
    setShowChoiceResult(false);
    setChoiceResultData(null);
    setLeaEyesOpen(true);
    setLeaTailUp(false);
  }, [historyStack]);

  // ─── Relationship toggle ──────────────────────────────────────────────────
  const handleRelationshipToggle = useCallback(() => {
    if (!relInfoShown.current) {
      relInfoShown.current = true;
      setShowRelInfo(true);
      return; // show info first, then user can toggle
    }
    const next = !relationshipEnabled;
    setRelationshipEnabled(next);
    Storage.set('relationship_content_enabled', next ? 'true' : 'false');
  }, [relationshipEnabled]);

  const handleRelInfoClose = useCallback(() => {
    setShowRelInfo(false);
    // Toggle after info is dismissed
    const next = !relationshipEnabled;
    setRelationshipEnabled(next);
    Storage.set('relationship_content_enabled', next ? 'true' : 'false');
  }, [relationshipEnabled]);

  // ─── Family planning button ───────────────────────────────────────────────
  const handleFamilyButtonPress = useCallback(() => {
    if (fpBadgeVisible) {
      setFpBadgeVisible(false);
      setFpNudgeBanner(false);
      Storage.set('fp_badge_seen', true);
    }
    setShowFamilyPopup(true);
  }, [fpBadgeVisible]);

  const handlePlanningFamily = useCallback(() => {
    setShowFamilyPopup(false);
    if (fpPreference !== 'planning') {
      setFpPreference('planning');
      Storage.set('fp_preference', 'planning');
    }
    const trackId = getFamilyTrackId(currentAge);
    if (simulationData.tracks[trackId]) {
      setCurrentTrack(trackId);
      setTrackStageIndex(0);
      setShowChoiceResult(false);
      setChoiceResultData(null);
    }
  }, [currentAge, fpPreference]);

  const handleChildFree = useCallback(() => {
    setShowFamilyPopup(false);
    if (fpPreference !== 'child_free') {
      setFpPreference('child_free');
      Storage.set('fp_preference', 'child_free');
    }
    if (simulationData.tracks['track_child_free']) {
      setCurrentTrack('track_child_free');
      setTrackStageIndex(0);
      setShowChoiceResult(false);
      setChoiceResultData(null);
    }
  }, [fpPreference]);

  // ─── Reset simulation ─────────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    await Storage.remove('simulation_history');
    await Storage.set('simulation_condition_index', 0);
    const rawAge = (await Storage.get('user_age')) ?? 21;
    const age = typeof rawAge === 'number' ? rawAge : parseInt(rawAge, 10) || 21;
    const node = findNode(age, simulationData.ages);
    setCurrentAge(age);
    setCurrentNode(node);
    setCurrentDecisionIndex(0);
    setShowChoiceResult(false);
    setChoiceResultData(null);
    setCurrentTrack(null);
    setTrackStageIndex(0);
    setSimulationComplete(false);
    setDecisionsMade([]);
    setHealthHeadlinesSeen([]);
    setHistoryStack([]);
    setLeaEyesOpen(true);
    setLeaTailUp(false);
    setShowStarter(true);
  }, [startAge]);

  // ─── Nav ──────────────────────────────────────────────────────────────────
  const handlePlannerPress = useCallback(() => navigation.navigate('Planning'), [navigation]);

  // ─── Render: loading ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Loading your journey…</Text>
      </SafeAreaView>
    );
  }

  // ─── Starter screen ───────────────────────────────────────────────────────
  if (showStarter) {
    return (
      <SafeAreaView style={styles.starterRoot}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <View style={styles.starterContent}>
          <Image source={DOG_IMAGES.puppy.open} style={styles.starterLea} resizeMode="contain" />
          <Text style={styles.starterTitle}>Hi, I'm Lea!</Text>
          <Text style={styles.starterBody}>
            Let's walk through your twenties and thirties together — your career, your health, the choices that shape a life.
          </Text>
          <Text style={styles.starterHint}>
            There are no wrong answers. Every path teaches you something.
          </Text>
          <TouchableOpacity style={styles.starterBtn} onPress={() => setShowStarter(false)} activeOpacity={0.82}>
            <Text style={styles.starterBtnText}>Start simulation →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (simulationComplete) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        <EndScreen
          decisionsMade={decisionsMade}
          healthHeadlinesSeen={healthHeadlinesSeen}
          onPlannerPress={handlePlannerPress}
          onReset={handleReset}
        />
      </SafeAreaView>
    );
  }

  if (!currentNode) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Almost there…</Text>
      </SafeAreaView>
    );
  }

  // ─── Derived render values ────────────────────────────────────────────────
  const totalAges = 35 - startAge;
  const progressPct = totalAges > 0 ? Math.min(1, (currentAge - startAge) / totalAges) : 0;

  const isInTrack = !!currentTrack;
  let track = null;
  let trackStage = null;
  if (isInTrack) {
    track = simulationData.tracks[currentTrack];
    if (track?.stages && trackStageIndex < track.stages.length) {
      trackStage = track.stages[trackStageIndex];
    }
  }

  const vis = visibleDecisions(currentNode, relationshipEnabled);
  const safeIdx = Math.min(currentDecisionIndex, Math.max(0, vis.length - 1));
  const decision = vis[safeIdx];

  const THEME_LABEL = {
    career: 'Career',
    health: 'Health',
    relationships: 'Relationships',
    family_planning: 'Family planning',
  };

  // ─── Shared header ────────────────────────────────────────────────────────
  const Header = (
    <View style={styles.header}>
      {/* Progress */}
      <View style={styles.headerProgress}>
        <Text style={styles.headerAge}>Age {currentAge}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progressPct * 100)}%` }]} />
        </View>
        <Text style={styles.headerEnd}>35</Text>
      </View>

      {/* Right-side buttons */}
      <View style={styles.headerButtons}>
        {/* Relationship toggle */}
        <TouchableOpacity
          style={[styles.headerBtn, relationshipEnabled && styles.headerBtnActive]}
          onPress={handleRelationshipToggle}
          activeOpacity={0.8}
        >
          <Text style={styles.headerBtnText}>💕</Text>
        </TouchableOpacity>

        {/* Family planning button */}
        <TouchableOpacity
          style={[styles.headerBtn, styles.headerBtnFamily, currentTrack && styles.headerBtnActiveFamily]}
          onPress={handleFamilyButtonPress}
          activeOpacity={0.8}
        >
          <Text style={styles.headerBtnText}>👪</Text>
          {fpBadgeVisible && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Age-25 nudge banner
  const NudgeBanner = fpNudgeBanner ? (
    <TouchableOpacity
      style={styles.nudgeBanner}
      onPress={() => { setFpNudgeBanner(false); handleFamilyButtonPress(); }}
      activeOpacity={0.9}
    >
      <Text style={styles.nudgeBannerText}>
        👪 Tap the button above to explore family planning whenever you're ready
      </Text>
    </TouchableOpacity>
  ) : null;

  // ─── Shared footer (back button) ──────────────────────────────────────────
  const Footer = historyStack.length > 0 ? (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.backBtn} onPress={handleGoBack} activeOpacity={0.8}>
        <Text style={styles.backBtnText}>← Go back</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  // ─── Track: choose a stage decision ──────────────────────────────────────
  if (isInTrack && trackStage && !showChoiceResult) {
    const moment = trackStage.career_moment;
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        {Header}
        {NudgeBanner}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.trackBanner}>
            <Text style={styles.trackBannerEmoji}>👨‍👩‍👧</Text>
            <Text style={styles.trackBannerTitle}>{track.title}</Text>
          </View>

          <View style={styles.leaRow}>
            <LeaInline age={currentAge} eyesOpen={leaEyesOpen} tailUp={leaTailUp} />
          </View>

          <View style={styles.decisionCard}>
            <Text style={styles.narrativeText}>{moment.narrative}</Text>
          </View>

          <View style={styles.choicesCol}>
            <TouchableOpacity style={styles.choiceBtn} onPress={() => handleTrackChoice(trackStage, 'choice_a')} activeOpacity={0.82}>
              <Text style={styles.choiceBtnText}>{moment.choice_a.label}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choiceBtn} onPress={() => handleTrackChoice(trackStage, 'choice_b')} activeOpacity={0.82}>
              <Text style={styles.choiceBtnText}>{moment.choice_b.label}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {Footer}

        <FamilyPlanningPopup visible={showFamilyPopup} currentAge={currentAge} fpPreference={fpPreference} onPlanningFamily={handlePlanningFamily} onChildFree={handleChildFree} onClose={() => setShowFamilyPopup(false)} />
        <RelationshipInfoPopup visible={showRelInfo} onClose={handleRelInfoClose} />
      </SafeAreaView>
    );
  }

  // ─── Choice result: consequence + health insight inline ───────────────────
  if (showChoiceResult && choiceResultData) {
    const isTrackResult = choiceResultData.isTrack;
    const narrative = isTrackResult
      ? (track?.stages?.[trackStageIndex - 1]?.career_moment?.narrative ?? '')
      : (decision?.narrative ?? '');

    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
        {Header}
        {NudgeBanner}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {isTrackResult && track && (
            <View style={styles.trackBanner}>
              <Text style={styles.trackBannerEmoji}>👨‍👩‍👧</Text>
              <Text style={styles.trackBannerTitle}>{track.title}</Text>
            </View>
          )}

          <View style={styles.leaRow}>
            <LeaInline age={currentAge} eyesOpen={leaEyesOpen} tailUp={leaTailUp} />
          </View>

          {/* Chosen option card */}
          <View style={styles.resultCard}>
            <Text style={styles.resultChosenLabel}>{choiceResultData.chosenLabel}</Text>
            <View style={styles.resultDivider} />
            <Text style={styles.resultConsequence}>{choiceResultData.consequence}</Text>
          </View>

          {/* Health insight inline section */}
          <HealthInsightCard data={choiceResultData.healthData} />

          {/* Continue button */}
          <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.82}>
            <Text style={styles.continueBtnText}>Continue →</Text>
          </TouchableOpacity>
        </ScrollView>
        {Footer}

        <FamilyPlanningPopup visible={showFamilyPopup} currentAge={currentAge} fpPreference={fpPreference} onPlanningFamily={handlePlanningFamily} onChildFree={handleChildFree} onClose={() => setShowFamilyPopup(false)} />
        <RelationshipInfoPopup visible={showRelInfo} onClose={handleRelInfoClose} />
      </SafeAreaView>
    );
  }

  // ─── Normal decision screen ───────────────────────────────────────────────
  if (!decision) return null; // guard for hidden-decisions useEffect

  const themeLabel = THEME_LABEL[decision.theme] ?? decision.theme;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.blueGhost} />
      {Header}
      {NudgeBanner}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.leaRow}>
          <LeaInline age={currentAge} eyesOpen={leaEyesOpen} tailUp={leaTailUp} />
        </View>

        <View style={styles.themePillRow}>
          <View style={styles.themePill}>
            <Text style={styles.themePillText}>{themeLabel}</Text>
          </View>
          <Text style={styles.decisionCounter}>
            {safeIdx + 1} of {vis.length}
          </Text>
        </View>

        <View style={styles.decisionCard}>
          <Text style={styles.narrativeText}>{decision.narrative}</Text>
        </View>

        <View style={styles.choicesCol}>
          <TouchableOpacity style={styles.choiceBtn} onPress={() => handleChoice(decision, 'choice_a')} activeOpacity={0.82}>
            <Text style={styles.choiceBtnText}>{decision.choice_a.label}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.choiceBtn} onPress={() => handleChoice(decision, 'choice_b')} activeOpacity={0.82}>
            <Text style={styles.choiceBtnText}>{decision.choice_b.label}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {Footer}

      <FamilyPlanningPopup visible={showFamilyPopup} currentAge={currentAge} fpPreference={fpPreference} onPlanningFamily={handlePlanningFamily} onChildFree={handleChildFree} onClose={() => setShowFamilyPopup(false)} />
      <RelationshipInfoPopup visible={showRelInfo} onClose={handleRelInfoClose} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.blueGhost },
  loadingWrap: { flex: 1, backgroundColor: C.blueGhost, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: C.textMid, fontWeight: '500' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: C.blueGhost,
  },
  headerProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAge: { fontSize: 13, fontWeight: '700', color: C.blueDeep, minWidth: 46 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: C.blueLight,
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: C.blueMid, borderRadius: 100 },
  headerEnd: { fontSize: 12, color: C.textSoft, fontWeight: '600', minWidth: 18 },
  headerButtons: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnActive: { backgroundColor: '#FFF0F5', borderColor: '#F48FB1' },
  headerBtnFamily: {},
  headerBtnActiveFamily: { backgroundColor: C.blueLight, borderColor: C.blueMid },
  headerBtnText: { fontSize: 16 },
  badgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F06292',
    borderWidth: 1.5,
    borderColor: C.white,
  },

  // Nudge banner
  nudgeBanner: {
    marginHorizontal: 16,
    marginBottom: 6,
    backgroundColor: C.amber,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  nudgeBannerText: { fontSize: 13, color: C.amberDark, fontWeight: '500', lineHeight: 19 },

  // Scroll / content
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  // Lea
  leaRow: { alignItems: 'center', marginTop: 8, marginBottom: 8 },

  // Theme pill + counter
  themePillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  themePill: {
    backgroundColor: C.blueLight,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  themePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.blueDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  decisionCounter: { fontSize: 12, color: C.textSoft, fontWeight: '500' },

  // Decision card
  decisionCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  narrativeText: { fontSize: 15, lineHeight: 23, color: C.text },

  // Choice buttons
  choicesCol: { gap: 10, marginBottom: 16 },
  choiceBtn: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  choiceBtnText: { fontSize: 15, lineHeight: 22, color: C.blueDeep, fontWeight: '500', textAlign: 'center' },

  // Result card (after choice)
  resultCard: {
    backgroundColor: C.blueLight,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
  },
  resultChosenLabel: { fontSize: 14, fontWeight: '700', color: C.blueDeep, marginBottom: 10 },
  resultDivider: { height: 1, backgroundColor: C.border, marginBottom: 10 },
  resultConsequence: { fontSize: 15, lineHeight: 23, color: C.text },

  // Health insight card (inline)
  insightCard: {
    backgroundColor: C.white,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderLeftColor: C.blueMid,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  insightPillRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  insightEmoji: { fontSize: 15 },
  insightPill: { fontSize: 11, fontWeight: '700', color: C.blueMid, textTransform: 'uppercase', letterSpacing: 0.5 },
  insightHeadline: { fontSize: 16, fontWeight: '700', color: C.blueDeep, lineHeight: 24, marginBottom: 8 },
  insightBody: { fontSize: 14, lineHeight: 22, color: C.text, marginBottom: 12 },
  insightActionBox: { backgroundColor: C.tealSoft, borderRadius: 12, padding: 14 },
  insightActionLabel: { fontSize: 10, fontWeight: '700', color: C.tealMid, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 },
  insightActionText: { fontSize: 13, lineHeight: 20, color: C.tealDark },

  // Continue button
  continueBtn: {
    backgroundColor: C.blueMid,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: C.blueMid,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: C.white },

  // Track banner
  trackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF4FF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 6,
  },
  trackBannerEmoji: { fontSize: 16 },
  trackBannerTitle: { fontSize: 13, fontWeight: '700', color: C.blueDeep },

  // Footer (back button)
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.blueLight,
    backgroundColor: C.blueGhost,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: C.textMid },

  // Popup (family planning + relationship info)
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(1,87,155,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: C.white,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  popupEmoji: { fontSize: 36, marginBottom: 12 },
  popupTitle: { fontSize: 18, fontWeight: '700', color: C.blueDeep, marginBottom: 12, textAlign: 'center' },
  popupBody: { fontSize: 15, lineHeight: 23, color: C.text, textAlign: 'center' },
  popupPrimary: {
    backgroundColor: C.blueMid,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  popupPrimaryAlt: {
    backgroundColor: C.tealSoft,
    marginTop: 10,
  },
  popupPrimaryText: { fontSize: 15, fontWeight: '700', color: C.white },
  popupSecondary: { paddingVertical: 12, paddingHorizontal: 28, marginTop: 6, width: '100%', alignItems: 'center' },
  popupSecondaryText: { fontSize: 15, fontWeight: '500', color: C.textMid },

  // Starter screen
  starterRoot: { flex: 1, backgroundColor: C.blueGhost },
  starterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  starterLea: { width: 180, height: 180, marginBottom: 24 },
  starterTitle: { fontSize: 28, fontWeight: '800', color: C.blueDeep, marginBottom: 14, textAlign: 'center' },
  starterBody: { fontSize: 16, lineHeight: 24, color: C.text, textAlign: 'center', marginBottom: 12 },
  starterHint: { fontSize: 14, lineHeight: 21, color: C.textMid, textAlign: 'center', marginBottom: 36 },
  starterBtn: {
    backgroundColor: C.blueMid,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: C.blueMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  starterBtnText: { fontSize: 17, fontWeight: '700', color: C.white },

  // End screen
  endContent: { paddingHorizontal: 24, paddingBottom: 48, alignItems: 'center' },
  endLea: { width: 150, height: 150, marginTop: 28, marginBottom: 16 },
  endTitle: { fontSize: 22, fontWeight: '800', color: C.blueDeep, textAlign: 'center', marginBottom: 10 },
  endClosing: { fontSize: 16, lineHeight: 24, color: C.text, textAlign: 'center', marginBottom: 28 },
  endSection: { width: '100%', marginBottom: 24 },
  endSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.blueDeep,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  endDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 4,
  },
  endDropdownArrow: { fontSize: 12, color: C.textSoft, fontWeight: '600' },
  endRow: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  endRowAge: { fontSize: 11, fontWeight: '700', color: C.blueMid, textTransform: 'capitalize', marginBottom: 4 },
  endRowConsequence: { fontSize: 14, lineHeight: 21, color: C.text },
  endInsightRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  endInsightDot: { fontSize: 16, color: C.blueMid, lineHeight: 22 },
  endInsightText: { flex: 1, fontSize: 14, lineHeight: 21, color: C.text },
  endRoadmapPrompt: { fontSize: 15, lineHeight: 23, color: C.textMid, textAlign: 'center', marginBottom: 20, marginTop: 4 },
  endPrimary: {
    backgroundColor: C.blueMid,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: C.blueMid,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  endPrimaryText: { fontSize: 16, fontWeight: '700', color: C.white },
  endSecondary: {
    borderRadius: 16,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  endSecondaryText: { fontSize: 16, fontWeight: '600', color: C.blueDeep },
});
