import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, FlatList, Dimensions,
  TextInput, Linking, Image,
} from 'react-native';
import companies from '../data/company_details.json';

const { width: SW } = Dimensions.get('window');

// ── Colour tokens ─────────────────────────────────────────────────────────────
const BG      = '#FFF8F5';
const CARD_BG = '#FFFFFF';
const PLUM    = '#6A1B9A';
const ROSE    = '#C2185B';
const MUTED   = '#B39DBC';
const HEADING = '#3D0C4E';
const AMBER   = '#E65100';

const CAT_COLOR = { Health: ROSE, Career: PLUM, Others: AMBER };
const CAT_STYLE = {
  Health: { bg: '#FCE4EC', text: ROSE,  border: ROSE  },
  Career: { bg: '#EDE7F6', text: PLUM,  border: PLUM  },
  Others: { bg: '#FFF3E0', text: AMBER, border: AMBER },
};

// ── Date utilities ────────────────────────────────────────────────────────────
const DAY_ABBR   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_FULL   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function toKey(d)      { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSame(a, b)  { return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }

function getMondayOf(d) {
  const day  = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m    = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}

function buildWeeks(center, total = 12) {
  const monday = getMondayOf(center);
  const half   = Math.floor(total / 2);
  return Array.from({ length: total }, (_, wi) =>
    Array.from({ length: 7 }, (__, di) => addDays(monday, (wi - half) * 7 + di))
  );
}

// ── Recommendation data ───────────────────────────────────────────────────────
const RECS = [
  {
    id: 'r1', title: 'HPV Vaccine', category: 'Health',
    desc: 'Cervical cancer prevention, recommended before 26',
    body: 'The HPV vaccine protects against strains of human papillomavirus that cause most cervical cancers. It is most effective when given before exposure to the virus. In Singapore it is recommended for females aged 9–26. Even if you are older, speak to your GP — it may still offer partial protection. This is one of the most impactful preventive steps you can take for your long-term health.',
  },
  {
    id: 'r2', title: 'General Blood Panel', category: 'Health',
    desc: 'Establish your baseline health markers',
    body: 'A general blood panel establishes your baseline for key health markers including full blood count, liver function, kidney function, and blood glucose. Having a baseline in your early twenties means future tests can detect subtle changes early. Many conditions — including early-stage thyroid issues and anaemia — are caught this way. It is painless and affordable at most polyclinics.',
  },
  {
    id: 'r3', title: 'Dental Checkup', category: 'Others',
    desc: 'Every 6 months',
    body: 'Regular dental checkups every six months catch cavities, gum disease, and early signs of oral cancer before they become costly problems. Gum disease has been linked to cardiovascular risk and pregnancy complications. Many dental issues are asymptomatic early on, making routine visits essential even when you feel fine.',
  },
];

// ── Career / preference filters ───────────────────────────────────────────────
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

// ── Flower decoration (view-based, #F8BBD9) ───────────────────────────────────
function Flower() {
  const R = 9;
  return (
    <View style={{ width: 48, height: 48, opacity: 0.22 }}>
      {[0, 60, 120, 180, 240, 300].map(angle => {
        const rad = (angle * Math.PI) / 180;
        const cx  = 24 + Math.cos(rad) * 13 - R;
        const cy  = 24 + Math.sin(rad) * 13 - R;
        return (
          <View
            key={angle}
            style={{ position: 'absolute', left: cx, top: cy, width: R * 2, height: R * 2, borderRadius: R, backgroundColor: '#F8BBD9' }}
          />
        );
      })}
      <View style={{ position: 'absolute', left: 24 - 5, top: 24 - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: '#F8BBD9' }} />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
const TODAY = new Date();

export default function ActScreen() {
  const weeks   = useRef(buildWeeks(TODAY, 12)).current;
  const initIdx = Math.max(0, weeks.findIndex(w => w.some(d => isSame(d, TODAY))));
  const calRef  = useRef(null);

  const [entries,       setEntries]       = useState({});
  const [selectedDay,   setSelectedDay]   = useState(null);
  const [daySheet,      setDaySheet]      = useState(false);
  const [newCat,        setNewCat]        = useState('Health');
  const [newNote,       setNewNote]       = useState('');
  const [learnRec,      setLearnRec]      = useState(null);
  const [showPrefs,     setShowPrefs]     = useState(false);
  const [region,        setRegion]        = useState('Singapore');
  const [activeFilters, setActiveFilters] = useState([]);
  const [careerStage,   setCareerStage]   = useState('');

  function openDay(date) {
    setSelectedDay(date);
    setNewCat('Health');
    setNewNote('');
    setDaySheet(true);
  }

  function saveEntry() {
    if (!selectedDay) return;
    const k = toKey(selectedDay);
    setEntries(p => ({ ...p, [k]: [...(p[k] || []), { category: newCat, note: newNote.trim() }] }));
    setDaySheet(false);
  }

  function delEntry(k, i) {
    setEntries(p => {
      const arr = [...(p[k] || [])];
      arr.splice(i, 1);
      if (!arr.length) { const n = { ...p }; delete n[k]; return n; }
      return { ...p, [k]: arr };
    });
  }

  function toggleFilter(key) {
    setActiveFilters(p => p.includes(key) ? p.filter(f => f !== key) : [...p, key]);
  }

  // Upcoming: within next 14 days
  const upcoming = [];
  for (let i = 0; i <= 14; i++) {
    const d = addDays(TODAY, i);
    (entries[toKey(d)] || []).forEach((e, idx) => upcoming.push({ date: d, idx, ...e }));
  }

  const selKey     = selectedDay ? toKey(selectedDay) : null;
  const selEntries = selKey ? (entries[selKey] || []) : [];

  function renderWeek({ item: week }) {
    return (
      <View style={[styles.weekRow, { width: SW }]}>
        {week.map((date, di) => {
          const k       = toKey(date);
          const isToday = isSame(date, TODAY);
          const isPast  = date < TODAY && !isToday;
          const ents    = entries[k] || [];
          const dots    = ['Health', 'Career', 'Others'].filter(c => ents.some(e => e.category === c));
          return (
            <TouchableOpacity key={di} style={styles.dayCell} onPress={() => openDay(date)} activeOpacity={0.7}>
              <Text style={[styles.dayLabel, isPast && { color: MUTED }]}>{DAY_ABBR[di]}</Text>
              <View style={[styles.dateCircle, isToday && styles.dateCircleToday]}>
                <Text style={[styles.dateNum, isToday && styles.dateNumToday, (isPast && !isToday) && { color: MUTED }]}>
                  {date.getDate()}
                </Text>
              </View>
              <View style={styles.dotsRow}>
                {dots.map(c => <View key={c} style={[styles.dot, { backgroundColor: CAT_COLOR[c] }]} />)}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  const DEFAULT_CO = companies[0] || { name: 'Prudential Singapore' };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Your life, at a glance</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* ── 2. Weekly calendar strip ──────────────────────────── */}
        <View style={styles.calWrap}>
          <FlatList
            ref={calRef}
            data={weeks}
            renderItem={renderWeek}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, idx) => ({ length: SW, offset: SW * idx, index: idx })}
            initialScrollIndex={initIdx}
          />
        </View>

        {/* ── 3. Upcoming ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Upcoming</Text>
          <Text style={styles.secSub}>Next 2 weeks</Text>

          {upcoming.length === 0 ? (
            <View style={styles.emptyRow}>
              <Image
                source={require('../assets/dogs/Puppy open eyes.png')}
                style={styles.leaSmall}
                resizeMode="contain"
              />
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>
                  Nothing coming up — add something to your calendar!
                </Text>
              </View>
            </View>
          ) : (
            upcoming.map((e, i) => (
              <View key={i} style={[styles.upRow, i > 0 && styles.upDivider]}>
                <View style={[styles.upDot, { backgroundColor: CAT_COLOR[e.category] }]} />
                <Text style={styles.upText} numberOfLines={1}>{e.note || e.category}</Text>
                <Text style={styles.upDate}>{MONTH_ABBR[e.date.getMonth()]} {e.date.getDate()}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── 4. Recommended ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>Recommended</Text>
          <Text style={styles.secSub}>Next 6 months</Text>

          {RECS.map(rec => (
            <View key={rec.id} style={styles.recCard}>
              <View style={[styles.recBar, { backgroundColor: CAT_COLOR[rec.category] }]} />
              <View style={styles.recBody}>
                <View style={styles.recTopRow}>
                  <View style={[styles.catTag, { backgroundColor: CAT_STYLE[rec.category].bg, borderColor: CAT_STYLE[rec.category].border }]}>
                    <Text style={[styles.catTagText, { color: CAT_STYLE[rec.category].text }]}>{rec.category}</Text>
                  </View>
                  <Text style={styles.recTitle} numberOfLines={1}>{rec.title}</Text>
                </View>
                <Text style={styles.recDesc} numberOfLines={1}>{rec.desc}</Text>
                <TouchableOpacity onPress={() => setLearnRec(rec)}>
                  <Text style={styles.learnLink}>Learn more</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={[styles.emptyRow, { marginTop: 16 }]}>
            <Image
              source={require('../assets/dogs/Puppy open eyes.png')}
              style={styles.leaSmall}
              resizeMode="contain"
            />
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                Knowing this at 21 puts you ahead — most women find out too late.
              </Text>
            </View>
          </View>
        </View>

        {/* ── 5. Career ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.careerHeader}>
            <TouchableOpacity style={styles.careerTitleRow} activeOpacity={0.7}>
              <Text style={styles.secTitle}>Career</Text>
              <Text style={styles.arrow}> →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPrefs(true)}>
              <Text style={styles.modPrefs}>Modify Preferences</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.careerRow}>
            <View style={styles.coCard}>
              <Text style={styles.coName}>{DEFAULT_CO.name || 'Prudential Singapore'}</Text>
              <Text style={styles.coReason} numberOfLines={2}>
                Strong maternity benefits and flexible work culture
              </Text>
              <View style={styles.flowerWrap}>
                <Flower />
              </View>
              <TouchableOpacity>
                <Text style={styles.coLearnMore}>Learn more</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.leaCareer}>
              <View style={styles.careerBubble}>
                <Text style={styles.careerBubbleText}>This one matches your goals!</Text>
              </View>
              <Image
                source={require('../assets/dogs/Puppy open eyes.png')}
                style={styles.leaLarge}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* ── Footer ────────────────────────────────────────────── */}
        <Text style={styles.footer}>
          Health data: MOH Singapore, CDC. Benefits data: company public disclosures.
        </Text>

      </ScrollView>

      {/* ══ Day entry bottom sheet ═══════════════════════════════════════ */}
      <Modal visible={daySheet} animationType="slide" transparent onRequestClose={() => setDaySheet(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayHit} activeOpacity={1} onPress={() => setDaySheet(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            {selectedDay && (
              <Text style={styles.sheetTitle}>
                {DAY_FULL[selectedDay.getDay()]}, {selectedDay.getDate()} {MONTH_FULL[selectedDay.getMonth()]}
              </Text>
            )}

            {selEntries.map((e, i) => (
              <View key={i} style={styles.entryRow}>
                <View style={[styles.entryDot, { backgroundColor: CAT_COLOR[e.category] }]} />
                <Text style={styles.entryCat}>{e.category}</Text>
                {!!e.note && <Text style={styles.entryNote} numberOfLines={1}> · {e.note}</Text>}
                <TouchableOpacity style={styles.delBtn} onPress={() => delEntry(selKey, i)}>
                  <Text style={styles.delBtnTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.catRow}>
              {['Health', 'Career', 'Others'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    { borderColor: CAT_STYLE[cat].border, backgroundColor: newCat === cat ? CAT_STYLE[cat].text : CAT_STYLE[cat].bg },
                  ]}
                  onPress={() => setNewCat(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.catPillTxt, { color: newCat === cat ? '#FFFFFF' : CAT_STYLE[cat].text }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.noteInput}
              placeholder="Add a short note (optional)"
              placeholderTextColor={MUTED}
              value={newNote}
              onChangeText={setNewNote}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={saveEntry} activeOpacity={0.8}>
              <Text style={styles.saveTxt}>Save entry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDaySheet(false)} style={styles.cancelRow}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══ Learn More bottom sheet ══════════════════════════════════════ */}
      <Modal visible={!!learnRec} animationType="slide" transparent onRequestClose={() => setLearnRec(null)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayHit} activeOpacity={1} onPress={() => setLearnRec(null)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setLearnRec(null)}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
            {learnRec && (
              <>
                <Text style={styles.sheetTitle}>{learnRec.title}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 200 }}>
                  <Text style={styles.sheetBody}>{learnRec.body}</Text>
                </ScrollView>
                <Text style={styles.sheetSrc}>Source: MOH Singapore</Text>
                <TouchableOpacity
                  style={styles.sheetBtn}
                  onPress={() => Linking.openURL('https://www.healthhub.sg/programmes/screen-for-life')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetBtnTxt}>Find a clinic</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ══ Preferences bottom sheet ═════════════════════════════════════ */}
      <Modal visible={showPrefs} animationType="slide" transparent onRequestClose={() => setShowPrefs(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayHit} activeOpacity={1} onPress={() => setShowPrefs(false)} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Your Preferences</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.prefLbl}>REGION</Text>
              <View style={styles.prefTogRow}>
                {['Singapore', 'Global'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.prefTog, region === r && styles.prefTogActive]}
                    onPress={() => setRegion(r)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefTogTxt, region === r && styles.prefTogTxtActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.prefLbl}>BENEFITS</Text>
              <View style={styles.prefChips}>
                {BENEFIT_FILTERS.map(f => {
                  const on = activeFilters.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.prefChip, on && styles.prefChipOn]}
                      onPress={() => toggleFilter(f.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefChipTxt, on && styles.prefChipTxtOn]}>{f.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.prefLbl}>CAREER STAGE</Text>
              <View style={styles.prefChips}>
                {CAREER_STAGES.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.prefChip, careerStage === s.key && styles.prefChipOn]}
                    onPress={() => setCareerStage(p => p === s.key ? '' : s.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefChipTxt, careerStage === s.key && styles.prefChipTxtOn]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowPrefs(false)} activeOpacity={0.8}>
                <Text style={styles.applyBtnTxt}>Apply Filters</Text>
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

  // Header
  header:         { paddingHorizontal: 20, paddingTop: 24, marginBottom: 20 },
  title:          { fontSize: 24, fontWeight: '700', color: HEADING },
  titleUnderline: { marginTop: 5, height: 2, width: '40%', backgroundColor: ROSE, borderRadius: 1 },

  // Calendar
  calWrap:  { marginBottom: 24 },
  weekRow:  { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6 },
  dayCell:  { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayLabel: { fontSize: 11, color: MUTED, marginBottom: 4 },
  dateCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  dateCircleToday: {
    backgroundColor: ROSE,
    shadowColor: ROSE, shadowOpacity: 0.45, shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
  dateNum:      { fontSize: 15, fontWeight: '700', color: HEADING },
  dateNumToday: { color: '#FFFFFF' },
  dotsRow:      { flexDirection: 'row', gap: 3, marginTop: 4, height: 6 },
  dot:          { width: 5, height: 5, borderRadius: 2.5 },

  // Sections
  section:  { paddingHorizontal: 20, marginBottom: 28 },
  secTitle: { fontSize: 18, fontWeight: '700', color: HEADING },
  secSub:   { fontSize: 12, color: MUTED, marginTop: 2, marginBottom: 14 },

  // Upcoming
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  leaSmall: { width: 40, height: 40 },
  bubble: {
    flex: 1, backgroundColor: CARD_BG,
    borderWidth: 1, borderColor: '#E1BEE7',
    borderRadius: 12, padding: 10,
  },
  bubbleText: { fontSize: 13, fontStyle: 'italic', color: PLUM },
  upRow:      { flexDirection: 'row', alignItems: 'center', height: 40, gap: 10 },
  upDivider:  { borderTopWidth: 1, borderTopColor: '#F3E5F5' },
  upDot:      { width: 6, height: 6, borderRadius: 3 },
  upText:     { flex: 1, fontSize: 14, color: HEADING },
  upDate:     { fontSize: 12, color: MUTED },

  // Recommendations
  recCard:   {
    flexDirection: 'row', backgroundColor: CARD_BG,
    borderRadius: 12, marginBottom: 10, overflow: 'hidden',
  },
  recBar:    { width: 3 },
  recBody:   { flex: 1, padding: 12 },
  recTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  catTag: {
    borderWidth: 1, borderRadius: 100,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  catTagText: { fontSize: 10, fontWeight: '600' },
  recTitle:   { flex: 1, fontSize: 14, fontWeight: '700', color: HEADING },
  recDesc:    { fontSize: 12, color: MUTED, marginBottom: 6 },
  learnLink:  { fontSize: 12, color: ROSE },

  // Career
  careerHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  careerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  arrow:          { fontSize: 18, fontWeight: '700', color: HEADING },
  modPrefs:       { fontSize: 13, color: ROSE },
  careerRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coCard: {
    width: SW * 0.65, backgroundColor: PLUM,
    borderRadius: 16, padding: 16, overflow: 'hidden',
  },
  coName:      { fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginBottom: 6 },
  coReason:    { fontSize: 13, color: '#F8BBD9', lineHeight: 18, marginBottom: 28 },
  flowerWrap:  { position: 'absolute', bottom: 10, right: 10 },
  coLearnMore: { fontSize: 12, color: '#FFFFFF', fontStyle: 'italic' },
  leaCareer:   { flex: 1, alignItems: 'center' },
  careerBubble: {
    backgroundColor: CARD_BG, borderWidth: 1, borderColor: '#E1BEE7',
    borderRadius: 12, padding: 8, marginBottom: 8,
  },
  careerBubbleText: { fontSize: 12, fontStyle: 'italic', color: PLUM },
  leaLarge:         { width: 60, height: 60 },

  // Footer
  footer: { fontSize: 11, color: MUTED, textAlign: 'center', paddingHorizontal: 20, marginBottom: 24 },

  // Overlay + sheet base
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' },
  overlayHit: { flex: 1 },
  sheet: {
    backgroundColor: CARD_BG,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, maxHeight: '74%',
  },
  sheetTall:  { maxHeight: '84%' },
  handle:     { width: 36, height: 4, backgroundColor: '#E1BEE7', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  closeBtn: {
    position: 'absolute', top: 20, right: 20,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F3E5F5', alignItems: 'center', justifyContent: 'center',
  },
  closeTxt:    { fontSize: 12, color: HEADING, fontWeight: '700' },
  sheetTitle:  { fontSize: 16, fontWeight: '700', color: HEADING, marginBottom: 14 },
  sheetBody:   { fontSize: 14, color: '#444444', lineHeight: 22 },
  sheetSrc:    { fontSize: 11, color: MUTED, marginTop: 10, marginBottom: 14 },
  sheetBtn:    { backgroundColor: ROSE, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  sheetBtnTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Day sheet — entries + add form
  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3E5F5', gap: 8,
  },
  entryDot:  { width: 8, height: 8, borderRadius: 4 },
  entryCat:  { fontSize: 13, fontWeight: '600', color: HEADING },
  entryNote: { flex: 1, fontSize: 13, color: MUTED },
  delBtn:    { marginLeft: 'auto', padding: 4 },
  delBtnTxt: { fontSize: 12, color: MUTED },
  catRow:    { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 12 },
  catPill:   { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 100, borderWidth: 1 },
  catPillTxt:{ fontSize: 13, fontWeight: '600' },
  noteInput: {
    borderWidth: 1, borderColor: '#E1BEE7', borderRadius: 10,
    padding: 10, fontSize: 14, color: HEADING, marginBottom: 14,
  },
  saveBtn:    { backgroundColor: ROSE, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  saveTxt:    { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancelRow:  { alignItems: 'center', paddingTop: 10 },
  cancelTxt:  { fontSize: 13, color: MUTED },

  // Preferences sheet
  prefLbl:      { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginTop: 16, marginBottom: 10 },
  prefTogRow:   { flexDirection: 'row', gap: 8, marginBottom: 4 },
  prefTog: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#E1BEE7',
    alignItems: 'center', backgroundColor: '#FDF0F0',
  },
  prefTogActive:    { backgroundColor: ROSE, borderColor: ROSE },
  prefTogTxt:       { fontSize: 14, fontWeight: '600', color: ROSE },
  prefTogTxtActive: { color: '#FFFFFF' },
  prefChips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 100, borderWidth: 1.5,
    borderColor: '#D0D0D0', backgroundColor: '#F5F5F5',
  },
  prefChipOn:    { backgroundColor: '#EDE7F6', borderColor: PLUM },
  prefChipTxt:   { fontSize: 13, color: MUTED, fontWeight: '500' },
  prefChipTxtOn: { color: PLUM, fontWeight: '600' },
  applyBtn: {
    backgroundColor: ROSE, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  applyBtnTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
