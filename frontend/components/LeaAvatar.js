import React, { useEffect, useState } from 'react';
import {
  View, Image, StyleSheet, Text
} from 'react-native';
import { Storage } from '../utils/storage';

const STAGE_IMAGES = {
  puppy: [
    require('../assets/dogs/Puppy open eyes.png'),
    require('../assets/dogs/puppy eyes closed.png'),
  ],
  young: [
    require('../assets/dogs/teen1 eyes open.png'),
    require('../assets/dogs/teen1 eyes closed.png'),
  ],
  adult: [
    require('../assets/dogs/adult dog eyes open tail up.png'),
    require('../assets/dogs/adult dog eyes closed tail down.png'),
  ],
};

const STAGE_LABELS = {
  puppy: 'Puppy',
  young: 'Growing up',
  adult: 'All grown up 🎉',
};

const THRESHOLDS = { young: 50, adult: 500 };

export default function LeaAvatar({ size = 160, showName = true, showProgress = true }) {
  const [stage, setStage]         = useState('puppy');
  const [leaName, setLeaName]     = useState('Lea');
  const [points, setPoints]       = useState(0);
  const [poseIndex, setPoseIndex] = useState(0);

  useEffect(() => {
    async function load() {
      const s = await Storage.get(Storage.KEYS.LEA_STAGE);
      const n = await Storage.get(Storage.KEYS.LEA_NAME);
      const p = await Storage.get(Storage.KEYS.USER_POINTS);
      if (s) setStage(s);
      if (n) setLeaName(n);
      if (p !== null) setPoints(p);
    }
    load();
  }, []);

  // Blink every 3.5s: switch to closed-eyes image for 200ms then reopen
  useEffect(() => {
    setPoseIndex(0);
    const interval = setInterval(() => {
      setPoseIndex(1);
      setTimeout(() => setPoseIndex(0), 200);
    }, 3500);
    return () => clearInterval(interval);
  }, [stage]);

  function getProgress() {
    if (stage === 'adult') return 1;
    const nextThreshold = stage === 'puppy' ? THRESHOLDS.young : THRESHOLDS.adult;
    const prevThreshold = stage === 'puppy' ? 0 : THRESHOLDS.young;
    const range = nextThreshold - prevThreshold;
    const earned = points - prevThreshold;
    return Math.min(Math.max(earned / range, 0), 1);
  }

  function getNextMilestone() {
    if (stage === 'adult') return null;
    const next = stage === 'puppy' ? THRESHOLDS.young : THRESHOLDS.adult;
    const remaining = next - points;
    return remaining > 0 ? remaining : 0;
  }

  const images  = STAGE_IMAGES[stage] ?? STAGE_IMAGES.puppy;
  const progress  = getProgress();
  const remaining = getNextMilestone();

  return (
    <View style={styles.container}>
      {/* Both images stacked; closed-eyes overlays open-eyes when blinking */}
      <View style={[styles.imageWrapper, { width: size, height: size }]}>
        <Image
          source={images[0]}
          style={[styles.image, { width: size, height: size }]}
          resizeMode="contain"
        />
        <Image
          source={images[1]}
          style={[styles.image, styles.imageOverlay, { width: size, height: size, opacity: poseIndex === 1 ? 1 : 0 }]}
          resizeMode="contain"
        />
      </View>

      {showName && (
        <View style={styles.nameRow}>
          <Text style={styles.name}>{leaName}</Text>
          <View style={styles.stageBadge}>
            <Text style={styles.stageText}>{STAGE_LABELS[stage]}</Text>
          </View>
        </View>
      )}

      {showProgress && stage !== 'adult' && (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
          {remaining !== null && remaining > 0 && (
            <Text style={styles.progressHint}>
              {remaining} more point{remaining !== 1 ? 's' : ''} until {stage === 'puppy' ? 'she grows up' : 'fully grown'} ✨
            </Text>
          )}
        </View>
      )}

      {stage === 'adult' && showProgress && (
        <Text style={styles.adultMessage}>Lea is fully grown 🐾</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
  imageOverlay: { position: 'absolute', top: 0, left: 0 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#01579B',
  },
  stageBadge: {
    backgroundColor: '#E1F5FE',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stageText: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '600',
  },
  progressSection: {
    width: '80%',
    marginTop: 12,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#B3E5FC',
    borderRadius: 100,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0288D1',
    borderRadius: 100,
  },
  progressHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#0277BD',
    textAlign: 'center',
  },
  adultMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#01579B',
    fontWeight: '600',
  },
});
