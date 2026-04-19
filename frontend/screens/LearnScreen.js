import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Modal, Animated, Dimensions,
} from 'react-native';
import LeaAvatar from '../components/LeaAvatar';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';
import conditions from '../data/conditions.json';

const { width } = Dimensions.get('window');

export default function LearnScreen() {
  const [points, setPoints]         = useState(0);
  const [readCards, setReadCards]   = useState([]);
  const [selected, setSelected]     = useState(null); // open card
  const [toast, setToast]           = useState(null); // '+1 point!' message
  const [leaKey, setLeaKey]         = useState(0);   // forces LeaAvatar remount

  const toastAnim = useRef(new Animated.Value(0)).current;

  // ── Load progress from storage ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const p = await Storage.get(Storage.KEYS.USER_POINTS);
      const r = await Storage.get('read_cards');
      if (p !== null) setPoints(p);
      if (r) setReadCards(r);
    }
    load();
  }, []);

  // ── Show floating toast ─────────────────────────────────────────────────
  function showToast(msg) {
    setToast(msg);
    toastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast(null));
  }

  // ── Mark card as read, award point ─────────────────────────────────────
  async function handleReadCard(cardId) {
    if (readCards.includes(cardId)) return; // already read

    const newRead = [...readCards, cardId];
    setReadCards(newRead);
    await Storage.set('read_cards', newRead);

    const newTotal = await Points.add(POINTS.CONDITION_CARD_READ);
    setPoints(newTotal);
    setLeaKey(k => k + 1); // remount LeaAvatar so she re-reads storage
    showToast('+1 point! 🐾');
  }

  // ── Close modal ─────────────────────────────────────────────────────────
  function closeCard() {
    if (selected) handleReadCard(selected.id);
    setSelected(null);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>SECTION 1</Text>
          <Text style={styles.title}>Learn</Text>
          <Text style={styles.subtitle}>
            Read a card to earn a point and help Lea grow 🐾
          </Text>
        </View>

        {/* ── Lea ── */}
        <View style={styles.leaWrapper}>
          <LeaAvatar
            key={leaKey}
            size={200}
            showName={true}
            showProgress={true}
          />
        </View>

        {/* ── Points pill ── */}
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>⭐ {points} point{points !== 1 ? 's' : ''} earned</Text>
        </View>

        {/* ── Condition cards ── */}
        <Text style={styles.cardsHeading}>Health Condition Library</Text>
        <Text style={styles.cardsSubtitle}>
          Tap a card to read. Each card takes 3 minutes max.
        </Text>

        <View style={styles.cardGrid}>
          {conditions.map(card => {
            const isRead = readCards.includes(card.id);
            return (
              <TouchableOpacity
                key={card.id}
                style={[styles.card, isRead && styles.cardRead]}
                onPress={() => setSelected(card)}
                activeOpacity={0.75}
              >
                <Text style={styles.cardEmoji}>{card.emoji}</Text>
                <Text style={[styles.cardTitle, isRead && styles.cardTitleRead]}>
                  {card.title}
                </Text>
                <Text style={styles.cardSummary} numberOfLines={2}>
                  {card.summary}
                </Text>
                {isRead && (
                  <View style={styles.readBadge}>
                    <Text style={styles.readBadgeText}>✓ Read</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* DEV buttons — remove before demo */}
        <View style={styles.devRow}>
          <TouchableOpacity
            style={[styles.devBtn, { backgroundColor: '#E1F5FE' }]}
            onPress={async () => {
              await Storage.set(Storage.KEYS.USER_POINTS, 10);
              await Points.updateLeaStage(10);
              setPoints(10);
              setLeaKey(k => k + 1);
            }}
          >
            <Text style={styles.devBtnText}>🐶 Puppy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devBtn, { backgroundColor: '#F3E5F5' }]}
            onPress={async () => {
              await Storage.set(Storage.KEYS.USER_POINTS, 100);
              await Points.updateLeaStage(100);
              setPoints(100);
              setLeaKey(k => k + 1);
            }}
          >
            <Text style={styles.devBtnText}>🐕 Teen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.devBtn, { backgroundColor: '#E8F5E9' }]}
            onPress={async () => {
              await Storage.set(Storage.KEYS.USER_POINTS, 600);
              await Points.updateLeaStage(600);
              setPoints(600);
              setLeaKey(k => k + 1);
            }}
          >
            <Text style={styles.devBtnText}>🦮 Adult</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Card detail modal ── */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCard}
      >
        {selected && (
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalEmoji}>{selected.emoji}</Text>
              <Text style={styles.modalTitle}>{selected.title}</Text>
              <TouchableOpacity onPress={closeCard} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.modalSummary}>{selected.summary}</Text>
              <Text style={styles.modalBody}>{selected.body}</Text>
              <View style={styles.sourceRow}>
                <Text style={styles.sourceText}>📚 {selected.source}</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.doneBtn} onPress={closeCard}>
                <Text style={styles.doneBtnText}>
                  {readCards.includes(selected.id) ? 'Close' : 'Mark as read +1 🐾'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>

      {/* ── Toast ── */}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    paddingTop: 20,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0288D1',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#01579B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#546E7A',
    lineHeight: 20,
  },

  // Lea
  leaWrapper: {
    alignItems: 'center',
    marginVertical: 16,
  },

  // Points pill
  pointsPill: {
    alignSelf: 'center',
    backgroundColor: '#E1F5FE',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#01579B',
  },

  // Cards
  cardsHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#01579B',
    marginBottom: 4,
  },
  cardsSubtitle: {
    fontSize: 13,
    color: '#546E7A',
    marginBottom: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    width: (width - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#B3E5FC',
  },
  cardRead: {
    borderColor: '#0288D1',
    backgroundColor: '#FFFFFF',
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#01579B',
    marginBottom: 6,
  },
  cardTitleRead: {
    color: '#0288D1',
  },
  cardSummary: {
    fontSize: 12,
    color: '#546E7A',
    lineHeight: 17,
  },
  readBadge: {
    marginTop: 10,
    backgroundColor: '#0288D1',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  readBadgeText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Modal
  modalSafe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#B3E5FC',
    gap: 10,
  },
  modalEmoji: {
    fontSize: 28,
  },
  modalTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#01579B',
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 16,
    color: '#0277BD',
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  modalSummary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3A4A',
    lineHeight: 24,
    marginBottom: 16,
  },
  modalBody: {
    fontSize: 15,
    color: '#1A3A4A',
    lineHeight: 24,
    marginBottom: 20,
  },
  sourceRow: {
    backgroundColor: '#E1F5FE',
    borderRadius: 10,
    padding: 12,
  },
  sourceText: {
    fontSize: 12,
    color: '#01579B',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#B3E5FC',
  },
  doneBtn: {
    backgroundColor: '#0288D1',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Dev buttons
  devRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  devBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  devBtnText: {
    fontWeight: '700',
    fontSize: 12,
    color: '#333',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#01579B',
    borderRadius: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});