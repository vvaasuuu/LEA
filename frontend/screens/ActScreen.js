import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, FlatList, TextInput, Image,
  ImageBackground, Dimensions, Linking, Animated,
  KeyboardAvoidingView, Platform, PanResponder,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import companies from '../data/company_details.json';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Palette ───────────────────────────────────────────────────────────────────
const BG         = '#FFFFFF';
const PLUM       = '#6A1B9A';
const ROSE       = '#C2185B';
const MUTED      = '#B39DBC';
const HEADING    = '#3D0C4E';
const DOT_COLORS = { Health: ROSE, Career: PLUM, Others: '#E65100' };
const CAT_STYLES = {
  Health: { unselBg: '#FCE4EC', color: ROSE,      selBg: ROSE },
  Career: { unselBg: '#EDE7F6', color: PLUM,      selBg: PLUM },
  Others: { unselBg: '#FFF3E0', color: '#E65100', selBg: '#E65100' },
};

// ── Assets ────────────────────────────────────────────────────────────────────
const PUPPY      = require('../assets/dogs/Puppy open eyes.png');
const PICTURE_BG = require('../assets/picture background.png');

// ── Recommendations (age 21 — women's health relevant) ───────────────────────
const RECOMMENDATIONS = [
  {
    id: 'r1', title: 'HPV Vaccine', category: 'Health',
    desc: 'Cervical cancer prevention, recommended before 26',
    body: 'The HPV vaccine protects against strains of human papillomavirus that cause most cervical cancers. It is most effective when given before exposure to the virus. In Singapore it is recommended for females aged 9–26. Even if you are older, speak to your GP — it may still offer partial protection.',
  },
  {
    id: 'r2', title: 'General Blood Panel', category: 'Health',
    desc: 'Establish your baseline health markers early',
    body: 'A general blood panel establishes your baseline for key health markers including full blood count, liver function, kidney function, and blood glucose. Having a baseline in your early twenties means future tests can detect subtle changes early. Many conditions including thyroid issues and anaemia are caught this way.',
  },
  {
    id: 'r3', title: 'Iron & Ferritin Levels', category: 'Health',
    desc: 'Especially important if you have heavy periods',
    body: 'Iron deficiency is the most common nutritional deficiency worldwide and disproportionately affects women. Ferritin — the stored form of iron — can be depleted even when haemoglobin appears normal, causing fatigue, brain fog, and hair thinning. Women with heavy periods or PCOS are at higher risk and benefit from monitoring these levels annually.',
  },
];

const BENEFIT_FILTERS = [
  { key: 'fertility_coverage',   label: 'Fertility Support' },
  { key: 'menstrual_leave',      label: 'Menstrual Leave' },
  { key: 'flexible_remote_work', label: 'Flexible Work' },
  { key: 'mental_health',        label: 'Mental Health Support' },
  { key: 'women_leadership',     label: 'Leadership Programmes' },
  { key: 'extended_maternity',   label: 'Maternity Leave' },
  { key: 'wellness',             label: 'Wellness Subsidy' },
];

