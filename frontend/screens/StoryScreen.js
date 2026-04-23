import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { Points, POINTS } from '../utils/points';
import { Storage } from '../utils/storage';
import ChoiceList from '../story/components/ChoiceList';
import EpisodeTitleCard from '../story/components/EpisodeTitleCard';
import ScorePills from '../story/components/ScorePills';
import StorySummary from '../story/components/StorySummary';
import {
  fertilityWindowScenario, DEFAULT_SCORES, applyScoreEffect,
} from '../story/data/fertilityWindowScenario';
import { getCharacterSprite } from '../story/assets/storyAssets';

const PLUM   = '#3D0C4E';
const ROSE   = '#C2185B';
const BORDER = '#EDD5E4';
const BG     = '#FFF5F8';

const { height: SCREEN_H } = Dimensions.get('window');
const IMAGE_H       = SCREEN_H * 0.52;
const TYPEWRITER_MS = 28;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFirstSpeaker(lines) {
  return lines.find(l => l.character)?.character || 'lea';
}

function getCast(episode, pendingLines) {
  // Use only the current phase's lines — never merge episode + consequence,
  // which would put all three characters on screen at once.
  const src = pendingLines ? pendingLines : episode.lines;
  const ids = new Set();
  src.forEach(l => { if (l.character) ids.add(l.character); });
  if (ids.size === 0) ids.add('lea');
  return Array.from(ids);
}

function orderCast(cast) {
  const hasLea  = cast.includes('lea');
  const hasMara = cast.includes('mara');
  const hasDoc  = cast.includes('drlin');
  // Manager left, Lea right
  if (cast.length === 2 && hasLea && hasMara) return ['mara', 'lea'];
  // Lea left, Doctor right
  if (cast.length === 2 && hasLea && hasDoc)  return ['lea', 'drlin'];
  return cast;
}

function flattenConsequence(choice) {
  return choice.consequence.map(l => l.text).join(' ');
}

// ── Character + thought bubble ────────────────────────────────────────────────

