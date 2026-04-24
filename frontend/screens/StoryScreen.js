import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet,
  Text, TouchableOpacity, TouchableWithoutFeedback, View,
} from 'react-native';
import { Points, POINTS } from '../utils/points';
import { Storage } from '../utils/storage';
import { getCharacterSprite } from '../story/assets/storyAssets';
import ChoiceList from '../story/components/ChoiceList';
import EpisodeTitleCard from '../story/components/EpisodeTitleCard';
import ScorePills from '../story/components/ScorePills';
import StorySummary from '../story/components/StorySummary';
import { STORY_SCENARIOS } from '../story/data/scenarios';

const PLUM = '#3D0C4E';
const ROSE = '#C2185B';
const BORDER = '#EDD5E4';
const BG = '#FFF5F8';

const { height: SCREEN_H } = Dimensions.get('window');
const IMAGE_H = SCREEN_H * 0.52;
const TYPEWRITER_MS = 28;

function getFirstSpeaker(lines) {
  return lines.find((line) => line.character)?.character || 'lea';
}

function getCast(episode, pendingLines) {
  const sourceLines = pendingLines || episode.lines;
  const ids = new Set();

  sourceLines.forEach((line) => {
    if (line.character) {
      ids.add(line.character);
    }
  });

  if (ids.size === 0) {
    ids.add('lea');
  }

  return Array.from(ids);
}

function orderCast(cast) {
  const hasLea = cast.includes('lea');
  const hasMara = cast.includes('mara');
  const hasDoctor = cast.includes('drlin');
  const hasMum = cast.includes('mum');

  if (cast.length === 2 && hasLea && hasMara) return ['mara', 'lea'];
  if (cast.length === 2 && hasLea && hasDoctor) return ['lea', 'drlin'];
  if (cast.length === 2 && hasLea && hasMum) return ['mum', 'lea'];
  return cast;
}

function flattenConsequence(choice) {
  return choice.consequence.map((line) => line.text).join(' ');
}

function applyScoreEffect(currentScores, effect) {
  return Object.keys(currentScores).reduce((nextScores, key) => {
    nextScores[key] = (currentScores[key] || 0) + (effect[key] || 0);
    return nextScores;
  }, {});
}

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

