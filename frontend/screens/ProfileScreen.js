import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Switch, Alert, Image, Modal,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Storage } from '../utils/storage';
import { auth, db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const { width: SW } = Dimensions.get('window');

// ── Palette — exact match to LearnScreen ─────────────────────────────────────
const BG     = '#FAF6F0';
const PLUM   = '#3D0C4E';
const ROSE   = '#C2748A';
const ROSE_D = '#C2185B';
const MUTED  = '#B39DBC';
const WHITE  = '#FFFFFF';

// ── Layout constants ─────────────────────────────────────────────────────────
const CARD_W  = (SW - 52) / 2;   // 2-col grid: 20px padding each side + 12px gap
const CARD_W3  = (SW - 56) / 3;
const BADGE_W = (SW - 56) / 3;   // 3-col grid: 20px padding each side + 8px*2 gaps

// ── Static data ───────────────────────────────────────────────────────────────
const CONDITIONS_LIST = [
  'PCOS', 'PCOD', 'Endometriosis', 'Irregular cycles',
  'Calcium / Vitamin D deficiency', 'Thyroid issues', 'None', 'Prefer not to say',
];

const PRIORITIES_LIST = [
  'Career growth', 'Personal health', 'Relationships', 'Travel',
  'Family planning (someday)', "I'm not sure yet",
];

const DOG_IMAGES = {
  puppy: require('../assets/dogs/Puppy open eyes.png'),
  young: require('../assets/dogs/adult dog eyes open.jpeg'),
  teen:  require('../assets/dogs/adult dog eyes open.jpeg'),
  adult: require('../assets/dogs/adult dog eyes open.jpeg'),
};

const STAGE_LABELS = { puppy: 'Puppy', young: 'Teen', teen: 'Teen', adult: 'Adult' };

const BADGES = [
  { id: 'first_steps',  icon: 'footsteps',  iconLocked: 'footsteps-outline',  name: 'First Steps',  reason: 'Complete your first simulation run.',          check: d => (d.simHistory?.length  ?? 0) >= 1 },
  { id: 'health_aware', icon: 'heart',       iconLocked: 'heart-outline',       name: 'Health Aware', reason: 'Add at least one health condition to your profile.', check: d => (d.conditions?.filter(c => c !== 'None' && c !== 'Prefer not to say').length ?? 0) > 0 },
  { id: 'explorer',     icon: 'compass',     iconLocked: 'compass-outline',     name: 'Explorer',     reason: 'Complete 3 or more simulation runs.',           check: d => (d.simHistory?.length  ?? 0) >= 3 },
  { id: 'goal_setter',  icon: 'flag',        iconLocked: 'flag-outline',        name: 'Goal Setter',  reason: 'Add at least one goal to your profile.',        check: d => (d.priorities?.length  ?? 0) > 0 },
  { id: 'consistent',   icon: 'star',        iconLocked: 'star-outline',        name: 'Consistent',   reason: 'Earn 10 or more points by completing health cards.', check: d => d.points >= 10 },
  { id: 'lea_graduate', icon: 'school',      iconLocked: 'school-outline',      name: 'LEA Graduate', reason: 'Earn 50 or more points across all your sessions.', check: d => d.points >= 50 },
];

const TABS = ['Stats', 'Achievements', 'Settings'];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, value, label, iconColor }) {
  return (
    <View style={[sc.card, { width: CARD_W }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
      <Text style={[sc.value, { color: iconColor }]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: {
    backgroundColor: WHITE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  value: { fontSize: 24, fontWeight: '800', marginTop: 8, marginBottom: 4 },
  label: { fontSize: 12, color: MUTED, fontWeight: '500' },
});

function StatsTab({ conditions, priorities, simHistory, points, leaStage }) {
  const displayConds = conditions.filter(c => c !== 'None' && c !== 'Prefer not to say');

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <View style={styles.hStatList}>
        {[
          { icon: 'star',            color: ROSE_D,    cardBg: '#FFF5F8', accent: ROSE_D,    value: points,                        label: 'Points earned' },
          { icon: 'desktop-outline', color: '#E65100', cardBg: '#FFFAF5', accent: '#E65100', value: simHistory.length,              label: 'Sim runs'      },
          { icon: 'paw',             color: '#2E7D32', cardBg: '#F5FBF5', accent: '#2E7D32', value: STAGE_LABELS[leaStage] || '—', label: "Lea's stage"   },
        ].map(item => (
          <View key={item.label} style={[styles.hStatCard, { backgroundColor: item.cardBg }]}>
            <View style={[styles.hStatAccent, { backgroundColor: item.accent }]} />
            <View style={[styles.hStatIconBox, { backgroundColor: WHITE }]}>
              <Ionicons name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.hStatRight}>
              <Text style={[styles.hStatValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.hStatLabel}>{item.label}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.secHeader, { marginTop: 24 }]}>YOUR GOALS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
        {priorities.length > 0
          ? priorities.map(p => (
              <View key={p} style={[styles.pill, styles.pillGoal]}>
                <Text style={[styles.pillText, styles.pillGoalText]}>{p}</Text>
              </View>
            ))
          : <Text style={styles.emptyHint}>None selected</Text>
        }
      </ScrollView>

      <View style={{ height: 40 }} />
    </View>
  );
}

function AchievementsTab({ points, conditions, priorities, simHistory }) {
  const badgeData = { conditions, priorities, points, simHistory };
  const [popupBadge, setPopupBadge] = useState(null);

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <Text style={styles.secHeader}>BADGES</Text>
      <View style={styles.badgeGrid}>
        {BADGES.map(badge => {
          const earned = badge.check(badgeData);
          return (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badgeCard, { width: BADGE_W }, !earned && styles.badgeCardLocked]}
              onPress={() => setPopupBadge(badge)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={earned ? badge.icon : badge.iconLocked}
                size={28}
                color={earned ? ROSE_D : MUTED}
              />
              <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={2}>
                {badge.name}
              </Text>
              <Text style={earned ? styles.badgeEarned : styles.badgeLocked}>
                {earned ? 'Earned' : 'Locked'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 40 }} />

      <Modal visible={popupBadge !== null} transparent animationType="fade" onRequestClose={() => setPopupBadge(null)}>
        <View style={styles.badgePopupBackdrop}>
          <View style={styles.badgePopupCard}>
            <Text style={styles.badgePopupTitle}>{popupBadge?.name}</Text>
            <Text style={styles.badgePopupBody}>{popupBadge?.reason}</Text>
            <TouchableOpacity style={styles.badgePopupBtn} onPress={() => setPopupBadge(null)} activeOpacity={0.8}>
              <Text style={styles.badgePopupBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}


function SettingsTab({ relEnabled, onToggleRel, onEditConditions, onEditGoals, onResetSim, onResetAll }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <View style={styles.settingsGroup}>

        {/* Edit conditions */}
        <TouchableOpacity style={[styles.settingRow, styles.settingBorder]} onPress={onEditConditions} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: '#EEE8F5' }]}>
            <Ionicons name="medical-outline" size={18} color="#6A1B9A" />
          </View>
          <Text style={[styles.settingLabel, { flex: 1, marginLeft: 14 }]}>Edit my conditions</Text>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* Edit goals */}
        <TouchableOpacity style={[styles.settingRow, styles.settingBorder]} onPress={onEditGoals} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="flag-outline" size={18} color="#E65100" />
          </View>
          <Text style={[styles.settingLabel, { flex: 1, marginLeft: 14 }]}>Edit my goals</Text>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* Reset simulation */}
        <TouchableOpacity style={[styles.settingRow, styles.settingBorder]} onPress={onResetSim} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFF8E1' }]}>
            <Ionicons name="refresh-outline" size={18} color="#F57C00" />
          </View>
          <Text style={[styles.settingLabel, { flex: 1, marginLeft: 14 }]}>Reset simulation progress</Text>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {/* Reset all — destructive label only */}
        <TouchableOpacity style={styles.settingRow} onPress={onResetAll} activeOpacity={0.7}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
            <Ionicons name="trash-outline" size={18} color="#D32F2F" />
          </View>
          <Text style={[styles.settingLabel, styles.destructiveLabel, { flex: 1, marginLeft: 14 }]}>
            Delete account
          </Text>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

      </View>
      <View style={{ height: 40 }} />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen({ navigation }) {
  const [loading,        setLoading]        = useState(true);
  const [activeTab,      setActiveTab]      = useState('Stats');
  const [leaName,        setLeaName]        = useState('Lea');
  const [leaStage,       setLeaStage]       = useState('puppy');
  const [userAge,        setUserAge]        = useState('');
  const [lifeStage,      setLifeStage]      = useState('');
  const [conditions,     setConditions]     = useState([]);
  const [priorities,     setPriorities]     = useState([]);
  const [points,         setPoints]         = useState(0);
  const [simHistory,     setSimHistory]     = useState([]);
  const [relEnabled,     setRelEnabled]     = useState(false);
  const [editModal,      setEditModal]      = useState(null);
  const [draftSelection, setDraftSelection] = useState([]);

  const load = useCallback(async () => {
    const [name, stage, age, ls, conds, pris, pts, simH, rel] = await Promise.all([
      Storage.get(Storage.KEYS.LEA_NAME),
      Storage.get(Storage.KEYS.LEA_STAGE),
      Storage.get(Storage.KEYS.USER_AGE),
      Storage.get(Storage.KEYS.USER_LIFE_STAGE),
      Storage.get(Storage.KEYS.USER_CONDITIONS),
      Storage.get(Storage.KEYS.USER_PRIORITIES),
      Storage.get(Storage.KEYS.USER_POINTS),
      Storage.get(Storage.KEYS.SIMULATION_HISTORY),
      Storage.get(Storage.KEYS.RELATIONSHIP_CONTENT_ENABLED),
    ]);
    if (name)              setLeaName(name);
    if (stage)             setLeaStage(stage);
    if (age)               setUserAge(String(age));
    if (ls)                setLifeStage(ls);
    if (Array.isArray(conds)) setConditions(conds);
    if (Array.isArray(pris))  setPriorities(pris);
    if (pts !== null)      setPoints(typeof pts === 'number' ? pts : Number(pts) || 0);
    if (Array.isArray(simH))  setSimHistory(simH);
    setRelEnabled(!!rel);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleRelationship(value) {
    setRelEnabled(value);
    await Storage.set(Storage.KEYS.RELATIONSHIP_CONTENT_ENABLED, value);
    const uid = auth.currentUser?.uid;
    if (uid) {
      try { await updateDoc(doc(db, 'users', uid), { relationship_content_enabled: value }); }
      catch (e) { console.error('Firestore sync error:', e); }
    }
  }

  function openEdit(type) {
    setDraftSelection(type === 'conditions' ? [...conditions] : [...priorities]);
    setEditModal(type);
  }

  function toggleDraft(item) {
    const isConditions = editModal === 'conditions';
    if (isConditions && (item === 'None' || item === 'Prefer not to say')) {
      setDraftSelection([item]);
      return;
    }
    setDraftSelection(prev => {
      const filtered = isConditions
        ? prev.filter(c => c !== 'None' && c !== 'Prefer not to say')
        : [...prev];
      return filtered.includes(item)
        ? filtered.filter(c => c !== item)
        : [...filtered, item];
    });
  }

  async function saveEdit() {
    const uid = auth.currentUser?.uid;
    if (editModal === 'conditions') {
      setConditions(draftSelection);
      await Storage.set(Storage.KEYS.USER_CONDITIONS, draftSelection);
      if (uid) {
        try { await updateDoc(doc(db, 'users', uid), { user_conditions: draftSelection }); }
        catch (e) { console.error('Firestore sync error:', e); }
      }
    } else {
      setPriorities(draftSelection);
      await Storage.set(Storage.KEYS.USER_PRIORITIES, draftSelection);
      if (uid) {
        try { await updateDoc(doc(db, 'users', uid), { user_priorities: draftSelection }); }
        catch (e) { console.error('Firestore sync error:', e); }
      }
    }
    setEditModal(null);
  }

  function confirmResetSimulation() {
    Alert.alert(
      'Reset Simulation Progress',
      'This will clear your simulation history and progress. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset', style: 'destructive',
          onPress: async () => {
            await Storage.remove(Storage.KEYS.SIMULATION_HISTORY);
            await Storage.set(Storage.KEYS.SIMULATION_CONDITION_INDEX, 0);
            setSimHistory([]);
            Alert.alert('Done', 'Simulation progress has been reset.');
          },
        },
      ]
    );
  }

  function confirmResetAll() {
    Alert.alert(
      'Reset All Data',
      'This will delete everything and restart the app from the beginning. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything', style: 'destructive',
          onPress: async () => {
            await Storage.clearAll();
            navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={ROSE_D} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const dogImage = DOG_IMAGES[leaStage] || DOG_IMAGES.puppy;

  return (
    <SafeAreaView style={styles.safe}>

      {/* Nav bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={ROSE_D} />
          <Text style={styles.backText}>Home</Text>
        </TouchableOpacity>
      </View>

      {/* Hero — circular dog image + name + age */}
      <View style={styles.hero}>
        <View style={styles.dogCircle}>
          <Image source={dogImage} style={styles.dogImage} resizeMode="contain" />
        </View>
        <Text style={styles.heroName}>{leaName}</Text>
        <View style={styles.heroMetaRow}>
          {userAge ? <Text style={styles.heroMeta}>Age {userAge}</Text> : null}
          {userAge && lifeStage ? <Text style={styles.heroDot}> · </Text> : null}
          {lifeStage ? <Text style={styles.heroMeta}>{lifeStage}</Text> : null}
        </View>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'Stats' && (
          <StatsTab
            conditions={conditions}
            priorities={priorities}
            simHistory={simHistory}
            points={points}
            leaStage={leaStage}
          />
        )}
        {activeTab === 'Achievements' && (
          <AchievementsTab
            points={points}
            conditions={conditions}
            priorities={priorities}
            simHistory={simHistory}
          />
        )}
        {activeTab === 'Settings' && (
          <SettingsTab
            relEnabled={relEnabled}
            onToggleRel={toggleRelationship}
            onEditConditions={() => openEdit('conditions')}
            onEditGoals={() => openEdit('goals')}
            onResetSim={confirmResetSimulation}
            onResetAll={confirmResetAll}
          />
        )}
      </ScrollView>

      {/* Edit modal */}
      <Modal visible={editModal !== null} animationType="slide" transparent onRequestClose={() => setEditModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.modalTitle}>
              {editModal === 'conditions' ? 'Edit Conditions' : 'Edit Goals'}
            </Text>
            <ScrollView contentContainerStyle={styles.chipWrap} showsVerticalScrollIndicator={false}>
              {(editModal === 'conditions' ? CONDITIONS_LIST : PRIORITIES_LIST).map(item => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, draftSelection.includes(item) && styles.chipSelected]}
                  onPress={() => toggleDraft(item)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, draftSelection.includes(item) && styles.chipTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditModal(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, draftSelection.length === 0 && styles.modalSaveBtnDisabled]}
                onPress={saveEdit}
                disabled={draftSelection.length === 0}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // Nav
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0E6F0',
  },
  backBtn:  { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingRight: 12 },
  backText: { fontSize: 15, color: ROSE_D, fontWeight: '600', marginLeft: 2 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F0E6F0',
    backgroundColor: WHITE,
  },
  dogCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 3, borderColor: ROSE_D,
    backgroundColor: '#FFF0F5',
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
  },
  dogImage:     { width: 100, height: 100 },
  heroName:     { fontSize: 26, fontWeight: '800', color: PLUM },
  heroMetaRow:  { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  heroMeta:     { fontSize: 14, color: MUTED, fontWeight: '500' },
  heroDot:      { fontSize: 14, color: MUTED },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    borderBottomWidth: 1, borderBottomColor: '#F0E6F0',
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 13,
    minHeight: 44,
  },
  tabLabel: {
    fontSize: 14, fontWeight: '600', color: MUTED,
  },
  tabLabelActive: { color: PLUM },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2, backgroundColor: ROSE_D, borderRadius: 1,
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    marginBottom: 24,
  },

  hStatList: { gap: 12, marginBottom: 24 },
  hStatCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, overflow: 'hidden',
    shadowColor: PLUM, shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  hStatAccent: { width: 5, alignSelf: 'stretch' },
  hStatIconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 16, marginVertical: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  hStatRight:  { flex: 1, paddingHorizontal: 16, paddingVertical: 18 },
  hStatValue:  { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  hStatLabel:  { fontSize: 13, color: MUTED, fontWeight: '500', marginTop: 3 },

  // Section header
  secHeader: {
    fontSize: 11, fontWeight: '700', color: ROSE,
    letterSpacing: 1.5, textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Pills
  pillScroll: { paddingRight: 20, gap: 8, flexDirection: 'row', marginBottom: 4 },
  pill: {
    backgroundColor: '#FCE4EC', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  pillText:     { fontSize: 14, color: ROSE_D, fontWeight: '600' },
  pillGoal:     { backgroundColor: '#EEE8F5' },
  pillGoalText: { color: '#6A1B9A' },
  emptyHint:    { fontSize: 14, color: MUTED, fontStyle: 'italic' },

  // Level card
  levelCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  levelCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#FCE4EC', borderWidth: 2.5, borderColor: ROSE_D,
    alignItems: 'center', justifyContent: 'center',
  },
  levelNumber: { fontSize: 24, fontWeight: '800', color: ROSE_D },
  levelTitle:  { fontSize: 18, fontWeight: '700', color: PLUM },
  levelSub:    { fontSize: 12, color: MUTED, marginTop: 2, marginBottom: 10 },
  progressTrack: {
    height: 10, backgroundColor: '#EEE8F5', borderRadius: 10, overflow: 'hidden',
  },
  progressFill: {
    height: 10, backgroundColor: ROSE_D, borderRadius: 10,
  },

  // Badge grid
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  badgeCard: {
    backgroundColor: WHITE, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F0E6F0',
    alignItems: 'center',
    shadowColor: PLUM, shadowOpacity: 0.08, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
    minHeight: 100, justifyContent: 'center',
  },
  badgeCardLocked: { opacity: 0.4 },
  badgeName:       { fontSize: 12, fontWeight: '600', color: PLUM, marginTop: 8, textAlign: 'center' },
  badgeNameLocked: { color: MUTED },
  badgeEarned:     { fontSize: 11, color: '#388E3C', fontWeight: '700', marginTop: 4 },
  badgeLocked:     { fontSize: 11, color: MUTED, fontWeight: '500', marginTop: 4 },

  // Badge info popup
  badgePopupBackdrop: {
    flex: 1, backgroundColor: 'rgba(61,12,78,0.4)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  badgePopupCard: {
    backgroundColor: WHITE, borderRadius: 20, padding: 24,
    alignItems: 'center', width: '100%',
    shadowColor: PLUM, shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  badgePopupTitle: { fontSize: 18, fontWeight: '800', color: PLUM, marginBottom: 10, textAlign: 'center' },
  badgePopupBody:  { fontSize: 14, color: ROSE, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  badgePopupBtn: {
    backgroundColor: ROSE_D, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 40,
  },
  badgePopupBtnText: { fontSize: 15, fontWeight: '700', color: WHITE },

  // Settings
  settingsGroup: {
    backgroundColor: WHITE, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F0E6F0',
    shadowColor: PLUM, shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16,
    minHeight: 56,
  },
  settingBorder:   { borderBottomWidth: 1, borderBottomColor: '#F5F0FA' },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel:    { fontSize: 15, color: PLUM, fontWeight: '500' },
  settingHint:     { fontSize: 12, color: MUTED, marginTop: 2 },
  destructiveLabel: { color: '#D32F2F' },

  // Edit modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(61,12,78,0.35)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: WHITE, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 12, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '80%',
  },
  sheetHandle: {
    width: 36, height: 4, backgroundColor: '#E0C8D0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle:  { fontSize: 20, fontWeight: '700', color: PLUM, marginBottom: 16 },
  chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 12 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 100,
    backgroundColor: WHITE, borderWidth: 2, borderColor: '#F0E6F0',
  },
  chipSelected:     { backgroundColor: ROSE_D, borderColor: ROSE_D },
  chipText:         { fontSize: 14, color: '#546E7A', fontWeight: '500' },
  chipTextSelected: { color: WHITE, fontWeight: '700' },
  modalFooter:      { flexDirection: 'row', gap: 12, marginTop: 16 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#FFF0F5', alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: ROSE_D },
  modalSaveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: ROSE_D, alignItems: 'center',
  },
  modalSaveBtnDisabled: { backgroundColor: '#F5DCE8' },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: WHITE },
});