function CharacterWithBubble({ characterId, isActive, text, speaker, expression }) {
  return (
    <View style={styles.charSlot}>
      <View style={[styles.bubbleWrap, (!isActive || !text) && styles.bubbleInvisible]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleSpeaker}>{speaker || ''}</Text>
          <Text style={styles.bubbleText} numberOfLines={5}>{text || ''}</Text>
        </View>
        <View style={styles.bubbleTail} />
      </View>

      <Image
        source={getCharacterSprite(characterId, expression || 'base')}
        style={styles.charImage}
        resizeMode="contain"
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function StoryScreen({ onExit }) {
  const [episodeId,     setEpisodeId]     = useState(fertilityWindowScenario.initialEpisodeId);
  const [lineIndex,     setLineIndex]     = useState(0);
  const [scores,        setScores]        = useState(DEFAULT_SCORES);
  const [history,       setHistory]       = useState([]);
  const [showChoices,   setShowChoices]   = useState(false);
  const [pendingCons,   setPendingCons]   = useState(null);
  const [consIndex,     setConsIndex]     = useState(0);
  const [showTitleCard, setShowTitleCard] = useState(true);
  const [view,          setView]          = useState('story');
  const [activeSpeaker, setActiveSpeaker] = useState(
    getFirstSpeaker(fertilityWindowScenario.episodes[fertilityWindowScenario.initialEpisodeId].lines)
  );
  const [typedText,      setTypedText]      = useState('');
  const [showArrow,      setShowArrow]      = useState(false);
  const [leaExpression,  setLeaExpression]  = useState('base');

  const episode          = fertilityWindowScenario.episodes[episodeId];
  const typingRef        = useRef(null);
  const pendingLeaExprRef = useRef('base');

  useEffect(() => {
    if (!episode) return;
    setLineIndex(0);
    setShowChoices(false);
    setPendingCons(null);
    setConsIndex(0);
    setShowTitleCard(true);
    setActiveSpeaker(getFirstSpeaker(episode.lines));
    // Pre-load lea's first expression while title card is shown (she's off-screen)
    const firstLea = episode.lines.find(l => l.character === 'lea');
    const expr = firstLea?.expression || 'base';
    pendingLeaExprRef.current = expr;
    setLeaExpression(expr);
  }, [episodeId]);

  useEffect(() => {
    if (view !== 'summary') return;
    Storage.set(Storage.KEYS.SIMULATION_HISTORY, history);
    Points.add(POINTS.SIMULATION_COMPLETE);
  }, [view]);

  const activeLine = useMemo(() => {
    if (pendingCons) return pendingCons.lines[consIndex];
    return episode?.lines[lineIndex] || null;
  }, [consIndex, episode, lineIndex, pendingCons]);

  useEffect(() => {
    if (!activeLine) return;
    if (activeLine.character) setActiveSpeaker(activeLine.character);
    // Track lea's expression in a ref whenever she speaks
    if (activeLine.character === 'lea' && activeLine.expression) {
      pendingLeaExprRef.current = activeLine.expression;
    }
    // During narration lea is off-screen: safe to commit the expression change.
    // Look ahead for her next line; fall back to the last expression seen.
    if (activeLine.type === 'narration') {
      const lines = pendingCons ? pendingCons.lines : (episode?.lines || []);
      const idx   = pendingCons ? consIndex : lineIndex;
      const next  = lines.slice(idx + 1).find(l => l.character === 'lea');
      setLeaExpression(next?.expression || pendingLeaExprRef.current);
    }
  }, [activeLine]);

  // Typewriter for narration
  useEffect(() => {
    if (typingRef.current) clearInterval(typingRef.current);
    setTypedText('');
    setShowArrow(false);
    if (activeLine?.type !== 'narration' || showTitleCard) return;

    const full = activeLine.text;
    let idx = 0;
    typingRef.current = setInterval(() => {
      idx += 1;
      setTypedText(full.slice(0, idx));
      if (idx >= full.length) {
        clearInterval(typingRef.current);
        setShowArrow(true);
      }
    }, TYPEWRITER_MS);
    return () => clearInterval(typingRef.current);
  }, [activeLine, showTitleCard]);

  const cast = useMemo(
    () => (episode ? getCast(episode, pendingCons?.lines) : []),
    [episode, pendingCons]
  );

  const canAdvance = Boolean(activeLine) && !showChoices;

  // ── Actions ──────────────────────────────────────────────────────────────────

  function confirmExit() {
    Alert.alert(
      'Exit Simulation',
      'Your progress will be lost. Exit anyway?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: onExit },
      ]
    );
  }

  function resetStory() {
    const initEp = fertilityWindowScenario.episodes[fertilityWindowScenario.initialEpisodeId];
    setEpisodeId(fertilityWindowScenario.initialEpisodeId);
    setLineIndex(0);
    setScores(DEFAULT_SCORES);
    setHistory([]);
    setShowChoices(false);
    setPendingCons(null);
    setConsIndex(0);
    setShowTitleCard(true);
    setView('story');
    setActiveSpeaker(getFirstSpeaker(initEp.lines));
  }

  function handleAdvance() {
    if (showTitleCard) { setShowTitleCard(false); return; }

    if (activeLine?.type === 'narration' && typedText.length < activeLine.text.length) {
      if (typingRef.current) clearInterval(typingRef.current);
      setTypedText(activeLine.text);
      setShowArrow(true);
      return;
    }

    if (pendingCons) {
      if (consIndex < pendingCons.lines.length - 1) { setConsIndex(i => i + 1); return; }
      if (pendingCons.nextEpisodeId === fertilityWindowScenario.summaryEpisodeId) {
        setPendingCons(null); setView('summary'); return;
      }
      const nextId = pendingCons.nextEpisodeId;
      setPendingCons(null);
      setConsIndex(0);
      setEpisodeId(nextId);
      return;
    }

    if (lineIndex < episode.lines.length - 1) { setLineIndex(i => i + 1); return; }
    setShowChoices(true);
  }

  function handleChoice(choice) {
    setScores(s => applyScoreEffect(s, choice.effect));
    setHistory(h => [...h, {
      id: choice.id,
      age: episode.age,
      episodeId: episode.id,
      episodeTitle: episode.title,
      choiceLabel: choice.label,
      effect: choice.effect,
      consequenceSummary: flattenConsequence(choice),
      nextEpisodeId: choice.nextEpisodeId,
    }]);
    setShowChoices(false);
    setPendingCons({ choiceId: choice.id, lines: choice.consequence, nextEpisodeId: choice.nextEpisodeId });
    setConsIndex(0);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (view === 'summary') {
    return (
      <SafeAreaView style={styles.safe}>
        <StorySummary
          scenarioTitle={fertilityWindowScenario.title}
          scores={scores}
          history={history}
          onRestart={resetStory}
          onExit={onExit}
        />
      </SafeAreaView>
    );
  }

  const isNarration    = activeLine?.type === 'narration';
  const orderedCast    = orderCast(cast);
  const leaDisplayExpr = cast.includes('mara') ? 'sideM' : leaExpression;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={canAdvance ? handleAdvance : undefined}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.ageLabel}>Age {episode?.age}</Text>
              <Text style={styles.epTitle} numberOfLines={1}>{episode?.title}</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={confirmExit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.exitBtn}>✕ Exit</Text>
              </TouchableOpacity>
              <ScorePills scores={scores} />
            </View>
          </View>

          {/* Narration */}
          {isNarration && !showChoices && (
            <View style={styles.narrationArea}>
              <View style={styles.narrationCard}>
                <Text style={styles.narrationText}>
                  {typedText}
                  {showArrow ? <Text style={styles.narrationArrow}>{'  →'}</Text> : null}
                </Text>
              </View>
            </View>
          )}

          {/* Choices */}
          {showChoices && (
            <ScrollView
              style={styles.choiceScroll}
              contentContainerStyle={styles.choiceContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.choicePrompt}>What do you do?</Text>
              <ChoiceList choices={episode.choices} onSelect={handleChoice} />
            </ScrollView>
          )}

          {/* Dialogue — characters with thought bubbles */}
          {!isNarration && !showChoices && (
            <View style={styles.sceneArea}>
              <View style={styles.charRow}>
                {orderedCast.map(id => (
                  <CharacterWithBubble
                    key={id}
                    characterId={id}
                    isActive={id === activeSpeaker}
                    text={id === activeSpeaker ? (activeLine?.text || '') : ''}
                    speaker={id === activeSpeaker ? (activeLine?.speaker || '') : ''}
                    expression={
                      id === 'lea'
                        ? leaDisplayExpr
                        : (id === activeSpeaker ? (activeLine?.expression || 'base') : 'base')
                    }
                  />
                ))}
              </View>
            </View>
          )}

          {showTitleCard && (
            <EpisodeTitleCard
              title={episode.title}
              age={episode.age}
              onPress={() => setShowTitleCard(false)}
            />
          )}

        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: '#FFFFFF',
  },
  headerLeft:  { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  ageLabel: {
    fontSize: 11, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
  epTitle: { fontSize: 15, fontWeight: '700', color: PLUM, marginTop: 2 },
  exitBtn: {
    fontSize: 12, fontWeight: '700', color: ROSE,
    letterSpacing: 0.4,
  },

  // Narration
  narrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
    backgroundColor: BG,
  },
  narrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: PLUM,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    minHeight: 120,
  },
  narrationText: {
    fontSize: 17,
    fontWeight: '500',
    color: PLUM,
    lineHeight: 27,
    textAlign: 'center',
  },
  narrationArrow: {
    fontSize: 17,
    color: ROSE,
    fontWeight: '700',
  },

  // Choices
  choiceScroll:  { flex: 1 },
  choiceContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },
  choicePrompt:  { fontSize: 17, fontWeight: '700', color: PLUM, marginBottom: 16 },

  // Dialogue
  sceneArea: {
    flex: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  charRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  charSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // Thought bubble
  bubbleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  bubbleInvisible: { opacity: 0 },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: '100%',
    shadowColor: PLUM,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleTail: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: BORDER,
  },
  bubbleSpeaker: {
    fontSize: 10, fontWeight: '800', color: ROSE,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3,
  },
  bubbleText: { fontSize: 12, color: PLUM, lineHeight: 17 },

  // Character photo
  charImage: { width: '100%', height: IMAGE_H },
});