const CAREER_STAGES = [
  { key: 'student', label: 'Student / Fresh Graduate' },
  { key: 'early',   label: 'Early Career (1–3 years)' },
  { key: 'mid',     label: 'Mid Career (3–7 years)' },
];

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_LONG   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEK_ABBR   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateInput(d) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function autoFormatDate(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseUpcomingDate(text) {
  const parts = text.trim().split('/');
  if (parts.length < 2) return null;
  const day   = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year  = parts[2] ? parseInt(parts[2], 10) : TODAY.getFullYear();
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}
function formatShortDate(d) { return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`; }
function formatFullDate(d)  { return `${DAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`; }
function formatTimelineDate(d) {
  return `${WEEK_ABBR[(d.getDay() + 6) % 7]} · ${formatShortDate(d)}`;
}

// ── Calendar weeks ────────────────────────────────────────────────────────────
function generateWeeks(numWeeks) {
  const d   = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  d.setDate(d.getDate() - Math.floor((numWeeks - 1) / 2) * 7);
  return Array.from({ length: numWeeks }, () =>
    Array.from({ length: 7 }, () => { const day = new Date(d); d.setDate(d.getDate() + 1); return day; })
  );
}

const TODAY         = new Date();
const TODAY_STR     = toDateStr(TODAY);
const WEEKS         = generateWeeks(13);
const INIT_WEEK_IDX = Math.max(0, WEEKS.findIndex(w => w.some(d => toDateStr(d) === TODAY_STR)));

// ── Sub-components ────────────────────────────────────────────────────────────

function WeekRow({ week, entries, onDayPress }) {
  const dayW = SCREEN_WIDTH / 7;
  return (
    <View style={{ width: SCREEN_WIDTH, flexDirection: 'row', paddingVertical: 10 }}>
      {week.map((date, i) => {
        const ds      = toDateStr(date);
        const isToday = ds === TODAY_STR;
        const isPast  = ds < TODAY_STR;
        const dots    = (entries[ds] || []).map(e => DOT_COLORS[e.category] || '#888');
        return (
          <TouchableOpacity
            key={ds}
            style={[styles.dayCell, { width: dayW }]}
            onPress={() => onDayPress(date)}
            activeOpacity={0.7}
          >
            <View style={[styles.dateCircle, isToday && styles.dateCircleToday]}>
              <Text style={[
                styles.dateNum,
                isToday ? styles.dateNumToday : (isPast ? styles.dateNumMuted : null),
              ]}>
                {date.getDate()}
              </Text>
            </View>
            <View style={styles.dotsRow}>
              {dots.slice(0, 3).map((color, di) => (
                <View key={di} style={[styles.dot, { backgroundColor: color }]} />
              ))}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Swipe-left-to-delete row for Upcoming
function SwipeableUpcomingRow({ entry, onDelete, showDivider }) {
  const DELETE_WIDTH = 72;
  const translateX   = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -(DELETE_WIDTH / 2)) {
          Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true }).start();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.swipeRowOuter, showDivider && styles.upcomingDivider]}>
      {/* Delete action revealed by swipe */}
      <TouchableOpacity style={styles.swipeDeleteBtn} onPress={onDelete} activeOpacity={0.85}>
        <Text style={styles.swipeDeleteText}>Delete</Text>
      </TouchableOpacity>
      {/* Foreground row */}
      <Animated.View
        style={[styles.swipeRowInner, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.timelineCol}>
          <View style={styles.timelineNode}>
            <Ionicons name="calendar-outline" size={12} color={ROSE} />
          </View>
          {showDivider && <View style={styles.timelineLine} />}
        </View>
        <View style={[styles.upcomingDotIcon, { backgroundColor: DOT_COLORS[entry.category] || '#888' }]} />
        <Text style={styles.upcomingNote} numberOfLines={1}>{entry.note || entry.category}</Text>
        <Text style={styles.upcomingDate}>{formatTimelineDate(entry.date)}</Text>
      </Animated.View>
    </View>
  );
}

function RecommendationCard({ rec, onLearnMore, onAdd }) {
  const catColor = DOT_COLORS[rec.category] || '#888';
  const catBg    = rec.category === 'Health' ? '#FCE4EC' : rec.category === 'Career' ? '#EDE7F6' : '#FFF3E0';
  return (
    <View style={styles.recCard}>
      <View style={[styles.recLeftBar, { backgroundColor: catColor }]} />
      <View style={styles.recContent}>
        <View style={styles.recTopRow}>
          <View style={[styles.recCatPill, { backgroundColor: catBg, borderColor: catColor }]}>
            <Text style={[styles.recCatText, { color: catColor }]}>{rec.category}</Text>
          </View>
          <Text style={styles.recTitle}>{rec.title}</Text>
        </View>
        <Text style={styles.recDesc} numberOfLines={1}>{rec.desc}</Text>
        <View style={styles.recFooter}>
          <TouchableOpacity onPress={onLearnMore} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.recLearnMore}>Learn more</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={styles.recAddBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={styles.recAddBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ActScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [entries,        setEntries]       = useState({});
  const [selectedDay,    setSelectedDay]   = useState(null);
  const [entryCategory,  setEntryCategory] = useState('Health');
  const [noteText,       setNoteText]      = useState('');
  const [learnMoreRec,   setLearnMoreRec]  = useState(null);
  const [showPrefs,      setShowPrefs]     = useState(false);
  const [region,         setRegion]        = useState('Singapore');
  const [activeFilters,  setActiveFilters] = useState([]);
  const [careerStage,    setCareerStage]   = useState('');
  const [visibleWeekIdx, setVisibleWeekIdx]= useState(INIT_WEEK_IDX);
  const [recToAdd,        setRecToAdd]       = useState(null);
  const [pickedDate,      setPickedDate]     = useState(TODAY);
  const [showDatePicker,  setShowDatePicker] = useState(false);
  const [pickedDateText,  setPickedDateText] = useState(formatDateInput(TODAY));
  const [pickedDateError, setPickedDateError]= useState('');
  const pickedDatePrev = useRef(formatDateInput(TODAY));
  const [recommendations, setRecommendations] = useState(RECOMMENDATIONS);
  const [showAddUpcoming,  setShowAddUpcoming]  = useState(false);
  const [upcomingNote,     setUpcomingNote]     = useState('');
  const [upcomingCategory, setUpcomingCategory] = useState('Health');
  const [upcomingDateText, setUpcomingDateText] = useState(formatDateInput(TODAY));
  const [upcomingDateError,setUpcomingDateError]= useState('');
  const upcomingDatePrev   = useRef(formatDateInput(TODAY));

  const calendarRef = useRef(null);

  const visibleWeek  = WEEKS[visibleWeekIdx] || WEEKS[0];
  const calMonthYear = `${MONTHS_LONG[visibleWeek[0].getMonth()]} ${visibleWeek[0].getFullYear()}`;


  useEffect(() => {
    if (route.params?.addAction) {
      setRecToAdd({ title: route.params.addAction, category: route.params.category || 'Health' });
      setPickedDate(TODAY);
      setShowDatePicker(true);
    }
  }, [route.params]);

  function openDaySheet(date) {
    setEntryCategory('Health');
    setNoteText('');
    setSelectedDay(date);
  }

  function closeDaySheet() {
    setSelectedDay(null);
    setNoteText('');
    setEntryCategory('Health');
  }

  function addEntry() {
    if (!selectedDay) return;
    const dateStr = toDateStr(selectedDay);
    const entry   = { id: String(Date.now()), category: entryCategory, note: noteText.trim() };
    setEntries(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), entry] }));
    closeDaySheet();
  }

  function deleteEntry(dateStr, entryId) {
    setEntries(prev => ({
      ...prev,
      [dateStr]: (prev[dateStr] || []).filter(e => e.id !== entryId),
    }));
  }

  function openDatePicker(rec) {
    setRecToAdd(rec);
    setPickedDate(TODAY);
    setPickedDateText(formatDateInput(TODAY));
    setPickedDateError('');
    setShowDatePicker(true);
  }

  function confirmAddRec() {
    if (!recToAdd) return;
    const manualParsed = parseUpcomingDate(pickedDateText);
    if (!manualParsed) { setPickedDateError('Enter a valid date — DD/MM/YYYY'); return; }
    const dateStr = toDateStr(manualParsed);
    const entry   = { id: String(Date.now()), category: recToAdd.category, note: recToAdd.title };
    setEntries(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), entry] }));
    setRecommendations(prev => prev.filter(r => r.id !== recToAdd.id));
    setShowDatePicker(false);
    setPickedDateError('');
    setRecToAdd(null);
  }

  function confirmAddUpcoming() {
    const parsed = parseUpcomingDate(upcomingDateText);
    if (!parsed) { setUpcomingDateError('Enter a valid date — DD/MM/YYYY'); return; }
    const dateStr = toDateStr(parsed);
    const entry   = { id: String(Date.now()), category: upcomingCategory, note: upcomingNote.trim() };
    setEntries(prev => ({ ...prev, [dateStr]: [...(prev[dateStr] || []), entry] }));
    setShowAddUpcoming(false);
    setUpcomingNote('');
    setUpcomingCategory('Health');
    setUpcomingDateText(formatDateInput(TODAY));
    setUpcomingDateError('');
  }

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }

  const upcomingEntries = [];
  for (let i = 0; i <= 14; i++) {
    const d    = new Date(TODAY);
    d.setDate(d.getDate() + i);
    const dStr = toDateStr(d);
    if (entries[dStr]) {
      entries[dStr].forEach(e => upcomingEntries.push({ ...e, date: new Date(d), dateStr: dStr }));
    }
  }

  const selectedDayStr = selectedDay ? toDateStr(selectedDay) : null;
  const dayEntries     = selectedDayStr ? (entries[selectedDayStr] || []) : [];
  const isPastDay      = selectedDayStr ? selectedDayStr < TODAY_STR : false;

  const BENEFIT_REASONS = {
    fertility_coverage:   'Covers fertility treatments and family planning',
    menstrual_leave:      'Provides dedicated menstrual leave',
    flexible_remote_work: 'Flexible and remote-friendly work culture',
    mental_health:        'Comprehensive mental health support',
    women_leadership:     'Active women in leadership programmes',
    extended_maternity:   'Extended maternity leave beyond the statutory minimum',
    wellness:             'Wellness subsidies and employee wellbeing support',
  };

  const matchedCompany = (() => {
    if (activeFilters.length === 0) return companies[0];
    const match = companies.find(c => {
      const regionMatch = region === 'Global' ? true : c.region.includes('Singapore');
      if (!regionMatch) return false;
      return activeFilters.some(f => c.benefits && c.benefits[f]);
    });
    return match || companies[0];
  })();

  const matchedReason = (() => {
    if (activeFilters.length === 0) return 'Strong maternity benefits and flexible work culture';
    const firstMatch = activeFilters.find(f => matchedCompany.benefits && matchedCompany.benefits[f]);
    return firstMatch ? BENEFIT_REASONS[firstMatch] : 'Matches your selected preferences';
  })();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── 1. Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Your life, at a glance</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* ── 2. Calendar strip ──────────────────────────────────── */}
        <View style={styles.calendarSection}>
          <Text style={styles.calMonthYear}>{calMonthYear}</Text>
          <View style={styles.dayHeaderRow}>
            {WEEK_ABBR.map(d => (
              <Text key={d} style={[styles.dayHeaderLabel, { width: SCREEN_WIDTH / 7 }]}>{d}</Text>
            ))}
          </View>
          <FlatList
            ref={calendarRef}
            data={WEEKS}
            keyExtractor={(_, idx) => String(idx)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={INIT_WEEK_IDX}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setVisibleWeekIdx(Math.max(0, Math.min(WEEKS.length - 1, idx)));
            }}
            renderItem={({ item: week }) => (
              <WeekRow week={week} entries={entries} onDayPress={openDaySheet} />
            )}
          />
        </View>

        {/* ── 3. Upcoming ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Upcoming</Text>
              <Text style={styles.sectionSub}>Next 2 weeks · swipe left to remove</Text>
            </View>
            <TouchableOpacity
              style={styles.addUpcomingBtn}
              onPress={() => { setUpcomingDateText(formatDateInput(TODAY)); setUpcomingDateError(''); setShowAddUpcoming(true); }}
              activeOpacity={0.8}
            >
              <Text style={styles.addUpcomingBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.whiteBox}>
            {upcomingEntries.length === 0 ? (
              <View style={styles.emptyUpcoming}>
                <Text style={styles.emptyUpcomingText}>Nothing coming up yet</Text>
                <Text style={styles.emptyUpcomingSub}>Tap any date or add a recommendation below</Text>
              </View>
            ) : (
              <View style={styles.upcomingList}>
                {upcomingEntries.map((e, i) => (
                  <SwipeableUpcomingRow
                    key={e.id}
                    entry={e}
                    showDivider={i < upcomingEntries.length - 1}
                    onDelete={() => deleteEntry(e.dateStr, e.id)}
                  />
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── 4. Recommended ─────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <Text style={styles.sectionSub}>Next 6 months · tap + to add to upcoming</Text>
          <View style={styles.whiteBox}>
            {recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onLearnMore={() => setLearnMoreRec(rec)}
                onAdd={() => openDatePicker(rec)}
              />
            ))}
            {recommendations.length === 0 && (
              <View style={styles.emptyUpcoming}>
                <Text style={styles.emptyUpcomingText}>All recommended items added</Text>
                <Text style={styles.emptyUpcomingSub}>You can still add custom entries on any day.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Health data: MOH Singapore, CDC. Benefits data: company public disclosures.
        </Text>
      </ScrollView>

      {/* ══ Day entry sheet ═══════════════════════════════════════════════ */}
      <Modal
        visible={!!selectedDay}
        animationType="slide"
        transparent
        onRequestClose={closeDaySheet}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={closeDaySheet} />
            <View style={[styles.sheet, styles.sheetTall]}>
              <View style={styles.sheetHandle} />
              {selectedDay && (
                <>
                  <Text style={styles.sheetTitle}>{formatFullDate(selectedDay)}</Text>

                  {dayEntries.length > 0 && (
                    <View style={styles.existingList}>
                      {dayEntries.map(e => (
                        <View key={e.id} style={styles.existingEntryRow}>
                          <View style={[styles.dot, { backgroundColor: DOT_COLORS[e.category] || '#888' }]} />
                          <Text style={styles.existingCatLabel}>{e.category}</Text>
                          {!!e.note && (
                            <Text style={styles.existingNoteText} numberOfLines={1}>{e.note}</Text>
                          )}
                          <View style={{ flex: 1 }} />
                          <TouchableOpacity
                            onPress={() => deleteEntry(selectedDayStr, e.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.deleteBtnTxt}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {!isPastDay ? (
                    <>
                      <Text style={styles.addEntryLabel}>Add entry</Text>
                      <View style={styles.categoryRow}>
                        {['Health', 'Career', 'Others'].map(cat => {
                          const cs       = CAT_STYLES[cat];
                          const isActive = cat === entryCategory;
                          return (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.categoryBtn,
                                { backgroundColor: isActive ? cs.selBg : cs.unselBg, borderColor: cs.color },
                              ]}
                              onPress={() => setEntryCategory(cat)}
                              activeOpacity={0.75}
                            >
                              <Text style={[styles.categoryBtnText, { color: isActive ? '#FFFFFF' : cs.color }]}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <TextInput
                        style={styles.noteInput}
                        placeholder="Add a short note (optional)"
                        placeholderTextColor={MUTED}
                        value={noteText}
                        onChangeText={setNoteText}
                        returnKeyType="done"
                        onSubmitEditing={addEntry}
                      />

                      <TouchableOpacity style={styles.saveBtn} onPress={addEntry} activeOpacity={0.8}>
                        <Text style={styles.saveBtnText}>Save entry</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.pastDateNote}>This date has passed — entries are view only</Text>
                  )}

                  <TouchableOpacity onPress={closeDaySheet} style={styles.cancelLinkRow}>
                    <Text style={styles.cancelLinkText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ Learn More sheet ══════════════════════════════════════════════ */}
      <Modal
        visible={!!learnMoreRec}
        animationType="slide"
        transparent
        onRequestClose={() => setLearnMoreRec(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setLearnMoreRec(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setLearnMoreRec(null)}>
              <Text style={styles.sheetCloseTxt}>✕</Text>
            </TouchableOpacity>
            {learnMoreRec && (
              <>
                <Text style={styles.sheetTitle}>{learnMoreRec.title}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
                  <Text style={styles.sheetBody}>{learnMoreRec.body}</Text>
                </ScrollView>
                <Text style={styles.sheetSource}>Source: MOH Singapore</Text>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => Linking.openURL('https://www.healthhub.sg/programmes/screen-for-life')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetBtnText}>Find a clinic</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ══ Date picker sheet ════════════════════════════════════════════ */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDatePicker(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>When would you like to add this?</Text>
            {recToAdd && <Text style={styles.datePickerRecName}>{recToAdd.title}</Text>}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.datePickerScroll}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
            >
              {Array.from({ length: 14 }, (_, i) => {
                const d  = new Date(TODAY);
                d.setDate(d.getDate() + i);
                const ds = toDateStr(d);
                const isSelected = toDateStr(pickedDate) === ds;
                return (
                  <TouchableOpacity
                    key={ds}
                    style={[styles.datePickerCell, isSelected && styles.datePickerCellActive]}
                    onPress={() => {
                      setPickedDate(new Date(d));
                      setPickedDateText(formatDateInput(new Date(d)));
                      setPickedDateError('');
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.datePickerWeekday, isSelected && { color: '#FFFFFF' }]}>
                      {WEEK_ABBR[(d.getDay() + 6) % 7]}
                    </Text>
                    <Text style={[styles.datePickerDay, isSelected && { color: '#FFFFFF' }]}>
                      {d.getDate()}
                    </Text>
                    <Text style={[styles.datePickerMonth, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>
                      {MONTH_SHORT[d.getMonth()]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TextInput
              style={[styles.noteInput, !!pickedDateError && styles.noteInputError]}
              placeholder="Or type a date — DD / MM / YYYY"
              placeholderTextColor={MUTED}
              value={pickedDateText}
              onFocus={() => { pickedDatePrev.current = pickedDateText; setPickedDateText(''); setPickedDateError(''); }}
              onBlur={() => { if (!pickedDateText.trim()) setPickedDateText(pickedDatePrev.current); }}
              onChangeText={t => {
                const formatted = autoFormatDate(t);
                setPickedDateText(formatted);
                setPickedDateError('');
                const parsed = parseUpcomingDate(formatted);
                if (parsed) setPickedDate(parsed);
              }}
              keyboardType="numeric"
              returnKeyType="done"
            />
            {!!pickedDateError && <Text style={styles.dateErrorText}>{pickedDateError}</Text>}

            <TouchableOpacity style={styles.applyBtn} onPress={confirmAddRec} activeOpacity={0.8}>
              <Text style={styles.applyBtnText}>Add to Upcoming</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.cancelLinkRow}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ Add to Upcoming sheet ════════════════════════════════════════ */}
      <Modal
        visible={showAddUpcoming}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddUpcoming(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setShowAddUpcoming(false)} />
            <View style={[styles.sheet, styles.sheetTall]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>Add to Upcoming</Text>

              <Text style={styles.addEntryLabel}>Category</Text>
              <View style={styles.categoryRow}>
                {['Health', 'Career', 'Others'].map(cat => {
                  const cs = CAT_STYLES[cat];
                  const isActive = cat === upcomingCategory;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBtn, { backgroundColor: isActive ? cs.selBg : cs.unselBg, borderColor: cs.color }]}
                      onPress={() => setUpcomingCategory(cat)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryBtnText, { color: isActive ? '#FFFFFF' : cs.color }]}>{cat}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.noteInput}
                placeholder="What's coming up?"
                placeholderTextColor={MUTED}
                value={upcomingNote}
                onChangeText={setUpcomingNote}
                returnKeyType="done"
              />

              <Text style={styles.addEntryLabel}>Date</Text>
              <TextInput
                style={[styles.noteInput, !!upcomingDateError && styles.noteInputError]}
                placeholder="DD / MM / YYYY"
                placeholderTextColor={MUTED}
                value={upcomingDateText}
                onFocus={() => { upcomingDatePrev.current = upcomingDateText; setUpcomingDateText(''); setUpcomingDateError(''); }}
                onBlur={() => { if (!upcomingDateText.trim()) setUpcomingDateText(upcomingDatePrev.current); }}
                onChangeText={t => { setUpcomingDateText(autoFormatDate(t)); setUpcomingDateError(''); }}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {!!upcomingDateError && (
                <Text style={styles.dateErrorText}>{upcomingDateError}</Text>
              )}

              <TouchableOpacity style={styles.applyBtn} onPress={confirmAddUpcoming} activeOpacity={0.8}>
                <Text style={styles.applyBtnText}>Add to Upcoming</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowAddUpcoming(false)} style={styles.cancelLinkRow}>
                <Text style={styles.cancelLinkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══ Preferences sheet ═════════════════════════════════════════════ */}
      <Modal
        visible={showPrefs}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrefs(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setShowPrefs(false)} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Your Preferences</Text>
            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.prefLabel}>REGION</Text>
              <View style={styles.prefToggleRow}>
                {['Singapore', 'Global'].map(r => {
                  const active = r === region;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.prefToggleBtn, active && styles.prefToggleBtnActive]}
                      onPress={() => setRegion(r)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefToggleBtnText, active && styles.prefToggleBtnTextActive]}>
                        {active ? '✓  ' : ''}{r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.prefLabel}>BENEFITS</Text>
              <View style={styles.prefList}>
                {BENEFIT_FILTERS.map((f, i) => {
                  const active = activeFilters.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[
                        styles.prefListItem,
                        i < BENEFIT_FILTERS.length - 1 && styles.prefListItemBorder,
                        active && styles.prefListItemActive,
                      ]}
                      onPress={() => toggleFilter(f.key)}
                      activeOpacity={0.7}
                    >
                      {active && <View style={styles.prefListAccent} />}
                      <Text style={[styles.prefListText, active && styles.prefListTextActive]}>
                        {f.label}
                      </Text>
                      {active && <Text style={styles.prefListCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.prefLabel}>CAREER STAGE</Text>
              <View style={styles.prefList}>
                {CAREER_STAGES.map((s, i) => {
                  const active = careerStage === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.prefListItem,
                        i < CAREER_STAGES.length - 1 && styles.prefListItemBorder,
                        active && styles.prefListItemActive,
                      ]}
                      onPress={() => setCareerStage(prev => prev === s.key ? '' : s.key)}
                      activeOpacity={0.7}
                    >
                      {active && <View style={styles.prefListAccent} />}
                      <Text style={[styles.prefListText, active && styles.prefListTextActive]}>
                        {s.label}
                      </Text>
                      {active && <Text style={styles.prefListCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.applyBtn}
                onPress={() => setShowPrefs(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG },
  scroll: { paddingBottom: 40 },

  header:        { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 20 },
  title:         { fontSize: 24, fontWeight: '700', color: HEADING, marginBottom: 6 },
  titleUnderline:{ height: 2, width: '40%', backgroundColor: ROSE, borderRadius: 1 },

  // Calendar
  calendarSection: { marginBottom: 8 },
  calMonthYear:    { fontSize: 14, fontWeight: '700', color: HEADING, paddingHorizontal: 20, marginBottom: 4 },
  dayHeaderRow:    { flexDirection: 'row', paddingHorizontal: 0 },
  dayHeaderLabel:  { textAlign: 'center', fontSize: 11, fontWeight: '600', color: MUTED, paddingVertical: 4 },
  dayCell:         { alignItems: 'center', paddingHorizontal: 2 },
  dateCircle:{
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  dateCircleToday:{
    backgroundColor: ROSE,
    shadowColor: ROSE, shadowOpacity: 0.4, shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  dateNum:      { fontSize: 14, fontWeight: '700', color: HEADING },
  dateNumToday: { color: '#FFFFFF' },
  dateNumMuted: { color: MUTED },
  dotsRow: { flexDirection: 'row', gap: 3, height: 8, justifyContent: 'center', alignItems: 'center' },
  dot:     { width: 5, height: 5, borderRadius: 2.5 },

  // Sections
  section:      { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: HEADING, marginBottom: 2 },
  sectionSub:   { fontSize: 12, color: MUTED, marginBottom: 14 },
  addUpcomingBtn:    { width: 34, height: 34, borderRadius: 17, backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center' },
  addUpcomingBtnText:{ color: '#FFFFFF', fontSize: 24, fontWeight: '600', lineHeight: 30 },
  whiteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5DCE8',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  // Upcoming — empty state (no Lea)
  emptyUpcoming: {
    alignItems: 'center',
  },
  emptyUpcomingText: { fontSize: 14, fontWeight: '600', color: HEADING, marginBottom: 4 },
  emptyUpcomingSub:  { fontSize: 12, color: MUTED, textAlign: 'center' },

  // Upcoming — swipeable list
  upcomingList:    { overflow: 'hidden' },
  upcomingDivider: { borderBottomWidth: 1, borderBottomColor: '#F3E5F5' },
  upcomingDotIcon: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  upcomingNote:    { flex: 1, fontSize: 14, color: HEADING },
  upcomingDate:    { fontSize: 12, color: '#6B7280', flexShrink: 0, fontWeight: '600' },

  swipeRowOuter: { overflow: 'hidden', height: 48 },
  swipeDeleteBtn: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: 72,
    backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center',
  },
  swipeDeleteText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  swipeRowInner: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, paddingHorizontal: 12, gap: 8,
    backgroundColor: '#FFFFFF',
  },
  timelineCol: { width: 16, alignItems: 'center', justifyContent: 'flex-start', alignSelf: 'stretch', paddingTop: 6 },
  timelineNode: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: '#FCE4EC', borderWidth: 1, borderColor: '#F8BBD0',
    alignItems: 'center', justifyContent: 'center',
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: '#F3E5F5', marginTop: 4, borderRadius: 2 },

  // Recommendation cards
  recCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: 12, marginBottom: 10, overflow: 'hidden',
  },
  recLeftBar:  { width: 3 },
  recContent:  { flex: 1, padding: 12 },
  recTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  recCatPill:  { borderRadius: 100, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  recCatText:  { fontSize: 10, fontWeight: '700' },
  recTitle:    { fontSize: 14, fontWeight: '700', color: HEADING, flex: 1 },
  recDesc:     { fontSize: 12, color: MUTED, marginBottom: 8 },
  recFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recLearnMore:{ fontSize: 12, color: ROSE },
  recAddBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: ROSE, alignItems: 'center', justifyContent: 'center',
  },
  recAddBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 22 },

  // Career
  careerHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  careerTitle: { fontSize: 18, fontWeight: '700', color: HEADING },
  modifyPrefs: { fontSize: 13, color: ROSE },

  // Card + Lea row
  careerCardRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  companyCard:       { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF0F5' },

  // Lea column — thought bubble + arrow + image stacked
  leaColumn:         { alignItems: 'center', justifyContent: 'flex-end' },
  careerBubble: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1BEE7',
    borderRadius: 10, padding: 7, width: 76,
  },
  careerBubbleText: { fontSize: 10, fontStyle: 'italic', color: PLUM, textAlign: 'center', lineHeight: 15 },
  careerBubbleArrow:{
    width: 0, height: 0,
    borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
    alignSelf: 'center', marginBottom: 2,
  },
  companyCardOverlay:{ backgroundColor: 'rgba(75,10,45,0.58)', borderRadius: 16, padding: 18 },
  companyName:       { fontSize: 16, fontWeight: '700', color: HEADING, marginBottom: 8 },
  companyReason:     { fontSize: 13, color: MUTED, lineHeight: 19, marginBottom: 14 },
  companyLearnMore:  { fontSize: 13, color: HEADING, fontStyle: 'italic', fontWeight: '600' },

  // Lea — single instance beside the card
  leaImg: { width: 72, height: 72 },

  // Footer
  footer: { fontSize: 11, color: MUTED, textAlign: 'center', paddingHorizontal: 20, marginBottom: 24 },

  // Modals / sheets
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '72%',
  },
  sheetTall:     { maxHeight: '85%' },
  sheetHandle:   { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetCloseBtn: { position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' },
  sheetCloseTxt: { fontSize: 12, color: PLUM, fontWeight: '700' },
  sheetTitle:    { fontSize: 18, fontWeight: '700', color: HEADING, marginBottom: 14 },
  sheetBody:     { fontSize: 14, color: '#444', lineHeight: 22 },
  sheetSource:   { fontSize: 11, color: MUTED, marginTop: 12, marginBottom: 16 },
  sheetBtn:      { backgroundColor: ROSE, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sheetBtnText:  { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Entry sheet
  existingList:     { marginBottom: 16 },
  existingEntryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3E5F5',
  },
  existingCatLabel: { fontSize: 13, fontWeight: '600', color: HEADING },
  existingNoteText: { fontSize: 13, color: MUTED },
  deleteBtnTxt:     { fontSize: 12, color: MUTED },

  pastDateNote:  { fontSize: 13, color: MUTED, textAlign: 'center', paddingVertical: 14, fontStyle: 'italic' },
  addEntryLabel: { fontSize: 13, fontWeight: '700', color: HEADING, marginBottom: 10 },
  categoryRow:   { flexDirection: 'row', gap: 8, marginBottom: 14 },
  categoryBtn:   { flex: 1, paddingVertical: 9, borderRadius: 100, borderWidth: 1.5, alignItems: 'center' },
  categoryBtnText: { fontSize: 13, fontWeight: '600' },
  noteInput: {
    borderWidth: 1, borderColor: '#E1BEE7', borderRadius: 10,
    padding: 10, fontSize: 14, color: HEADING, marginBottom: 16,
  },
  noteInputError: { borderColor: ROSE },
  dateErrorText:  { fontSize: 12, color: ROSE, marginTop: -12, marginBottom: 14 },
  saveBtn:        { backgroundColor: ROSE, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 4 },
  saveBtnText:    { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelLinkRow:  { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: 13, color: MUTED },

  // ── Preferences — strong selected/unselected contrast ────────────────
  prefLabel:    { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },

  prefToggleRow:{ flexDirection: 'row', gap: 8, marginBottom: 4 },
  prefToggleBtn:{
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 2, borderColor: '#CCCCCC',
    alignItems: 'center', backgroundColor: '#F2F2F2',
  },
  prefToggleBtnActive:    { backgroundColor: ROSE, borderColor: ROSE },
  prefToggleBtnText:      { fontSize: 14, fontWeight: '600', color: '#888888' },
  prefToggleBtnTextActive:{ color: '#FFFFFF', fontWeight: '700' },

  prefList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EDD5E4',
    overflow: 'hidden',
    marginBottom: 4,
  },
  prefListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  prefListItemBorder:  { borderBottomWidth: 1, borderBottomColor: '#EDD5E4' },
  prefListItemActive:  { backgroundColor: '#FFF0F5' },
  prefListAccent:      { width: 3, height: 20, borderRadius: 2, backgroundColor: '#C2185B' },
  prefListText:        { flex: 1, fontSize: 14, color: '#546E7A', fontWeight: '500' },
  prefListTextActive:  { color: '#3D0C4E', fontWeight: '700' },
  prefListCheck:       { fontSize: 14, color: '#C2185B', fontWeight: '700' },

  applyBtn:     { backgroundColor: ROSE, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8 },
  applyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Date picker
  datePickerRecName:    { fontSize: 13, color: '#374151', marginBottom: 16, fontWeight: '600' },
  datePickerScroll:     { marginBottom: 20 },
  datePickerCell: {
    width: 56, alignItems: 'center',
    paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#D0D7E2',
    backgroundColor: '#F7F9FC',
  },
  datePickerCellActive: { backgroundColor: PLUM, borderColor: PLUM },
  datePickerWeekday:    { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  datePickerDay:        { fontSize: 20, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
  datePickerMonth:      { fontSize: 10, color: '#6B7280' },
});
