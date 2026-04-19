import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function SimulationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.icon}>🖥️</Text>
        <Text style={styles.title}>Simulation</Text>
        <Text style={styles.subtitle}>Coming Soon</Text>
        <Text style={styles.desc}>
          Interactive health simulations are on their way.{'\n'}Stay tuned!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#FFFFFF' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  icon:      { fontSize: 56, marginBottom: 20 },
  title:     { fontSize: 28, fontWeight: '800', color: '#01579B', marginBottom: 8 },
  subtitle:  { fontSize: 18, fontWeight: '600', color: '#0288D1', marginBottom: 16 },
  desc:      { fontSize: 15, color: '#90A4AE', textAlign: 'center', lineHeight: 22 },
});