export default function StoryScreen({ scenario = STORY_SCENARIOS[0], onExit }) {
  const [episodeId, setEpisodeId] = useState(scenario.initialEpisodeId);
  const [lineIndex, setLineIndex] = useState(0);
  const [scores, setScores] = useState({ ...scenario.initialScores });
  const [history, setHistory] = useState([]);
  const [showChoices, setShowChoices] = useState(false);
  const [pendingConsequence, setPendingConsequence] = useState(null);
  const [consequenceIndex, setConsequenceIndex] = useState(0);
  const [showTitleCard, setShowTitleCard] = useState(true);
  const [view, setView] = useState('story');
  const [activeSpeaker, setActiveSpeaker] = useState(
    getFirstSpeaker(scenario.episodes[scenario.initialEpisodeId].lines)
  );
  const [typedText, setTypedText] = useState('');
  const [showArrow, setShowArrow] = useState(false);
  const [leaExpression, setLeaExpression] = useState('base');

  const episode = scenario.episodes[episodeId];
  const typingRef = useRef(null);
  const pendingLeaExpressionRef = useRef('base');

  useEffect(() => {
    setEpisodeId(scenario.initialEpisodeId);
    setLineIndex(0);
    setScores({ ...scenario.initialScores });
    setHistory([]);
    setShowChoices(false);
    setPendingConsequence(null);
    setConsequenceIndex(0);
    setShowTitleCard(true);
    setView('story');
    setActiveSpeaker(getFirstSpeaker(scenario.episodes[scenario.initialEpisodeId].lines));
    setTypedText('');
    setShowArrow(false);
    setLeaExpression('base');
  }, [scenario]);

  useEffect(() => {
    if (!episode) return;

    setLineIndex(0);
    setShowChoices(false);
    setPendingConsequence(null);
    setConsequenceIndex(0);
    setShowTitleCard(true);
    setActiveSpeaker(getFirstSpeaker(episode.lines));

    const firstLeaLine = episode.lines.find((line) => line.character === 'lea');
    const expression = firstLeaLine?.expression || 'base';
    pendingLeaExpressionRef.current = expression;
    setLeaExpression(expression);
  }, [episodeId, episode]);

  useEffect(() => {
    if (view !== 'summary') return;

    Storage.set(Storage.KEYS.SIMULATION_HISTORY, history);
    Points.add(POINTS.SIMULATION_COMPLETE);
  }, [history, view]);

  const activeLine = useMemo(() => {
    if (pendingConsequence) {
      return pendingConsequence.lines[consequenceIndex];
    }
    return episode?.lines[lineIndex] || null;
  }, [consequenceIndex, episode, lineIndex, pendingConsequence]);

  useEffect(() => {
    if (!activeLine) return;

    if (activeLine.character) {
      setActiveSpeaker(activeLine.character);
    }

    if (activeLine.character === 'lea' && activeLine.expression) {
      pendingLeaExpressionRef.current = activeLine.expression;
    }

    if (activeLine.type === 'narration') {
      const sourceLines = pendingConsequence ? pendingConsequence.lines : (episode?.lines || []);
      const sourceIndex = pendingConsequence ? consequenceIndex : lineIndex;
      const nextLeaLine = sourceLines.slice(sourceIndex + 1).find((line) => line.character === 'lea');
      setLeaExpression(nextLeaLine?.expression || pendingLeaExpressionRef.current);
    }
  }, [activeLine, consequenceIndex, episode, lineIndex, pendingConsequence]);

  useEffect(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
    }

    setTypedText('');
    setShowArrow(false);

    if (activeLine?.type !== 'narration' || showTitleCard) {
      return undefined;
    }

    const fullText = activeLine.text;
    let index = 0;

    typingRef.current = setInterval(() => {
      index += 1;
      setTypedText(fullText.slice(0, index));

      if (index >= fullText.length) {
        clearInterval(typingRef.current);
        setShowArrow(true);
      }
    }, TYPEWRITER_MS);

    return () => clearInterval(typingRef.current);
  }, [activeLine, showTitleCard]);

  const cast = useMemo(
    () => (episode ? getCast(episode, pendingConsequence?.lines) : []),
    [episode, pendingConsequence]
  );

  const canAdvance = Boolean(activeLine) && !showChoices;
  const isNarration = activeLine?.type === 'narration';
  const orderedCast = orderCast(cast);
  const leaDisplayExpression = cast.includes('mara') ? 'sideM' : leaExpression;

  function confirmExit() {
    if (!onExit) return;

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
    const initialEpisode = scenario.episodes[scenario.initialEpisodeId];
    setEpisodeId(scenario.initialEpisodeId);
    setLineIndex(0);
    setScores({ ...scenario.initialScores });
    setHistory([]);
    setShowChoices(false);
    setPendingConsequence(null);
    setConsequenceIndex(0);
    setShowTitleCard(true);
    setView('story');
    setActiveSpeaker(getFirstSpeaker(initialEpisode.lines));
    setTypedText('');
    setShowArrow(false);
    setLeaExpression('base');
  }

  function handleAdvance() {
    if (showTitleCard) {
      setShowTitleCard(false);
      return;
    }

    if (activeLine?.type === 'narration' && typedText.length < activeLine.text.length) {
      if (typingRef.current) {
        clearInterval(typingRef.current);
      }
      setTypedText(activeLine.text);
      setShowArrow(true);
      return;
    }

    if (pendingConsequence) {
      if (consequenceIndex < pendingConsequence.lines.length - 1) {
        setConsequenceIndex((currentIndex) => currentIndex + 1);
        return;
      }

      if (pendingConsequence.nextEpisodeId === scenario.summaryEpisodeId) {
        setPendingConsequence(null);
        setView('summary');
        return;
      }

      const nextEpisodeId = pendingConsequence.nextEpisodeId;
      setPendingConsequence(null);
      setConsequenceIndex(0);
      setEpisodeId(nextEpisodeId);
      return;
    }

    if (lineIndex < episode.lines.length - 1) {
      setLineIndex((currentIndex) => currentIndex + 1);
      return;
    }

    setShowChoices(true);
  }

  function handleChoice(choice) {
    setScores((currentScores) => applyScoreEffect(currentScores, choice.effect));
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        id: choice.id,
        age: episode.age,
        episodeId: episode.id,
        episodeTitle: episode.title,
        choiceLabel: choice.label,
        effect: choice.effect,
        consequenceSummary: flattenConsequence(choice),
        nextEpisodeId: choice.nextEpisodeId,
      },
    ]);
    setShowChoices(false);
    setPendingConsequence({
      choiceId: choice.id,
      lines: choice.consequence,
      nextEpisodeId: choice.nextEpisodeId,
    });
    setConsequenceIndex(0);
  }

  if (view === 'summary') {
    return (
      <SafeAreaView style={styles.safe}>
        <StorySummary
          scenarioTitle={scenario.title}
          endingText={scenario.getEndingText(scores)}
          scores={scores}
          scoreLabels={scenario.scoreLabels}
          scoreColors={scenario.scoreColors}
          history={history}
          onRestart={resetStory}
          onExit={onExit}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={canAdvance ? handleAdvance : undefined}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.ageLabel}>Age {episode?.age}</Text>
              <Text style={styles.epTitle} numberOfLines={1}>{episode?.title}</Text>
            </View>

            <View style={styles.headerRight}>
              {onExit ? (
                <TouchableOpacity onPress={confirmExit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.exitButton}>Exit</Text>
                </TouchableOpacity>
              ) : null}

              <ScorePills
                scores={scores}
                scoreLabels={scenario.scoreLabels}
                scoreColors={scenario.scoreColors}
              />
            </View>
          </View>

          {isNarration && !showChoices ? (
            <View style={styles.narrationArea}>
              <View style={styles.narrationCard}>
                <Text style={styles.narrationText}>
                  {typedText}
                  {showArrow ? <Text style={styles.narrationArrow}>  -&gt;</Text> : null}
                </Text>
              </View>
            </View>
          ) : null}

          {showChoices ? (
            <ScrollView
              style={styles.choiceScroll}
              contentContainerStyle={styles.choiceContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.choicePrompt}>What do you do?</Text>
              <ChoiceList
                choices={episode.choices}
                onSelect={handleChoice}
                scoreLabels={scenario.scoreLabels}
                scoreColors={scenario.scoreColors}
              />
            </ScrollView>
          ) : null}

          {!isNarration && !showChoices ? (
            <View style={styles.sceneArea}>
              <View style={styles.charRow}>
                {orderedCast.map((characterId) => (
                  <CharacterWithBubble
                    key={characterId}
                    characterId={characterId}
                    isActive={characterId === activeSpeaker}
                    text={characterId === activeSpeaker ? (activeLine?.text || '') : ''}
                    speaker={characterId === activeSpeaker ? (activeLine?.speaker || '') : ''}
                    expression={
                      characterId === 'lea'
                        ? leaDisplayExpression
                        : (characterId === activeSpeaker ? (activeLine?.expression || 'base') : 'base')
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}

          {showTitleCard ? (
            <EpisodeTitleCard
              title={episode.title}
              age={episode.age}
              onPress={() => setShowTitleCard(false)}
            />
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
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
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 8 },
  ageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: ROSE,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  epTitle: {
    marginTop: 2,
    color: PLUM,
    fontSize: 15,
    fontWeight: '700',
  },
  exitButton: {
    color: ROSE,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  narrationArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  narrationCard: {
    width: '100%',
    minHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: PLUM,
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  narrationText: {
    color: PLUM,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 27,
    textAlign: 'center',
  },
  narrationArrow: {
    color: ROSE,
    fontSize: 17,
    fontWeight: '700',
  },
  choiceScroll: { flex: 1 },
  choiceContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  choicePrompt: {
    marginBottom: 16,
    color: PLUM,
    fontSize: 17,
    fontWeight: '700',
  },
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
  bubbleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  bubbleInvisible: {
    opacity: 0,
  },
  bubble: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: PLUM,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: BORDER,
  },
  bubbleSpeaker: {
    marginBottom: 3,
    color: ROSE,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  bubbleText: {
    color: PLUM,
    fontSize: 12,
    lineHeight: 17,
  },
  charImage: {
    width: '100%',
    height: IMAGE_H,
  },
});
