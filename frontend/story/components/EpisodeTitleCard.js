import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const PLUM = '#3D0C4E';
const ROSE = '#C2185B';

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
    backgroundColor: 'rgba(255, 240, 248, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EDD5E4',
    shadowColor: PLUM,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  eyebrow: {
    color: ROSE,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  title: {
    color: PLUM,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  hint: {
    marginTop: 20,
    color: '#B39DBC',
    fontSize: 13,
    fontWeight: '600',
  },
});
