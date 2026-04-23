import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Image, SafeAreaView, StatusBar, Modal,
} from 'react-native';
import { Storage } from '../utils/storage';
import { Points, POINTS } from '../utils/points';

// ── Palette ───────────────────────────────────────────────────────────────────
const BG     = '#FAF6F0';
const PLUM   = '#3D0C4E';
const ROSE_D = '#C2185B';
const MUTED  = '#B39DBC';
const WHITE  = '#FFFFFF';
const BORDER = '#F5DCE8';
const PURPLE = '#6A1B9A';
const GREEN  = '#388E3C';
const AMBER  = '#E65100';
const TEAL   = '#00838F';

// ── Metrics ───────────────────────────────────────────────────────────────────
const METRICS = [
  { key: 'health',       label: 'Health',       color: ROSE_D  },
  { key: 'career',       label: 'Career',       color: AMBER   },
  { key: 'relationship', label: 'Relationship', color: PURPLE  },
  { key: 'fertility',    label: 'Fertility',    color: TEAL    },
];

// ── Dog images ────────────────────────────────────────────────────────────────
const DOGS = {
  puppy: require('../assets/dogs/Puppy open eyes.png'),
  teen:  require('../assets/dogs/teen1 eyes open.png'),
  adult: require('../assets/dogs/adult dog eyes open tail up.png'),
};
function getDog(age) {
  if (age <= 23) return DOGS.puppy;
  if (age <= 27) return DOGS.teen;
  return DOGS.adult;
}

// ── Scenario cards (only first is runnable) ───────────────────────────────────
const SCENARIOS = [
  {
    id: 'career_focus',
    title: 'Career First',
    subtitle: 'Age 22 → 30',
    desc: "You're 22 and ready to bet on your career. See what life could look like at 30.",
    tag: 'FEATURED',
    tagColor: ROSE_D,
    tagBg: '#FCE4EC',
    active: true,
  },
  {
    id: 'balanced',
    title: 'Balanced Path',
    subtitle: 'Age 24 → 32',
    desc: 'What if you built a life that worked for all of you?',
    tag: 'COMING SOON',
    tagColor: MUTED,
    tagBg: '#F5EEF8',
    active: false,
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneurship',
    subtitle: 'Age 26 → 34',
    desc: 'You want to build something of your own. The risk, the grind, the reward.',
    tag: 'COMING SOON',
    tagColor: MUTED,
    tagBg: '#F5EEF8',
    active: false,
  },
];

// ── Company recs shown in the fertility episode ───────────────────────────────
const SIM_COMPANIES = [
  {
    id: 'c1',
    name: 'TechFin SG',
    highlight: 'Full egg freezing coverage up to $15,000 — no questions asked',
    tag: 'Fertility Support',
    tagColor: TEAL,
    tagBg: '#E0F4F5',
    note: 'Best for: preserving options now while you build your career',
  },
  {
    id: 'c2',
    name: 'PrudentialSG',
    highlight: '24 weeks paid maternity leave + flexible phased return-to-work',
    tag: 'Long Maternity',
    tagColor: PURPLE,
    tagBg: '#EDE7F6',
    note: 'Best for: future family support when the time comes',
  },
  {
    id: 'c3',
    name: 'FlexCorp',
    highlight: 'Fully remote + 4-day work week — build a sustainable pace from day one',
    tag: 'Flexible Work',
    tagColor: AMBER,
    tagBg: '#FFF3E0',
    note: 'Best for: protecting health and relationships during peak career years',
  },
];

// ── Health cards shown in the summary (max 4) ─────────────────────────────────
const ALL_HEALTH_CARDS = [
  {
    id: 'hc1',
    title: 'Egg Freezing 101',
    category: 'Health',
    desc: 'What to expect before, during, and after oocyte cryopreservation',
    body: 'Egg freezing is most effective between ages 22–32. The process involves 10–14 days of hormone injections, a minor retrieval procedure under light sedation, and frozen storage. Success rates are highest with younger eggs — at 24 roughly 90% of retrieved eggs survive the freeze. Most people return to normal activity within 48 hours.',
    show: (history) => history.some(h => h.episodeId && h.episodeId.includes('ep2_kids') || h.episodeId && h.episodeId.includes('ep5_kids')),
  },
  {
    id: 'hc2',
    title: 'Burnout & Your Hormones',
    category: 'Health',
    desc: 'How chronic work stress disrupts your cycle and fertility',
    body: 'Chronic stress elevates cortisol, which suppresses GnRH — the hormone that regulates your cycle. This can cause irregular periods, lower AMH (your egg reserve marker), and reduced libido. Women in 60h+ roles show measurably lower progesterone than those at 40–45h. Rest is not a luxury; it is hormonal protection.',
    show: (_, scores) => scores.health < 55,
  },
  {
    id: 'hc3',
    title: 'Fertility in Your 20s',
    category: 'Health',
    desc: 'Understanding your reproductive window before you need to',
    body: "Fertility peaks around 22–26 and begins a gradual decline after 28. But declining doesn't mean gone — most people conceive naturally into their early 30s. Knowing your AMH levels, cycle regularity, and any underlying conditions (like PCOS or thyroid issues) gives you a clearer picture than your age alone.",
    show: () => true,
  },
  {
    id: 'hc4',
    title: 'Career Intensity & Reproductive Health',
    category: 'Health',
    desc: 'What the research says about high-pressure jobs and fertility',
    body: 'Studies show women in high-intensity roles have higher cortisol, more irregular cycles, and lower AMH than those in moderate-intensity roles. The good news: flexible hours, fertility benefits, and supportive workplace policies buffer most of these effects. Who you work for matters as much as how hard you work.',
    show: (_, scores) => scores.career > 55,
  },
  {
    id: 'hc5',
    title: 'PCOS & Career Stress',
    category: 'Health',
    desc: 'Managing PCOS symptoms during high-demand periods',
    body: "PCOS symptoms — irregular cycles, acne, weight changes — often flare under chronic stress. Maintaining consistent sleep, limiting processed foods, and regular moderate movement (not intense HIIT) are evidence-backed ways to manage symptoms during busy career phases. Your cycle is a useful signal, not an inconvenience.",
    show: (_, __, conditions) => conditions.some(c => c.includes('PCOS') || c.includes('PCOD')),
  },
];

