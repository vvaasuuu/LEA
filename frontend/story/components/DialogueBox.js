import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function DialogueBox({ line, hint, children }) {
  const isNarration = line?.type === 'narration';

  return (
    <View style={styles.box}>
      <Text style={[styles.name, isNarration && styles.narrationName]}>
        {isNarration ? 'Narration' : line?.speaker || ''}
      </Text>
      <Text style={[styles.text, isNarration && styles.narrationText]}>
        {line?.text || ''}
      </Text>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(250, 243, 232, 0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(86, 64, 47, 0.18)',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  name: {
    color: '#7E3F37',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  narrationName: {
    color: '#4F5D75',
  },
  text: {
    color: '#261A15',
    fontSize: 19,
    lineHeight: 28,
    fontWeight: '500',
  },
  narrationText: {
    color: '#36454F',
  },
  hint: {
    marginTop: 12,
    color: '#7A6C62',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
});
