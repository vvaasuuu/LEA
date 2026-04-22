import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { WeeklyCheckInUtil } from '../utils/weeklyCheckIn';
import weeklyActions from '../data/weekly_actions.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PRIORITIES = [
  { key: 'health',  emoji: '🌿', label: 'Health' },
  { key: 'career',  emoji: '💼', label: 'Career' },
  { key: 'balance', emoji: '🌸', label: 'Balance' },
];

// ── Idle / Reminder Card ──────────────────────────────────────────────────────
function IdleCard({ isReminder, onSelect }) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{isReminder ? 'STILL HERE FOR YOU' : 'THIS WEEK'}</Text>
      <Text style={styles.question}>
        {isReminder
          ? 'No rush — what would you like to focus on?'
          : 'What do you want to focus on?'}
      </Text>
      <View style={styles.optionsRow}>
        {PRIORITIES.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={styles.optionBtn}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.optionEmoji}>{opt.emoji}</Text>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Action Card ───────────────────────────────────────────────────────────────
function ActionCard({ action, accent, bubbleBg, onComplete, onSkip, onReplace }) {
  if (action.skipped) return null;

  return (
    <View style={[styles.actionCard, action.completed && { opacity: 0.65 }]}>
      {/* Emoji bubble */}
      <View style={[styles.emojiBubble, { backgroundColor: bubbleBg }]}>
        <Text style={styles.actionEmoji}>{action.emoji}</Text>
      </View>

      {/* Text */}
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionTitle, action.completed && styles.actionTitleDone]}>
          {action.title}
        </Text>
        {!action.completed && (
          <View style={styles.actionLinks}>
            <TouchableOpacity onPress={() => onSkip(action.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}>
              <Text style={[styles.linkText, { color: accent }]}>Skip</Text>
            </TouchableOpacity>
            <Text style={styles.linkDot}>·</Text>
            <TouchableOpacity onPress={() => onReplace(action.id)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Text style={[styles.linkText, { color: accent }]}>↻ Swap</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, action.completed && { backgroundColor: accent, borderColor: accent }]}
        onPress={() => !action.completed && onComplete(action.id)}
        activeOpacity={0.7}
      >
        {action.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ── Active Card ───────────────────────────────────────────────────────────────
function ActiveCard({ state, onComplete, onSkip, onReplace, onChangePriority }) {
  const data    = weeklyActions[state.priority];
  const visible = (state.actions || []).filter(a => !a.skipped);
  const done    = visible.filter(a => a.completed).length;
  const allDone = done === visible.length && visible.length > 0;

  return (
    <View style={[styles.card, { backgroundColor: data.color, borderColor: data.borderColor }]}>

      {/* Header row */}
      <View style={styles.cardTop}>
        <View style={[styles.priorityPill, { borderColor: data.accentColor + '50' }]}>
          <Text style={[styles.priorityPillText, { color: data.accentColor }]}>
            {data.emoji}  {data.label}
          </Text>
        </View>
        <TouchableOpacity onPress={onChangePriority} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.linkText, { color: data.accentColor }]}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Progress row */}
      {visible.length > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressDots}>
            {visible.map((a, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: a.completed ? data.accentColor : data.accentColor + '30' }]}
              />
            ))}
          </View>
          <Text style={[styles.progressLabel, { color: data.accentColor }]}>
            {allDone ? 'All done this week 🎉' : done === 0 ? 'Tap to mark done' : `${done} of ${visible.length} done`}
          </Text>
        </View>
      )}

      {/* Action cards */}
      {visible.length === 0 ? (
        <Text style={[styles.allSkipped, { color: data.accentColor }]}>
          All skipped — that's okay 🌿
        </Text>
      ) : (
        <View style={styles.actionsList}>
          {visible.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              accent={data.accentColor}
              bubbleBg={data.accentColor + '18'}
              onComplete={onComplete}
              onSkip={onSkip}
              onReplace={onReplace}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Reflection Card ───────────────────────────────────────────────────────────
const REFLECT_OPTIONS = ['Yes, mostly', 'Somewhat', 'Not really'];
const REFLECT_EXTRAS  = ['Too busy', 'Low energy', 'Unexpected things came up', "Goals didn't feel right"];

function ReflectionCard({ state, onSave }) {
  const [response, setResponse] = useState(null);
  const [extras,   setExtras]   = useState([]);

  function toggleExtra(label) {
    setExtras(prev => prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label]);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>END OF WEEK  ✦</Text>
      <Text style={styles.question}>Did this week feel aligned?</Text>

      <View style={styles.reflectRow}>
        {REFLECT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.reflectBtn, response === opt && styles.reflectBtnActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setResponse(opt);
            }}
            activeOpacity={0.75}
          >
            <Text style={[styles.reflectBtnText, response === opt && styles.reflectBtnTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {response && response !== 'Yes, mostly' && (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.extraLabel}>What felt off? (optional)</Text>
          <View style={styles.chipRow}>
            {REFLECT_EXTRAS.map(label => (
              <TouchableOpacity
                key={label}
                style={[styles.chip, extras.includes(label) && styles.chipActive]}
                onPress={() => toggleExtra(label)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, extras.includes(label) && styles.chipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {response && (
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => onSave(response, extras.length ? extras.join(', ') : null)}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save & close this week</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Complete Card ─────────────────────────────────────────────────────────────
function CompleteCard({ state }) {
  const data = weeklyActions[state.priority];
  const done  = (state.actions || []).filter(a => a.completed).length;
  const total = (state.actions || []).filter(a => !a.skipped).length;

  return (
    <View style={[styles.card, { backgroundColor: '#FDF0F7', borderColor: '#EDD5E4' }]}>
      <Text style={styles.eyebrow}>WEEK COMPLETE  ✦</Text>
      <Text style={[styles.priorityTitle, { color: '#3D0C4E' }]}>
        {data.emoji}  You focused on {data.label}
      </Text>
      {done > 0 && (
        <Text style={styles.completeSub}>
          {done} of {total} action{total !== 1 ? 's' : ''} done — nice
        </Text>
      )}
      <Text style={styles.nextHint}>A new focus opens next week</Text>
    </View>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WeeklyCheckIn() {
  const [weekState, setWeekState] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const state = await WeeklyCheckInUtil.getState();
    setWeekState(state);
  }

  function animate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  async function handleSelect(priority) {
    animate();
    const updated = await WeeklyCheckInUtil.selectPriority(priority);
    setWeekState({ ...updated, phase: 'active' });
  }

  async function handleComplete(actionId) {
    animate();
    const actions = await WeeklyCheckInUtil.completeAction(actionId);
    setWeekState(prev => ({ ...prev, actions }));
  }

  async function handleSkip(actionId) {
    animate();
    const actions = await WeeklyCheckInUtil.skipAction(actionId);
    setWeekState(prev => ({ ...prev, actions }));
  }

  async function handleReplace(actionId) {
    animate();
    const actions = await WeeklyCheckInUtil.replaceAction(actionId);
    setWeekState(prev => ({ ...prev, actions }));
  }

  async function handleChangePriority() {
    animate();
    await WeeklyCheckInUtil.resetPriority();
    setWeekState(prev => ({ ...prev, phase: 'idle', priority: null, actions: [] }));
  }

  async function handleSaveReflection(response, extra) {
    animate();
    const updated = await WeeklyCheckInUtil.saveReflection(response, extra);
    setWeekState({ ...updated, phase: 'complete' });
  }

  if (!weekState) return null;

  const { phase } = weekState;

  if (phase === 'idle' || phase === 'reminder')
    return <IdleCard isReminder={phase === 'reminder'} onSelect={handleSelect} />;

  if (phase === 'active')
    return (
      <ActiveCard
        state={weekState}
        onComplete={handleComplete}
        onSkip={handleSkip}
        onReplace={handleReplace}
        onChangePriority={handleChangePriority}
      />
    );

  if (phase === 'reflecting')
    return <ReflectionCard state={weekState} onSave={handleSaveReflection} />;

  if (phase === 'complete')
    return <CompleteCard state={weekState} />;

  return null;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FDF0F7',
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2185B',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3D0C4E',
    marginBottom: 16,
    lineHeight: 24,
  },

  // Priority picker
  optionsRow: { flexDirection: 'row', gap: 10 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
  },
  optionEmoji: { fontSize: 24, marginBottom: 6 },
  optionLabel: { fontSize: 13, fontWeight: '700', color: '#3D0C4E' },

  // Active card header
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  priorityPillText: { fontSize: 14, fontWeight: '700' },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  progressDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  progressLabel: { fontSize: 12, fontWeight: '600' },

  // Individual action cards
  actionsList: { gap: 8 },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  emojiBubble: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionEmoji: { fontSize: 20 },
  actionTextWrap: { flex: 1 },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C313A',
    lineHeight: 20,
    marginBottom: 4,
  },
  actionTitleDone: { color: '#B39DBC', textDecorationLine: 'line-through' },
  actionLinks: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { fontSize: 12, fontWeight: '600' },
  linkDot:  { fontSize: 12, color: '#B0BEC5' },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  allSkipped: { fontSize: 14, fontWeight: '500', marginTop: 4, opacity: 0.8 },

  // Reflection
  reflectRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  reflectBtn: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  reflectBtnActive:     { backgroundColor: '#C2185B', borderColor: '#C2185B' },
  reflectBtnText:       { fontSize: 13, fontWeight: '600', color: '#3D0C4E', textAlign: 'center' },
  reflectBtnTextActive: { color: '#FFFFFF' },
  extraLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#546E7A',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#EDD5E4',
    backgroundColor: '#FFFFFF',
  },
  chipActive:     { backgroundColor: '#FCE4EC', borderColor: '#C2185B' },
  chipText:       { fontSize: 13, color: '#546E7A', fontWeight: '500' },
  chipTextActive: { color: '#C2185B', fontWeight: '600' },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#C2185B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  // Complete
  priorityTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  completeSub:   { fontSize: 14, color: '#546E7A', marginTop: 4, marginBottom: 8 },
  nextHint:      { fontSize: 13, color: '#B39DBC', marginTop: 4 },
});
