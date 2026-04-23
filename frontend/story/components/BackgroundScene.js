import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { getBackgroundAsset } from '../assets/storyAssets';

export default function BackgroundScene({ backgroundId }) {
  return (
    <ImageBackground
      source={getBackgroundAsset(backgroundId)}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.scrim} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 23, 32, 0.28)',
  },
});