function getRelevantHealthCards(history, scores, conditions) {
  return ALL_HEALTH_CARDS
    .filter(c => c.show(history, scores, conditions))
    .slice(0, 4);
}

// ── Episode definitions ───────────────────────────────────────────────────────
function buildEpisodes(wantsKids) {
  return [
    {
      id: 'ep1',
      age: 22,
      title: 'The Big Offer',
      leaSays: "This is everything we worked for. But full throttle at 60 hours a week... we should think about what we're trading for it.",
      situation: "A top firm has offered you a role with a 40% salary jump. Your mentor says this could define your 20s. The catch: it's demanding, fast-paced, and the culture rewards those who go all-in.",
      choices: [
        {
          id: 'ep1_a',
          label: 'Take it — full intensity, 60h weeks',
          effect: { health: -8, career: 15, relationship: -6, fertility: -3 },
          consequence: 'You threw yourself in. The career gains were real, but your body and relationships felt it.',
        },
        {
          id: 'ep1_b',
          label: 'Take it, but negotiate 45h weeks first',
          effect: { health: -2, career: 8, relationship: 2, fertility: 0 },
          consequence: 'A slower ramp, but you protected your health and relationships from the start.',
        },
      ],
    },

    wantsKids !== 'no' ? {
      id: 'ep2_kids',
      age: 24,
      title: 'The Fertility Conversation',
      leaSays: "A friend just told me about egg freezing. We're 24 — actually one of the best windows. And three companies want us right now. This feels like a moment.",
      situation: "A close friend just froze her eggs and says it changed how she thinks about her 30s. Your GP confirms: 24–26 is peak fertility. Three companies are competing for you — each with very different benefits for women.",
      showCompanies: true,
      choices: [
        {
          id: 'ep2_kids_a',
          label: 'Join TechFin SG — egg freezing fully covered',
          effect: { health: -2, career: 8, relationship: 0, fertility: 20 },
          consequence: 'You banked your eggs. The security changes how you make career decisions — with less fear, more confidence.',
        },
        {
          id: 'ep2_kids_b',
          label: 'Stay at current job, freeze eggs out of pocket',
          effect: { health: -5, career: 5, relationship: -3, fertility: 12 },
          consequence: 'Financially stressful, but you made it happen on your own terms. Future-you has options.',
        },
      ],
    } : {
      id: 'ep2_nokids',
      age: 24,
      title: 'Burnout Signal',
      leaSays: "We've been going hard for two years. Something in me is flagging. Are we okay? Like actually okay?",
      situation: "Two holidays cancelled. Stellar performance reviews. But also: persistent headaches, poor sleep, snapping at friends. A side project idea has been nagging at you — it could be your next chapter. Or your undoing.",
      choices: [
        {
          id: 'ep2_nokids_a',
          label: 'Launch the side project — evenings and weekends',
          effect: { health: -10, career: 12, relationship: -5, fertility: 0 },
          consequence: 'You built something real. Your body paid for the extra hours, but the momentum felt electric.',
        },
        {
          id: 'ep2_nokids_b',
          label: 'Book the holiday. Actually take it.',
          effect: { health: 14, career: -3, relationship: 8, fertility: 0 },
          consequence: "You came back reset. Career slowed momentarily. Everything else recovered.",
        },
      ],
    },

    {
      id: 'ep3',
      age: 26,
      title: 'The Reckoning',
      leaSays: "Four years in. Two promotions. But I look at us in the mirror and I can see we're running on empty. This isn't sustainable.",
      situation: "You've been promoted twice. You've also cancelled two vacations and missed three family dinners this month. Your doctor flagged elevated cortisol. A Director promotion is 3 months away — if you push through. But something has to give.",
      choices: [
        {
          id: 'ep3_a',
          label: 'Push for Director — 3 more months at full pace',
          effect: { health: -15, career: 12, relationship: -10, fertility: -5 },
          consequence: 'You got the title. But your health and relationships are in the red.',
        },
        {
          id: 'ep3_b',
          label: 'Take a month of leave before the final push',
          effect: { health: 12, career: -5, relationship: 8, fertility: 3 },
          consequence: 'You came back stronger. The promotion still happened — just delayed by a quarter.',
        },
      ],
    },

    {
      id: 'ep4',
      age: 27,
      title: 'The Relationship Test',
      leaSays: "The person I care most about is asking for more of me. And so is my boss. I can feel myself being pulled in half.",
      situation: "Your partner says they feel like they come second to your laptop. They're not wrong. Your company just started its most critical quarter and your boss is counting on you personally. Something has to come first.",
      choices: [
        {
          id: 'ep4_a',
          label: 'Stay on the project through the quarter',
          effect: { health: -5, career: 10, relationship: -18, fertility: -3 },
          consequence: 'The quarter succeeded. The relationship is on extremely thin ice.',
        },
        {
          id: 'ep4_b',
          label: 'Take 2 weeks personal leave — be present',
          effect: { health: 6, career: -5, relationship: 15, fertility: 2 },
          consequence: 'You showed up for the relationship. Career slowed — it did not stop.',
        },
      ],
    },

    wantsKids !== 'no' ? {
      id: 'ep5_kids',
      age: 28,
      title: 'The Fertility Window',
      leaSays: "We're 28. The specialist says this is still a strong window — better than waiting until 32. Our company covers 60%. I think we should do it now.",
      situation: "Your fertility specialist confirms 28 is an excellent time to freeze eggs — better outcomes than 30+. Your company covers 60% of costs. But a promotion is lining up for the next 6 months, and the timing feels complicated.",
      choices: [
        {
          id: 'ep5_kids_a',
          label: 'Freeze eggs now — take the window',
          effect: { health: -3, career: 0, relationship: 2, fertility: 25 },
          consequence: "Done. The sense of relief is immediate. Future-you has real options.",
        },
        {
          id: 'ep5_kids_b',
          label: 'Wait until after the promotion — 12 more months',
          effect: { health: 0, career: 12, relationship: 0, fertility: -15 },
          consequence: 'Career win. But the fertility window narrowed — waiting has a biological cost.',
        },
      ],
    } : {
      id: 'ep5_nokids',
      age: 28,
      title: 'The Big Leap',
      leaSays: "Someone wants us to co-found something. The timing is terrifying. The opportunity feels once-in-a-decade. What do we do?",
      situation: "A founder from your network wants you as co-founder. Two years of intense work, lower base salary, significant equity. It is the biggest career bet you could make right now. The other option: stay, and negotiate equity at your current firm.",
      choices: [
        {
          id: 'ep5_nokids_a',
          label: 'Take the co-founder role',
          effect: { health: -14, career: 22, relationship: -10, fertility: 0 },
          consequence: 'High risk, high reward. Your career spiked. The personal cost was real.',
        },
        {
          id: 'ep5_nokids_b',
          label: 'Negotiate equity at your current firm instead',
          effect: { health: 2, career: 10, relationship: 3, fertility: 0 },
          consequence: 'Safer path, steady build. You grew wealth without the casualties.',
        },
      ],
    },
  ];
}

