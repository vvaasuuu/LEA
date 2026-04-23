import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Points, POINTS } from '../utils/points';
import { Storage } from '../utils/storage';
import BackgroundScene from '../story/components/BackgroundScene';
import CharacterSprite from '../story/components/CharacterSprite';
import ChoiceList from '../story/components/ChoiceList';
import DialogueBox from '../story/components/DialogueBox';
import EpisodeTitleCard from '../story/components/EpisodeTitleCard';
import ScorePills from '../story/components/ScorePills';
import StorySummary from '../story/components/StorySummary';
import { fertilityWindowScenario, DEFAULT_SCORES, applyScoreEffect } from '../story/data/fertilityWindowScenario';

const TITLE_CARD_DURATION_MS = 1400;

function getFirstSpeakerCharacter(lines) {
  return lines.find((line) => line.character)?.character || 'lea';
}

function getCastForEpisode(episode, pendingLines) {
  const sourceLines = pendingLines ? [...episode.lines, ...pendingLines] : episode.lines;
  const characterIds = new Set();

  sourceLines.forEach((line) => {
    if (line.character) {
      characterIds.add(line.character);
    }
  });

  if (characterIds.size === 0) {
    characterIds.add('lea');
  }

  return Array.from(characterIds);
}

function flattenConsequenceSummary(choice) {
  return choice.consequence.map((line) => line.text).join(' ');
}

export default function StoryScreen() {
  const [currentEpisodeId, setCurrentEpisodeId] = useState(fertilityWindowScenario.initialEpisodeId);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [scores, setScores] = useState(DEFAULT_SCORES);
  const [history, setHistory] = useState([]);
  const [showChoices, setShowChoices] = useState(false);
  const [pendingConsequence, setPendingConsequence] = useState(null);
  const [consequenceIndex, setConsequenceIndex] = useState(0);
  const [showTitleCard, setShowTitleCard] = useState(true);
  const [view, setView] = useState('story');
  const [activeSpeaker, setActiveSpeaker] = useState(
    getFirstSpeakerCharacter(fertilityWindowScenario.episodes[fertilityWindowScenario.initialEpisodeId].lines)
  );

  const currentEpisode = fertilityWindowScenario.episodes[currentEpisodeId];

  useEffect(() => {
    if (!currentEpisode) {
      return undefined;
    }

    setCurrentLineIndex(0);
    setShowChoices(false);
    setPendingConsequence(null);
    setConsequenceIndex(0);
    setShowTitleCard(true);
    setActiveSpeaker(getFirstSpeakerCharacter(currentEpisode.lines));

    const timer = setTimeout(() => {
      setShowTitleCard(false);
    }, TITLE_CARD_DURATION_MS);

    return () => clearTimeout(timer);
  }, [currentEpisodeId, currentEpisode]);

  useEffect(() => {
    if (view !== 'summary') {
      return;
    }

    Storage.set(Storage.KEYS.SIMULATION_HISTORY, history);
    Points.add(POINTS.SIMULATION_COMPLETE);
  }, [history, view]);

  const activeLine = useMemo(() => {
    if (pendingConsequence) {
      return pendingConsequence.lines[consequenceIndex];
    }

    return currentEpisode?.lines[currentLineIndex] || null;
  }, [consequenceIndex, currentEpisode, currentLineIndex, pendingConsequence]);

  useEffect(() => {
    if (activeLine?.character) {
      setActiveSpeaker(activeLine.character);
    }
  }, [activeLine]);

  const backgroundId = activeLine?.background || currentEpisode?.background;
  const cast = useMemo(
    () => (currentEpisode ? getCastForEpisode(currentEpisode, pendingConsequence?.lines) : []),
    [currentEpisode, pendingConsequence]
  );

  const canAdvance = Boolean(activeLine) && !showChoices;

  function resetStory() {
    setCurrentEpisodeId(fertilityWindowScenario.initialEpisodeId);
    setCurrentLineIndex(0);
    setScores(DEFAULT_SCORES);
    setHistory([]);
    setShowChoices(false);
    setPendingConsequence(null);
    setConsequenceIndex(0);
    setShowTitleCard(true);
    setView('story');
    setActiveSpeaker(getFirstSpeakerCharacter(fertilityWindowScenario.episodes[fertilityWindowScenario.initialEpisodeId].lines));
  }

  function handleAdvance() {
    if (showTitleCard) {
      setShowTitleCard(false);
      return;
    }

    if (pendingConsequence) {
      if (consequenceIndex < pendingConsequence.lines.length - 1) {
        setConsequenceIndex((index) => index + 1);
        return;
      }

      if (pendingConsequence.nextEpisodeId === fertilityWindowScenario.summaryEpisodeId) {
        setPendingConsequence(null);
        setView('summary');
        return;
      }

      setCurrentEpisodeId(pendingConsequence.nextEpisodeId);
      return;
    }

    if (currentLineIndex < currentEpisode.lines.length - 1) {
      setCurrentLineIndex((index) => index + 1);
      return;
    }

    setShowChoices(true);
  }

  function handleChoiceSelect(choice) {
    setScores((currentScores) => applyScoreEffect(currentScores, choice.effect));
    setHistory((currentHistory) => [
      ...currentHistory,
      {
        id: choice.id,
        age: currentEpisode.age,
        episodeId: currentEpisode.id,
        episodeTitle: currentEpisode.title,
        choiceLabel: choice.label,
        effect: choice.effect,
        consequenceSummary: flattenConsequenceSummary(choice),
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
      <SafeAreaView style={styles.summarySafe}>
        <StatusBar barStyle="dark-content" />
        <StorySummary
          scenarioTitle={fertilityWindowScenario.title}
          scores={scores}
          history={history}
          onRestart={resetStory}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={canAdvance ? handleAdvance : undefined}>
        <View style={styles.container}>
          <BackgroundScene backgroundId={backgroundId} />

          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <Text style={styles.scenarioLabel}>Episode Story</Text>
              <ScorePills scores={scores} />
            </View>

            <View style={styles.sceneArea}>
              {cast.map((characterId) => (
                <CharacterSprite
                  key={characterId}
                  characterId={characterId}
                  expression={
                    characterId === activeSpeaker && activeLine?.expression
                      ? activeLine.expression
                      : 'base'
                  }
                  isActive={characterId === activeSpeaker}
                />
              ))}
            </View>

            <View style={styles.dialogueArea}>
              <DialogueBox
                line={activeLine}
                hint={
                  showChoices
                    ? null
                    : pendingConsequence
                      ? 'Tap to continue'
                      : currentLineIndex === currentEpisode.lines.length - 1
                        ? 'Tap for choices'
                        : 'Tap to continue'
                }
              >
                {showChoices ? (
                  <ChoiceList choices={currentEpisode.choices} onSelect={handleChoiceSelect} />
                ) : null}
              </DialogueBox>
            </View>
          </View>

          {showTitleCard ? (
            <EpisodeTitleCard
              title={currentEpisode.title}
              age={currentEpisode.age}
              onPress={() => setShowTitleCard(false)}
            />
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#151515',
  },
  summarySafe: {
    flex: 1,
    backgroundColor: '#F5EFE6',
  },
  container: {
    flex: 1,
    backgroundColor: '#151515',
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
  },
  topBar: {
    gap: 10,
  },
  scenarioLabel: {
    color: '#F8E3C5',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  sceneArea: {
    flex: 1,
    marginTop: 6,
    justifyContent: 'flex-end',
  },
  dialogueArea: {
    paddingBottom: 6,
  },
});
