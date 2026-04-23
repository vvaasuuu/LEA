import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function EpisodeTitleCard({ title, age, onPress }) {
  return (
    <Pressable style={styles.overlay} onPress={onPress}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Age {age}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.hint}>Tap to begin</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 18, 0.56)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(32, 23, 19, 0.92)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  eyebrow: {
    color: '#F3D8B6',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: {
    color: '#FFF9F2',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    textAlign: 'center',
  },
  hint: {
    marginTop: 16,
    color: '#D2C3B7',
    fontSize: 13,
    fontWeight: '600',
  },
});