// ── Starting score calculation ────────────────────────────────────────────────
function computeStartingScores(userData, wantsKids) {
  const age        = parseInt(userData.age) || 22;
  const conditions = userData.conditions || [];
  const priorities = userData.priorities || [];

  let health = Math.round(100 - (age - 18) * 2.5);
  if (conditions.some(c => c.includes('PCOS')))           health -= 10;
  if (conditions.some(c => c.includes('PCOD')))           health -= 8;
  if (conditions.some(c => c.includes('Endometriosis')))  health -= 10;
  if (conditions.some(c => c.includes('Thyroid')))        health -= 5;
  if (conditions.some(c => c.includes('Calcium') || c.includes('Vitamin'))) health -= 3;
  if (conditions.some(c => c.includes('Irregular')))      health -= 5;
  health = Math.max(45, Math.min(100, health));

  const stageBase = userData.lifeStage === 'Student' ? 30
    : userData.lifeStage === 'Mid-career' ? 62 : 45;
  let career = stageBase + (priorities.some(p => p.includes('Career')) ? 8 : 0);
  career = Math.min(100, career);

  let relationship = 65 + (priorities.some(p => p.includes('Relationship')) ? 10 : 0);
  relationship = Math.min(100, relationship);

  let fertility = null;
  if (wantsKids !== 'no') {
    fertility = Math.round(100 - (age - 18) * 1.5);
    if (conditions.some(c => c.includes('PCOS')))           fertility -= 15;
    if (conditions.some(c => c.includes('PCOD')))           fertility -= 12;
    if (conditions.some(c => c.includes('Endometriosis')))  fertility -= 12;
    if (conditions.some(c => c.includes('Thyroid')))        fertility -= 5;
    if (conditions.some(c => c.includes('Irregular')))      fertility -= 8;
    fertility = Math.max(35, Math.min(100, fertility));
  }

  return { health, career, relationship, fertility };
}

function applyEffect(scores, effect, wantsKids) {
  const next = { ...scores };
  Object.entries(effect).forEach(([key, delta]) => {
    if (key === 'fertility' && wantsKids === 'no') return;
    if (next[key] === null || next[key] === undefined) return;
    next[key] = Math.max(0, Math.min(100, next[key] + delta));
  });
  return next;
}

// ── Low-score recovery tips ───────────────────────────────────────────────────
const LOW_SCORE_TIPS = {
  health: {
    heading: "Your health score dropped below 30",
    tips: [
      "Book a GP visit — catch things early",
      "Prioritise 7 hours of sleep for 2 weeks straight",
      "Swap one work lunch for a 20-minute walk outside",
    ],
  },
  career: {
    heading: "Career momentum is stalling",
    tips: [
      "Schedule a mentor check-in this week",
      "Revisit your 3-month goals and reprioritise one",
      "Ask your manager for a stretch assignment",
    ],
  },
  relationship: {
    heading: "Relationships need attention",
    tips: [
      "Plan one phone-free evening with the people who matter",
      "Send a message to someone you've been meaning to check in with",
      "Protect one recurring commitment — don't cancel it",
    ],
  },
  fertility: {
    heading: "Fertility indicators worth watching",
    tips: [
      "Ask your GP for an AMH test (egg reserve marker)",
      "Book a consultation with a fertility specialist — just for information",
      "Stress management directly supports hormonal health",
    ],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBar({ label, value, color }) {
  return (
    <View style={sb.row}>
      <Text style={sb.label}>{label}</Text>
      <View style={sb.barBg}>
        <View style={[sb.fill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[sb.val, { color }]}>{value}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: PLUM, width: 90 },
  barBg: { flex: 1, height: 8, backgroundColor: '#EEE8F5', borderRadius: 4, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: 4 },
  val:   { fontSize: 12, fontWeight: '800', width: 28, textAlign: 'right' },
});

function LeaBubble({ age, text }) {
  return (
    <View style={lb.wrap}>
      <Image source={getDog(age)} style={lb.dog} resizeMode="contain" />
      <View style={lb.bubble}>
        <Text style={lb.age}>LEA · AGE {age}</Text>
        <Text style={lb.text}>{text}</Text>
      </View>
    </View>
  );
}
const lb = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 20 },
  dog:    { width: 52, height: 52, flexShrink: 0 },
  bubble: { flex: 1, backgroundColor: WHITE, borderRadius: 16, borderTopLeftRadius: 4,
            padding: 14, borderWidth: 1, borderColor: BORDER,
            shadowColor: PLUM, shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  age:    { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1.2, marginBottom: 5 },
  text:   { fontSize: 14, lineHeight: 21, color: PLUM, fontStyle: 'italic' },
});

