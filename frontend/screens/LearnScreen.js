import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Modal, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import LeaAvatar from '../components/LeaAvatar';
import { Storage } from '../utils/storage';
import { Points } from '../utils/points';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CYCLE_LENGTH = 27;
const PERIOD_DAYS  = 5;

function defaultLastPeriod() {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  return d.toISOString().split('T')[0];
}

function getPredictions(lastPeriodStr, count = 5) {
  const last  = new Date(lastPeriodStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(last);
  while (next <= today) next = new Date(next.getTime() + CYCLE_LENGTH * 86400000);
  const list = [];
  for (let i = 0; i < count; i++) {
    list.push({
      start: new Date(next),
      end:   new Date(next.getTime() + (PERIOD_DAYS - 1) * 86400000),
    });
    next = new Date(next.getTime() + CYCLE_LENGTH * 86400000);
  }
  return list;
}

function daysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.round((d - today) / 86400000);
}

function fmt(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtLong(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getFertilityWindow(lastPeriodStr) {
  const last  = new Date(lastPeriodStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let start = new Date(last);
  while (new Date(start.getTime() + CYCLE_LENGTH * 86400000) < today) {
    start = new Date(start.getTime() + CYCLE_LENGTH * 86400000);
  }
  return {
    fertileStart: new Date(start.getTime() + 9  * 86400000),
    fertileEnd:   new Date(start.getTime() + 13 * 86400000),
    ovulation:    new Date(start.getTime() + 12 * 86400000),
  };
}

// ── Period Tracker Widget ────────────────────────────────────────────────────
function PeriodWidget({ lastPeriodDate }) {
  const [expanded, setExpanded] = useState(false);
  const predictions = getPredictions(lastPeriodDate);
  const n = daysUntil(predictions[0].start);
  const countdown = n <= 0 ? 'Starting around today' : n === 1 ? 'Tomorrow' : `In ${n} days`;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(e => !e);
  };

  return (
    <View style={styles.widget}>
      <TouchableOpacity style={styles.widgetRow} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.widgetIconCircle}>
          <Text style={{ fontSize: 22 }}>🩸</Text>
        </View>
        <View style={styles.widgetBody}>
          <Text style={styles.widgetLabel}>Period Tracker</Text>
          <Text style={styles.widgetValue}>{countdown}</Text>
          <Text style={styles.widgetSub}>{fmt(predictions[0].start)} – {fmt(predictions[0].end)}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          <View style={styles.expandDivider} />
          <Text style={styles.expandHeading}>UPCOMING PERIODS</Text>
          {predictions.map((p, i) => (
            <View key={i} style={[styles.predRow, i === predictions.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={styles.predMonth}>{fmtLong(p.start)}</Text>
              <Text style={styles.predRange}>{fmt(p.start)} – {fmt(p.end)}</Text>
            </View>
          ))}
          <Text style={styles.cycleNote}>
            {CYCLE_LENGTH}-day cycle · {PERIOD_DAYS}-day period · predictions only
          </Text>
        </View>
      )}
    </View>
  );
}

// ── Fertility Window Widget ──────────────────────────────────────────────────
function FertilityWidget({ lastPeriodDate }) {
  const { fertileStart, fertileEnd, ovulation } = getFertilityWindow(lastPeriodDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isActive = today >= fertileStart && today <= fertileEnd;

  return (
    <View style={[styles.widget, isActive && styles.widgetActive]}>
      <View style={styles.widgetRow}>
        <View style={[styles.widgetIconCircle, isActive && { backgroundColor: '#FFF3E0' }]}>
          <Text style={{ fontSize: 22 }}>🌸</Text>
        </View>
        <View style={styles.widgetBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.widgetLabel}>Fertility Window</Text>
            <View style={styles.mockBadge}>
              <Text style={styles.mockBadgeText}>Mock</Text>
            </View>
          </View>
          <Text style={styles.widgetValue}>
            {isActive ? 'Active now' : `${fmt(fertileStart)} – ${fmt(fertileEnd)}`}
          </Text>
          <Text style={styles.widgetSub}>Est. ovulation: {fmt(ovulation)}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Available widgets catalogue ──────────────────────────────────────────────
const WIDGET_CATALOGUE = [
  { id: 'period_tracker',   emoji: '🩸', label: 'Period Tracker',   desc: 'Predicted dates for your next 5 cycles' },
  { id: 'fertility_window', emoji: '🌸', label: 'Fertility Window', desc: 'Estimated fertile days (mock data)' },
];

// ── Screen ───────────────────────────────────────────────────────────────────
export default function LearnScreen() {
  const [points,        setPoints]        = useState(0);
  const [leaKey,        setLeaKey]        = useState(0);
  const [activeWidgets, setActiveWidgets] = useState([]);
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [lastPeriod,    setLastPeriod]    = useState(defaultLastPeriod());

  useEffect(() => {
    async function load() {
      const p = await Storage.get(Storage.KEYS.USER_POINTS);
      const w = await Storage.get('active_widgets');
      const d = await Storage.get('last_period_date');
      if (p !== null) setPoints(p);
      if (w)          setActiveWidgets(w);
      if (d)          setLastPeriod(d);
      else            await Storage.set('last_period_date', defaultLastPeriod());
    }
    load();
  }, []);

  async function addWidget(id) {
    const next = [...activeWidgets, id];
    setActiveWidgets(next);
    await Storage.set('active_widgets', next);
    setShowAddModal(false);
  }

  const available = WIDGET_CATALOGUE.filter(w => !activeWidgets.includes(w.id));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>SECTION 1</Text>
          <Text style={styles.title}>Learn</Text>
        </View>

        {/* Lea */}
        <View style={styles.leaWrapper}>
          <LeaAvatar key={leaKey} size={200} showName showProgress />
        </View>

        {/* Points */}
        <View style={styles.pointsPill}>
          <Text style={styles.pointsText}>⭐ {points} point{points !== 1 ? 's' : ''} earned</Text>
        </View>

        {/* My Health */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Health</Text>
            {available.length > 0 && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>＋</Text>
              </TouchableOpacity>
            )}
          </View>

          {activeWidgets.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>No widgets yet</Text>
              <Text style={styles.emptyHint}>Tap ＋ to add health widgets</Text>
            </View>
          )}

          {activeWidgets.includes('period_tracker')   && <PeriodWidget    lastPeriodDate={lastPeriod} />}
          {activeWidgets.includes('fertility_window') && <FertilityWidget lastPeriodDate={lastPeriod} />}
        </View>

        {/* Dev stage buttons */}
        <View style={styles.devRow}>
          {[
            { label: '🐶 Puppy', pts: 10 },
            { label: '🐕 Teen',  pts: 100 },
            { label: '🦮 Adult', pts: 600 },
          ].map(({ label, pts }) => (
            <TouchableOpacity
              key={label}
              style={styles.devBtn}
              onPress={async () => {
                await Storage.set(Storage.KEYS.USER_POINTS, pts);
                await Points.updateLeaStage(pts);
                setPoints(pts);
                setLeaKey(k => k + 1);
              }}
            >
              <Text style={styles.devBtnText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Add Widget bottom sheet */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowAddModal(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Widget</Text>
            {available.map(w => (
              <TouchableOpacity key={w.id} style={styles.sheetOption} onPress={() => addWidget(w.id)} activeOpacity={0.7}>
                <Text style={styles.sheetEmoji}>{w.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetLabel}>{w.label}</Text>
                  <Text style={styles.sheetDesc}>{w.desc}</Text>
                </View>
                <Text style={styles.sheetAdd}>＋</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  header: { paddingTop: 20, marginBottom: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#0288D1', letterSpacing: 1.5, marginBottom: 4 },
  title:  { fontSize: 32, fontWeight: '800', color: '#01579B' },

  leaWrapper: { alignItems: 'center', marginVertical: 8 },

  pointsPill: {
    alignSelf: 'center', backgroundColor: '#E1F5FE',
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 28,
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: '#01579B' },

  // Section
  section:       { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle:  { fontSize: 20, fontWeight: '700', color: '#01579B' },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#0288D1', alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontSize: 22, lineHeight: 28, fontWeight: '300' },

  // Empty state
  emptyState: {
    backgroundColor: '#F8FBFF', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#E1F5FE',
    borderStyle: 'dashed',
  },
  emptyIcon:  { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#546E7A', marginBottom: 4 },
  emptyHint:  { fontSize: 13, color: '#90A4AE', textAlign: 'center' },

  // Widget card
  widget: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#B3E5FC',
    shadowColor: '#0288D1', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  widgetActive: { borderColor: '#FFB300', backgroundColor: '#FFFDE7' },
  widgetRow:    { flexDirection: 'row', alignItems: 'center' },
  widgetIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  widgetBody:  { flex: 1 },
  widgetLabel: { fontSize: 13, fontWeight: '600', color: '#546E7A' },
  widgetValue: { fontSize: 17, fontWeight: '700', color: '#01579B', marginTop: 2 },
  widgetSub:   { fontSize: 12, color: '#90A4AE', marginTop: 2 },
  chevron:     { fontSize: 20, color: '#0288D1', paddingLeft: 8 },

  mockBadge:     { backgroundColor: '#F3E5F5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  mockBadgeText: { fontSize: 10, color: '#9C27B0', fontWeight: '600' },

  // Expanded period list
  expanded:      { marginTop: 14 },
  expandDivider: { height: 1, backgroundColor: '#E1F5FE', marginBottom: 12 },
  expandHeading: { fontSize: 11, fontWeight: '700', color: '#0288D1', letterSpacing: 1.2, marginBottom: 8 },
  predRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F8FF',
  },
  predMonth: { fontSize: 14, fontWeight: '600', color: '#01579B' },
  predRange: { fontSize: 14, color: '#0288D1' },
  cycleNote: { marginTop: 12, fontSize: 11, color: '#90A4AE', textAlign: 'center' },

  // Dev
  devRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 8 },
  devBtn: { backgroundColor: '#E1F5FE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  devBtnText: { fontWeight: '700', fontSize: 12, color: '#01579B' },

  // Bottom sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 20, fontWeight: '700', color: '#01579B', marginBottom: 20 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F8FF' },
  sheetEmoji:  { fontSize: 28, marginRight: 16 },
  sheetLabel:  { fontSize: 16, fontWeight: '600', color: '#01579B' },
  sheetDesc:   { fontSize: 13, color: '#546E7A', marginTop: 2 },
  sheetAdd:    { fontSize: 22, color: '#0288D1', fontWeight: '300' },
  cancelBtn:   { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: '#F0F8FF' },
  cancelText:  { fontSize: 16, fontWeight: '600', color: '#0288D1' },
});