function CompanyCard({ company }) {
  return (
    <View style={coc.card}>
      <View style={[coc.bar, { backgroundColor: company.tagColor }]} />
      <View style={coc.body}>
        <View style={coc.topRow}>
          <View style={[coc.pill, { backgroundColor: company.tagBg, borderColor: company.tagColor }]}>
            <Text style={[coc.pillTxt, { color: company.tagColor }]}>{company.tag}</Text>
          </View>
          <Text style={coc.name}>{company.name}</Text>
        </View>
        <Text style={coc.highlight} numberOfLines={2}>{company.highlight}</Text>
        <Text style={coc.note}>{company.note}</Text>
      </View>
    </View>
  );
}
const coc = StyleSheet.create({
  card:     { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 16,
              marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  bar:      { width: 4 },
  body:     { flex: 1, padding: 14 },
  topRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  pill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  pillTxt:  { fontSize: 10, fontWeight: '700' },
  name:     { fontSize: 14, fontWeight: '700', color: PLUM, flex: 1 },
  highlight:{ fontSize: 13, color: '#5D4E6D', lineHeight: 19, marginBottom: 4 },
  note:     { fontSize: 11, color: MUTED, fontStyle: 'italic' },
});

function HealthCard({ card, expanded, onToggle }) {
  const color = card.category === 'Health' ? ROSE_D : PURPLE;
  const bg    = card.category === 'Health' ? '#FCE4EC' : '#EDE7F6';
  return (
    <View style={hca.wrap}>
      <View style={hca.card}>
        <View style={[hca.bar, { backgroundColor: color }]} />
        <View style={hca.body}>
          <View style={hca.topRow}>
            <View style={[hca.pill, { backgroundColor: bg, borderColor: color }]}>
              <Text style={[hca.pillTxt, { color }]}>{card.category}</Text>
            </View>
            <Text style={hca.title}>{card.title}</Text>
          </View>
          <Text style={hca.desc} numberOfLines={expanded ? undefined : 1}>{card.desc}</Text>
          <TouchableOpacity onPress={onToggle} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Text style={hca.learn}>{expanded ? 'Show less' : 'Learn more'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {expanded && (
        <View style={hca.expandBox}>
          <Text style={hca.expandTxt}>{card.body}</Text>
        </View>
      )}
    </View>
  );
}
const hca = StyleSheet.create({
  wrap:      { marginBottom: 10 },
  card:      { flexDirection: 'row', backgroundColor: WHITE, borderRadius: 16,
               borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  bar:       { width: 4 },
  body:      { flex: 1, padding: 14 },
  topRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  pill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  pillTxt:   { fontSize: 10, fontWeight: '700' },
  title:     { fontSize: 14, fontWeight: '700', color: PLUM, flex: 1 },
  desc:      { fontSize: 13, color: '#5D4E6D', lineHeight: 19, marginBottom: 6 },
  learn:     { fontSize: 12, fontWeight: '700', color: ROSE_D },
  expandBox: { backgroundColor: '#FFF8F5', borderRadius: 12, padding: 14,
               marginTop: 2, borderWidth: 1, borderColor: BORDER },
  expandTxt: { fontSize: 13, color: PLUM, lineHeight: 21 },
});

function LowScoreWarning({ metricKey, onDismiss }) {
  const info   = LOW_SCORE_TIPS[metricKey];
  const metric = METRICS.find(m => m.key === metricKey);
  if (!info) return null;
  return (
    <Modal transparent visible animationType="fade">
      <View style={lsw.overlay}>
        <View style={lsw.card}>
          <View style={[lsw.bar, { backgroundColor: metric?.color || ROSE_D }]} />
          <View style={lsw.body}>
            <Text style={lsw.heading}>{info.heading}</Text>
            <Text style={lsw.sub}>Here are some ways you can improve this area:</Text>
            {info.tips.map((t, i) => (
              <View key={i} style={lsw.tipRow}>
                <Text style={lsw.dot}>·</Text>
                <Text style={lsw.tipTxt}>{t}</Text>
              </View>
            ))}
            <TouchableOpacity style={lsw.btn} onPress={onDismiss} activeOpacity={0.85}>
              <Text style={lsw.btnTxt}>Got it — keep going</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const lsw = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(61,12,78,0.45)', justifyContent: 'center',
             alignItems: 'center', padding: 24 },
  card:    { backgroundColor: WHITE, borderRadius: 24, overflow: 'hidden', width: '100%' },
  bar:     { height: 6 },
  body:    { padding: 24 },
  heading: { fontSize: 18, fontWeight: '800', color: PLUM, marginBottom: 8 },
  sub:     { fontSize: 13, color: MUTED, lineHeight: 20, marginBottom: 16 },
  tipRow:  { flexDirection: 'row', gap: 8, marginBottom: 8 },
  dot:     { fontSize: 20, color: ROSE_D, lineHeight: 22 },
  tipTxt:  { flex: 1, fontSize: 13, color: PLUM, lineHeight: 21 },
  btn:     { backgroundColor: ROSE_D, borderRadius: 12, paddingVertical: 13,
             alignItems: 'center', marginTop: 8 },
  btnTxt:  { fontSize: 15, fontWeight: '700', color: WHITE },
});

// ── LandingView ───────────────────────────────────────────────────────────────
function LandingView({ onSelect }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={lv.scroll} showsVerticalScrollIndicator={false}>
        <Text style={lv.title}>Simulations</Text>
        <Text style={lv.sub}>Choose a scenario to explore a possible path through your life.</Text>
        {SCENARIOS.map(sc => (
          <TouchableOpacity
            key={sc.id}
            style={[lv.card, !sc.active && lv.cardDim]}
            onPress={() => sc.active && onSelect(sc.id)}
            activeOpacity={sc.active ? 0.78 : 1}
          >
            <View style={lv.cardTop}>
              <View>
                <Text style={[lv.cardTitle, !sc.active && { color: MUTED }]}>{sc.title}</Text>
                <Text style={lv.cardSub}>{sc.subtitle}</Text>
              </View>
              <View style={[lv.tag, { backgroundColor: sc.tagBg, borderColor: sc.tagColor }]}>
                <Text style={[lv.tagTxt, { color: sc.tagColor }]}>{sc.tag}</Text>
              </View>
            </View>
            <Text style={[lv.cardDesc, !sc.active && { color: MUTED }]}>{sc.desc}</Text>
            {sc.active && <Text style={lv.cta}>Start simulation →</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const lv = StyleSheet.create({
  scroll:    { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 },
  title:     { fontSize: 28, fontWeight: '800', color: PLUM, letterSpacing: -0.5, marginBottom: 6 },
  sub:       { fontSize: 13, color: MUTED, lineHeight: 20, marginBottom: 24 },
  card:      { backgroundColor: WHITE, borderRadius: 20, padding: 20, marginBottom: 14,
               borderWidth: 1.5, borderColor: BORDER,
               shadowColor: PLUM, shadowOffset: { width: 0, height: 3 },
               shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardDim:   { opacity: 0.5 },
  cardTop:   { flexDirection: 'row', justifyContent: 'space-between',
               alignItems: 'flex-start', marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: PLUM },
  cardSub:   { fontSize: 12, color: MUTED, marginTop: 2, fontWeight: '500' },
  tag:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  tagTxt:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardDesc:  { fontSize: 13, lineHeight: 20, color: PLUM, marginBottom: 14 },
  cta:       { fontSize: 13, fontWeight: '700', color: ROSE_D },
});

// ── SetupView ─────────────────────────────────────────────────────────────────
function SetupView({ userData, onConfirm, onBack }) {
  const priorities = userData.priorities || [];
  const defaultKids = priorities.some(p => p.includes('Family planning')) ? 'yes'
    : priorities.some(p => p.includes('not sure')) ? 'maybe' : 'maybe';

  const [wantsKids, setWantsKids] = useState(defaultKids);

  const OPTIONS = [
    { key: 'yes',   label: 'Yes — I want kids someday',
      sub: 'Includes fertility track + egg freezing guidance' },
    { key: 'maybe', label: "I'm not sure yet",
      sub: 'Egg freezing option shown — keeps your future choices open' },
    { key: 'no',    label: "I don't plan to have kids",
      sub: 'Career and life focus only, no fertility track' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={sv.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={{ marginBottom: 24 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={sv.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={sv.title}>Set the Scene</Text>
        <Text style={sv.scenarioTag}>Career First · Age 22 → 30</Text>
        <Text style={sv.body}>
          You're 22 and betting on your career. This simulation follows what the next 8 years could look like — the wins, the trade-offs, and the moments that change everything.
        </Text>
        <Text style={sv.qLabel}>Do you want kids at some point?</Text>
        {OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[sv.option, wantsKids === opt.key && sv.optActive]}
            onPress={() => setWantsKids(opt.key)}
            activeOpacity={0.78}
          >
            <View style={[sv.radio, wantsKids === opt.key && sv.radioActive]}>
              {wantsKids === opt.key && <View style={sv.radioCore} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[sv.optLabel, wantsKids === opt.key && { color: ROSE_D }]}>
                {opt.label}
              </Text>
              <Text style={sv.optSub}>{opt.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={sv.btn} onPress={() => onConfirm(wantsKids)} activeOpacity={0.85}>
          <Text style={sv.btnTxt}>Start simulation →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const sv = StyleSheet.create({
  scroll:      { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16 },
  back:        { fontSize: 14, color: ROSE_D, fontWeight: '600' },
  title:       { fontSize: 28, fontWeight: '800', color: PLUM, letterSpacing: -0.5, marginBottom: 4 },
  scenarioTag: { fontSize: 13, color: MUTED, marginBottom: 16, fontWeight: '500' },
  body:        { fontSize: 14, color: PLUM, lineHeight: 22, marginBottom: 28 },
  qLabel:      { fontSize: 13, fontWeight: '700', color: PLUM, marginBottom: 12 },
  option:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                 padding: 16, borderRadius: 16, borderWidth: 1.5,
                 borderColor: BORDER, backgroundColor: WHITE, marginBottom: 10 },
  optActive:   { borderColor: ROSE_D, backgroundColor: '#FFF0F5' },
  radio:       { width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                 borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  radioActive: { borderColor: ROSE_D },
  radioCore:   { width: 8, height: 8, borderRadius: 4, backgroundColor: ROSE_D },
  optLabel:    { fontSize: 14, fontWeight: '600', color: PLUM, marginBottom: 2 },
  optSub:      { fontSize: 12, color: MUTED, lineHeight: 17 },
  btn:         { backgroundColor: ROSE_D, borderRadius: 16, paddingVertical: 16,
                 alignItems: 'center', marginTop: 20 },
  btnTxt:      { fontSize: 17, fontWeight: '700', color: WHITE },
});

// ── StatsView ─────────────────────────────────────────────────────────────────
function StatsView({ scores, wantsKids, age, onStart, onBack }) {
  const visible = METRICS.filter(m => {
    if (m.key === 'fertility') return wantsKids !== 'no' && scores.fertility !== null;
    return true;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={stv.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack} style={{ alignSelf: 'flex-start', marginBottom: 20 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={stv.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={stv.eyebrow}>STARTING POINT</Text>
        <Text style={stv.title}>Your starting scores</Text>
        <Text style={stv.sub}>Based on your age ({age}) and health profile.</Text>
        <Image source={getDog(age)} style={stv.dog} resizeMode="contain" />
        <View style={stv.card}>
          <Text style={stv.cardLabel}>AGE {age} · CAREER FOCUS SCENARIO</Text>
          {visible.map(m => (
            <StatBar key={m.key} label={m.label} value={scores[m.key]} color={m.color} />
          ))}
        </View>
        <View style={stv.noteCard}>
          <Text style={stv.noteTitle}>How these are calculated</Text>
          <Text style={stv.noteBody}>
            Health reflects your age and any conditions from your profile. Career is based on your current life stage. Fertility starts high at 22 and adjusts for any reproductive health conditions you noted during setup.
          </Text>
        </View>
        <TouchableOpacity style={stv.startBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={stv.startBtnTxt}>Begin the simulation →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const stv = StyleSheet.create({
  scroll:       { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 16, alignItems: 'center' },
  back:         { fontSize: 14, color: ROSE_D, fontWeight: '600' },
  eyebrow:      { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 2, marginBottom: 6 },
  title:        { fontSize: 26, fontWeight: '800', color: PLUM, letterSpacing: -0.5, textAlign: 'center' },
  sub:          { fontSize: 13, color: MUTED, marginTop: 4, marginBottom: 20, textAlign: 'center' },
  dog:          { width: 90, height: 90, marginBottom: 20 },
  card:         { width: '100%', backgroundColor: WHITE, borderRadius: 20, padding: 20,
                  borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  cardLabel:    { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 16 },
  noteCard:     { width: '100%', backgroundColor: '#F3E5F5', borderRadius: 16, padding: 16, marginBottom: 24 },
  noteTitle:    { fontSize: 13, fontWeight: '700', color: PLUM, marginBottom: 6 },
  noteBody:     { fontSize: 12, color: PLUM, lineHeight: 19 },
  startBtn:     { backgroundColor: ROSE_D, borderRadius: 16, paddingVertical: 16,
                  width: '100%', alignItems: 'center' },
  startBtnTxt:  { fontSize: 17, fontWeight: '700', color: WHITE },
});

// ── EpisodeView ───────────────────────────────────────────────────────────────
function EpisodeView({ episode, scores, wantsKids, epIndex, totalEps, onChoice, onUndo, onExit }) {
  const visible = METRICS.filter(m => {
    if (m.key === 'fertility') return wantsKids !== 'no' && scores.fertility !== null;
    return true;
  });
  const pct = ((epIndex + 1) / totalEps) * 100;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      {/* Header bar */}
      <View style={epv.header}>
        <TouchableOpacity onPress={onExit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={epv.exitTxt}>Exit</Text>
        </TouchableOpacity>
        <View style={epv.progWrap}>
          <View style={epv.progBg}>
            <View style={[epv.progFill, { width: `${pct}%` }]} />
          </View>
          <Text style={epv.progLabel}>{epIndex + 1} / {totalEps}</Text>
        </View>
        {epIndex > 0 ? (
          <TouchableOpacity onPress={onUndo} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={epv.undoTxt}>Undo</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={epv.scroll} showsVerticalScrollIndicator={false}>
        <View style={epv.ageBadge}>
          <Text style={epv.ageTxt}>Age {episode.age}</Text>
        </View>
        <Text style={epv.title}>{episode.title}</Text>

        {/* Score strip */}
        <View style={epv.scoreStrip}>
          {visible.map(m => (
            <View key={m.key} style={epv.scoreItem}>
              <View style={epv.scoreBg}>
                <View style={[epv.scoreFill, { width: `${scores[m.key]}%`, backgroundColor: m.color }]} />
              </View>
              <Text style={[epv.scoreVal, { color: m.color }]}>{scores[m.key]}</Text>
              <Text style={epv.scoreKey}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Lea dialogue */}
        <LeaBubble age={episode.age} text={episode.leaSays} />

        {/* Situation */}
        <View style={epv.situCard}>
          <Text style={epv.situLabel}>THE SITUATION</Text>
          <Text style={epv.situTxt}>{episode.situation}</Text>
        </View>

        {/* Company recs (fertility episode only) */}
        {episode.showCompanies && (
          <View style={{ marginBottom: 20 }}>
            <Text style={epv.sectionLabel}>COMPANIES RECRUITING YOU RIGHT NOW</Text>
            <Text style={epv.companiesNote}>
              Each has different benefits for women planning their future.
            </Text>
            {SIM_COMPANIES.map(c => <CompanyCard key={c.id} company={c} />)}
          </View>
        )}

        {/* Choices */}
        <Text style={epv.sectionLabel}>WHAT DO YOU DO?</Text>
        {episode.choices.map((choice, i) => (
          <TouchableOpacity
            key={choice.id}
            style={epv.choiceCard}
            onPress={() => onChoice(choice)}
            activeOpacity={0.8}
          >
            <Text style={epv.choiceLetter}>{i === 0 ? 'A' : 'B'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={epv.choiceLabel}>{choice.label}</Text>
              <View style={epv.deltaRow}>
                {Object.entries(choice.effect).map(([key, delta]) => {
                  if (key === 'fertility' && wantsKids === 'no') return null;
                  if (delta === 0) return null;
                  const m = METRICS.find(x => x.key === key);
                  if (!m) return null;
                  return (
                    <View key={key} style={[epv.delta, delta > 0 ? epv.deltaUp : epv.deltaDown]}>
                      <Text style={[epv.deltaTxt, { color: delta > 0 ? GREEN : ROSE_D }]}>
                        {m.label} {delta > 0 ? `+${delta}` : delta}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
const epv = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 20, paddingVertical: 12,
                  backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  exitTxt:      { fontSize: 14, fontWeight: '600', color: MUTED, width: 36 },
  undoTxt:      { fontSize: 14, fontWeight: '600', color: ROSE_D, width: 36, textAlign: 'right' },
  progWrap:     { flex: 1, alignItems: 'center', gap: 4, marginHorizontal: 12 },
  progBg:       { width: '100%', height: 4, backgroundColor: '#EEE8F5', borderRadius: 2, overflow: 'hidden' },
  progFill:     { height: '100%', backgroundColor: ROSE_D, borderRadius: 2 },
  progLabel:    { fontSize: 10, color: MUTED, fontWeight: '600' },

  scroll:       { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 20 },
  ageBadge:     { alignSelf: 'flex-start', backgroundColor: PLUM, paddingHorizontal: 12,
                  paddingVertical: 5, borderRadius: 100, marginBottom: 10 },
  ageTxt:       { fontSize: 12, fontWeight: '800', color: WHITE, letterSpacing: 0.5 },
  title:        { fontSize: 22, fontWeight: '800', color: PLUM, marginBottom: 16, letterSpacing: -0.3 },

  scoreStrip:   { flexDirection: 'row', gap: 8, backgroundColor: WHITE, borderRadius: 16,
                  padding: 14, borderWidth: 1, borderColor: BORDER, marginBottom: 20 },
  scoreItem:    { flex: 1, alignItems: 'center', gap: 4 },
  scoreBg:      { width: '100%', height: 5, backgroundColor: '#EEE8F5', borderRadius: 3, overflow: 'hidden' },
  scoreFill:    { height: '100%', borderRadius: 3 },
  scoreVal:     { fontSize: 12, fontWeight: '800' },
  scoreKey:     { fontSize: 9, color: MUTED, fontWeight: '600', letterSpacing: 0.3 },

  situCard:     { backgroundColor: WHITE, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: BORDER, marginBottom: 20 },
  situLabel:    { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1.5, marginBottom: 8 },
  situTxt:      { fontSize: 14, lineHeight: 22, color: PLUM },

  sectionLabel: { fontSize: 10, fontWeight: '800', color: MUTED, letterSpacing: 1.5, marginBottom: 8 },
  companiesNote:{ fontSize: 12, color: MUTED, marginBottom: 10, lineHeight: 18 },

  choiceCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12,
                  backgroundColor: WHITE, borderRadius: 18, borderWidth: 1.5,
                  borderColor: BORDER, padding: 16, marginBottom: 12,
                  shadowColor: ROSE_D, shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  choiceLetter: { fontSize: 16, fontWeight: '900', color: ROSE_D, width: 22, lineHeight: 22 },
  choiceLabel:  { fontSize: 14, fontWeight: '600', color: PLUM, lineHeight: 21, marginBottom: 8 },
  deltaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  delta:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 1 },
  deltaUp:      { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  deltaDown:    { backgroundColor: '#FCE4EC', borderColor: '#F48FB1' },
  deltaTxt:     { fontSize: 10, fontWeight: '700' },
});

// ── SummaryView ───────────────────────────────────────────────────────────────
function SummaryView({ scores, wantsKids, history, conditions, onReset }) {
  const [journeyOpen,    setJourneyOpen]    = useState(false);
  const [expandedCard,   setExpandedCard]   = useState(null);
  const visible     = METRICS.filter(m => {
    if (m.key === 'fertility') return wantsKids !== 'no' && scores.fertility !== null;
    return true;
  });
  const healthCards = getRelevantHealthCards(history, scores, conditions);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView contentContainerStyle={smv.scroll} showsVerticalScrollIndicator={false}>
        <Image source={getDog(30)} style={smv.dog} resizeMode="contain" />
        <Text style={smv.eyebrow}>AGE 30 · SIMULATION COMPLETE</Text>
        <Text style={smv.title}>One version of your story</Text>
        <Text style={smv.sub}>Every choice shaped something. None of them are wrong.</Text>

        {/* Final scores */}
        <View style={smv.scoresCard}>
          <Text style={smv.scoresLabel}>WHERE YOU ENDED UP</Text>
          {visible.map(m => (
            <StatBar key={m.key} label={m.label} value={scores[m.key]} color={m.color} />
          ))}
        </View>

        {/* Journey accordion */}
        <View style={smv.journeyCard}>
          <TouchableOpacity
            style={smv.journeyHeader}
            onPress={() => setJourneyOpen(o => !o)}
            activeOpacity={0.8}
          >
            <Text style={smv.journeyLabel}>YOUR CHOICES</Text>
            <Text style={smv.journeyArrow}>{journeyOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>
          {journeyOpen && history.map((h, i) => (
            <View key={i} style={[smv.journeyRow, i === history.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={smv.jAge}>Age {h.age}</Text>
              <Text style={smv.jChoice}>{h.choiceLabel}</Text>
              <Text style={smv.jConseq}>{h.consequence}</Text>
            </View>
          ))}
        </View>

        {/* Health cards */}
        {healthCards.length > 0 && (
          <View style={{ width: '100%', marginBottom: 20 }}>
            <Text style={smv.cardsLabel}>WORTH READING</Text>
            {healthCards.map(card => (
              <HealthCard
                key={card.id}
                card={card}
                expanded={expandedCard === card.id}
                onToggle={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={smv.resetBtn} onPress={onReset} activeOpacity={0.85}>
          <Text style={smv.resetTxt}>Try a different path</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const smv = StyleSheet.create({
  scroll:        { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 24, alignItems: 'center' },
  dog:           { width: 90, height: 90, marginBottom: 16 },
  eyebrow:       { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 2, marginBottom: 8 },
  title:         { fontSize: 26, fontWeight: '800', color: PLUM, textAlign: 'center', letterSpacing: -0.5 },
  sub:           { fontSize: 13, color: MUTED, textAlign: 'center', marginTop: 6, marginBottom: 24, lineHeight: 20 },
  scoresCard:    { width: '100%', backgroundColor: WHITE, borderRadius: 20, padding: 20,
                   borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  scoresLabel:   { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, marginBottom: 16 },
  journeyCard:   { width: '100%', backgroundColor: WHITE, borderRadius: 16,
                   borderWidth: 1, borderColor: BORDER, overflow: 'hidden', marginBottom: 20 },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'center', padding: 16 },
  journeyLabel:  { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2 },
  journeyArrow:  { fontSize: 10, color: MUTED },
  journeyRow:    { paddingHorizontal: 16, paddingVertical: 12,
                   borderBottomWidth: 1, borderBottomColor: '#FFF0F5' },
  jAge:          { fontSize: 11, fontWeight: '700', color: ROSE_D, marginBottom: 2 },
  jChoice:       { fontSize: 13, fontWeight: '600', color: PLUM, marginBottom: 3 },
  jConseq:       { fontSize: 12, color: MUTED, lineHeight: 18 },
  cardsLabel:    { fontSize: 11, fontWeight: '800', color: MUTED, letterSpacing: 1.5, marginBottom: 12 },
  resetBtn:      { backgroundColor: WHITE, borderRadius: 16, paddingVertical: 16,
                   width: '100%', alignItems: 'center',
                   borderWidth: 1.5, borderColor: ROSE_D },
  resetTxt:      { fontSize: 16, fontWeight: '700', color: ROSE_D },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function SimulationScreen() {
  const [view,        setView]       = useState('landing');
  const [wantsKids,   setWantsKids]  = useState('maybe');
  const [userData,    setUserData]   = useState({});
  const [scores,      setScores]     = useState({ health: 80, career: 50, relationship: 65, fertility: 80 });
  const [episodes,    setEpisodes]   = useState([]);
  const [epIndex,     setEpIndex]    = useState(0);
  const [history,     setHistory]    = useState([]);
  const [lowScoreKey, setLowScoreKey]= useState(null);
  const [pendingAdvance, setPendingAdvance] = useState(false);

  useEffect(() => {
    async function load() {
      const age        = await Storage.get(Storage.KEYS.USER_AGE)        || '22';
      const conditions = await Storage.get(Storage.KEYS.USER_CONDITIONS) || [];
      const priorities = await Storage.get(Storage.KEYS.USER_PRIORITIES) || [];
      const lifeStage  = await Storage.get(Storage.KEYS.USER_LIFE_STAGE) || 'Early career';
      setUserData({ age, conditions, priorities, lifeStage });
    }
    load();
  }, []);

  function startScenario(kidsAnswer) {
    const starting = computeStartingScores(userData, kidsAnswer);
    setWantsKids(kidsAnswer);
    setScores(starting);
    const eps = buildEpisodes(kidsAnswer);
    setEpisodes(eps);
    setEpIndex(0);
    setHistory([]);
    setView('stats');
  }

  function handleChoice(choice) {
    const ep         = episodes[epIndex];
    const newScores  = applyEffect(scores, choice.effect, wantsKids);
    const newHistory = [...history, {
      age:         ep.age,
      choiceLabel: choice.label,
      consequence: choice.consequence,
      episodeId:   choice.id,
      scoresBefore:{ ...scores },
      effect:      choice.effect,
    }];

    setScores(newScores);
    setHistory(newHistory);

    const lowKey = Object.keys(choice.effect).find(k => {
      if (k === 'fertility' && wantsKids === 'no') return false;
      if (newScores[k] === null || newScores[k] === undefined) return false;
      return newScores[k] < 30 && choice.effect[k] < 0;
    });

    if (lowKey) {
      setLowScoreKey(lowKey);
      setPendingAdvance(true);
    } else {
      doAdvance(epIndex);
    }
  }

  function doAdvance(currentIndex) {
    if (currentIndex + 1 >= episodes.length) {
      Points.add(POINTS.SIMULATION_COMPLETE);
      setView('summary');
    } else {
      setEpIndex(currentIndex + 1);
    }
  }

  function handleDismissWarning() {
    setLowScoreKey(null);
    setPendingAdvance(false);
    doAdvance(epIndex);
  }

  function handleUndo() {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setScores(prev.scoresBefore);
    setHistory(h => h.slice(0, -1));
    setEpIndex(i => i - 1);
  }

  function handleExit() {
    setView('landing');
    setHistory([]);
    setEpIndex(0);
    setLowScoreKey(null);
    setPendingAdvance(false);
  }

  const currentEp = episodes[epIndex];

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="dark-content" />

      {view === 'landing' && (
        <LandingView onSelect={() => setView('setup')} />
      )}

      {view === 'setup' && (
        <SetupView
          userData={userData}
          onConfirm={startScenario}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'stats' && (
        <StatsView
          scores={scores}
          wantsKids={wantsKids}
          age={parseInt(userData.age) || 22}
          onStart={() => setView('episode')}
          onBack={() => setView('setup')}
        />
      )}

      {view === 'episode' && currentEp && (
        <EpisodeView
          episode={currentEp}
          scores={scores}
          wantsKids={wantsKids}
          epIndex={epIndex}
          totalEps={episodes.length}
          onChoice={handleChoice}
          onUndo={handleUndo}
          onExit={handleExit}
        />
      )}

      {view === 'summary' && (
        <SummaryView
          scores={scores}
          wantsKids={wantsKids}
          history={history}
          conditions={userData.conditions || []}
          onReset={handleExit}
        />
      )}

      {lowScoreKey && (
        <LowScoreWarning
          metricKey={lowScoreKey}
          onDismiss={handleDismissWarning}
        />
      )}
    </View>
  );
}
