import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Modal, PanResponder, Linking,
  FlatList, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import companies from '../data/company_details.json';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY      = '#1565C0';
const CURRENT_YEAR = 2025;
const NODE_SIZE    = 36;
const TIMELINE_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];

// ── Milestone data (hardcoded for demo) ───────────────────────────────────────
const MILESTONES = {
  2025: [
    {
      id: '2025-1',
      title: 'HPV Vaccine (if not completed)',
      desc: 'Cervical cancer prevention, recommended before 26',
      body: 'The HPV vaccine protects against strains of human papillomavirus that cause most cervical cancers. It is most effective when given before exposure to the virus. In Singapore it is recommended for females aged 9–26. Even if you are older, speak to your GP — it may still offer partial protection. This is one of the most impactful preventive steps you can take for your long-term health.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2025-2',
      title: 'General Blood Panel',
      desc: 'Baseline health markers for future comparison',
      body: 'A general blood panel establishes your baseline for key health markers including full blood count, liver function, kidney function, and blood glucose. Having a baseline in your early twenties means future tests can detect subtle changes early. Many conditions — including early-stage thyroid issues and anaemia — are caught this way. It is a painless, affordable test available at most polyclinics.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2026: [
    {
      id: '2026-1',
      title: 'Dental Checkup',
      desc: 'Recommended every 6 months',
      body: 'Regular dental checkups every six months catch cavities, gum disease, and early signs of oral cancer before they become costly problems. Gum disease has been linked to cardiovascular risk and pregnancy complications. Many dental issues are asymptomatic early on, making routine visits essential even when you feel fine.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2026-2',
      title: 'Eye Test',
      desc: 'Annual vision and eye health check',
      body: 'Annual eye examinations check not just your vision prescription but also screen for conditions like glaucoma and macular degeneration. Singapore has one of the highest rates of myopia globally, making regular monitoring especially important. An eye test can also reveal systemic issues such as high blood pressure and early diabetes.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2027: [
    {
      id: '2027-1',
      title: 'Thyroid Panel',
      desc: 'Early detection of subclinical hypothyroidism',
      body: 'Thyroid disorders are significantly more common in women and often go undetected for years. A thyroid panel measures TSH, T3, and T4 levels and can identify both underactive and overactive thyroid function. Subclinical hypothyroidism is particularly common in women in their twenties and can affect energy, mood, and menstrual cycles.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2027-2',
      title: 'Blood Pressure Check',
      desc: 'Baseline cardiovascular marker',
      body: 'High blood pressure is often called the silent killer because it produces no symptoms until damage has occurred. Establishing a baseline in your mid-twenties helps track trends over time. Blood pressure can be influenced by stress, diet, hormonal contraceptives, and genetic factors. A single reading takes under two minutes at any polyclinic.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2028: [
    {
      id: '2028-1',
      title: 'Full Body Skin Check',
      desc: 'Dermatologist recommended annually',
      body: 'A full body skin examination screens for suspicious moles, lesions, and early signs of skin cancer. Melanoma is highly treatable when caught early but can be life-threatening if left undetected. Annual checks are especially important if you have a family history of skin cancer or significant sun exposure history.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2028-2',
      title: 'Iron and Ferritin Levels',
      desc: 'Especially relevant for women with heavy periods',
      body: 'Iron deficiency is the most common nutritional deficiency worldwide and disproportionately affects women. Ferritin — the stored form of iron — can be depleted even when haemoglobin appears normal, causing fatigue, brain fog, and hair thinning. Women with heavy periods, PCOS, or endometriosis are at higher risk and benefit from monitoring these levels annually.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2029: [
    {
      id: '2029-1',
      title: 'First Pap Smear',
      desc: 'Recommended from age 25 in Singapore',
      body: 'The Pap smear screens for abnormal cervical cells that could develop into cervical cancer if left untreated. In Singapore, it is recommended every three years starting from age 25. The procedure takes just a few minutes at polyclinics or gynaecology clinics. Most abnormal results are not cancer — they are early warning signs that are highly manageable when caught early.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2029-2',
      title: 'STI Screening',
      desc: 'Routine screening — no stigma',
      body: 'Routine STI screening is a normal part of preventive healthcare for sexually active adults. Many STIs including chlamydia and gonorrhoea are asymptomatic and can cause long-term complications including fertility issues if untreated. Screening is confidential and available at DSC Clinic, polyclinics, and private clinics in Singapore.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2030: [
    {
      id: '2030-1',
      title: 'Repeat Pap Smear',
      desc: 'Every 3 years from first test',
      body: 'A follow-up Pap smear three years after your first maintains continuity in cervical cancer screening. Combined with HPV vaccination, regular Pap smears dramatically reduce cervical cancer risk. If your previous result was normal, this repeat provides reassurance and establishes a clear screening history.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2030-2',
      title: 'Bone Density Baseline',
      desc: 'Early benchmark before turning 30',
      body: 'Peak bone mass is reached in your late twenties, making this an ideal time to establish a baseline measurement. Women are at higher risk of osteoporosis than men, and conditions like PCOS or low oestrogen can accelerate bone loss. Knowing your baseline now allows for meaningful comparison in future decades.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2031: [
    {
      id: '2031-1',
      title: 'AMH Test (Ovarian Reserve)',
      desc: 'Informational, not a verdict',
      body: 'Anti-Müllerian hormone (AMH) gives an estimate of your ovarian reserve — the number of remaining eggs. It does not predict fertility with certainty as egg quality also matters. For women who want children in future, an AMH test in the late twenties provides data for planning conversations with a fertility specialist. A low AMH does not mean you cannot conceive.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2031-2',
      title: 'Cholesterol Panel',
      desc: 'Cardiovascular risk baseline',
      body: 'A lipid panel measures total cholesterol, LDL, HDL, and triglycerides. Establishing this baseline in your late twenties allows tracking of trends over time. Diet, exercise, genetics, and hormonal changes can all affect lipid levels. Heart disease is the leading cause of death in women globally, making early data valuable.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2032: [
    {
      id: '2032-1',
      title: 'AMH Test (Repeat)',
      desc: 'Trend data for family planning awareness',
      body: 'A repeat AMH test a year after your baseline provides trend data rather than a single snapshot. A stable or modestly declining AMH is normal; a sharp drop warrants a conversation with a reproductive specialist. This is about having the information to make informed choices on your own timeline, not about creating anxiety.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2032-2',
      title: 'Repeat Cholesterol Panel',
      desc: 'Track changes over time',
      body: 'Repeating your lipid panel every 2–3 years through your late twenties and thirties helps catch unfavourable trends before they become cardiovascular risk factors. Lifestyle interventions including diet and exercise are most effective when started early and tracked consistently.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2033: [
    {
      id: '2033-1',
      title: 'Mammogram Baseline Discussion',
      desc: 'Discuss timing with your GP',
      body: 'While routine mammograms are typically recommended from age 40 in Singapore, women with a family history of breast cancer may benefit from earlier screening. At this age, a conversation with your GP about your personal risk factors is a proactive step. Your GP can also teach you self-examination techniques to use at home.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2033-2',
      title: 'Full Hormonal Panel',
      desc: 'Comprehensive endocrine health snapshot',
      body: 'A full hormonal panel covering oestrogen, progesterone, testosterone, prolactin, FSH, and LH gives a comprehensive picture of endocrine health. Changes in these hormones can indicate PCOS, thyroid dysfunction, or adrenal issues. This data is especially useful if you have been experiencing unexplained weight changes, mood shifts, or irregular cycles.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2034: [
    {
      id: '2034-1',
      title: 'Repeat Bone Density',
      desc: 'Compare against your 2030 baseline',
      body: 'Comparing this measurement against your earlier baseline reveals whether you are maintaining, gaining, or losing bone density across the critical late-twenties period. Weight-bearing exercise, adequate calcium and vitamin D, and avoiding smoking all help preserve bone density. If decline is noted, dietary and lifestyle adjustments can slow it significantly.',
      source: 'MOH Singapore / CDC',
    },
  ],
  2035: [
    {
      id: '2035-1',
      title: 'Comprehensive Health Review',
      desc: 'Decade milestone — full health audit',
      body: 'A comprehensive health review with your GP is an ideal opportunity to collate all your health data from the past decade — blood panels, hormonal profiles, bone density, and screening results. This visit establishes a plan for your thirties and identifies any areas that need more frequent monitoring.',
      source: 'MOH Singapore / CDC',
    },
    {
      id: '2035-2',
      title: 'Repeat Pap Smear',
      desc: 'Continuing the 3-year cycle',
      body: 'Your third Pap smear continues the three-year screening cycle started at 25. At this point you have three data points — the trend across these results helps your gynaecologist assess your ongoing cervical health. Combined with HPV vaccination, consistent screening dramatically reduces cervical cancer risk.',
      source: 'MOH Singapore / CDC',
    },
  ],
};

const MILESTONE_YEARS = new Set(Object.keys(MILESTONES).map(Number));

// ── Company / career data ─────────────────────────────────────────────────────
const TAG_META = {
  extended_maternity:   { label: 'Maternity Leave',   bg: '#E8F5E9', text: '#2E7D32' },
  fertility_coverage:   { label: 'Fertility Support', bg: '#E8F5E9', text: '#2E7D32' },
  menstrual_leave:      { label: 'Menstrual Leave',   bg: '#E8F5E9', text: '#2E7D32' },
  flexible_remote_work: { label: 'Flexible Work',     bg: '#FFF3E0', text: '#6D4C41' },
  women_leadership:     { label: 'Leadership',        bg: '#FFF3E0', text: '#6D4C41' },
  mental_health:        { label: 'Mental Health',     bg: '#FCE4EC', text: '#C2185B' },
  menopause_support:    { label: 'Menopause',         bg: '#FCE4EC', text: '#C2185B' },
  childcare_support:    { label: 'Childcare',         bg: '#FCE4EC', text: '#C2185B' },
  wellness:             { label: 'Wellness',          bg: '#FCE4EC', text: '#C2185B' },
};

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

// Prudential Singapore — hardcoded default for demo
const DEFAULT_COMPANY = companies[0]; // first entry in JSON is Prudential SG

// ── Card background colours — alternate per index ─────────────────────────────
const CARD_BG = ['#FFF4F6', '#F4F0FF'];

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ActScreen() {
  const [selectedYear,    setSelectedYear]    = useState(CURRENT_YEAR);
  const [nodeSpacing,     setNodeSpacing]      = useState(72);
  const [showPinchHint,   setShowPinchHint]   = useState(true);
  const [learnMoreItem,   setLearnMoreItem]    = useState(null);
  const [showCompanies,   setShowCompanies]   = useState(false);
  const [showPrefs,       setShowPrefs]       = useState(false);
  const [region,          setRegion]          = useState('Singapore');
  const [activeFilters,   setActiveFilters]   = useState([]);
  const [careerStage,     setCareerStage]     = useState('');
  const [expandedCompany, setExpandedCompany] = useState(null);

  const timelineRef       = useRef(null);
  const nodeSpacingRef    = useRef(72);
  const pinchBaseDistRef  = useRef(0);
  const pinchBaseSpaceRef = useRef(72);

  function updateSpacing(val) {
    nodeSpacingRef.current = val;
    setNodeSpacing(val);
  }

  // ── Pinch-to-zoom PanResponder ─────────────────────────────────────────────
  const pinchHandler = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder:  (evt) => evt.nativeEvent.touches.length >= 2,
      onPanResponderGrant: (evt) => {
        const t = evt.nativeEvent.touches;
        if (t.length >= 2) {
          pinchBaseDistRef.current  = Math.abs(t[0].pageX - t[1].pageX);
          pinchBaseSpaceRef.current = nodeSpacingRef.current;
          setShowPinchHint(false);
        }
      },
      onPanResponderMove: (evt) => {
        const t = evt.nativeEvent.touches;
        if (t.length >= 2 && pinchBaseDistRef.current > 0) {
          const dist  = Math.abs(t[0].pageX - t[1].pageX);
          const scale = dist / pinchBaseDistRef.current;
          const next  = Math.min(120, Math.max(52, Math.round(pinchBaseSpaceRef.current * scale)));
          nodeSpacingRef.current = next;
          setNodeSpacing(next);
        }
      },
      onPanResponderRelease: () => { pinchBaseDistRef.current = 0; },
    })
  ).current;

  function handleYearTap(year) {
    setSelectedYear(year);
    const idx = TIMELINE_YEARS.indexOf(year);
    if (timelineRef.current && idx >= 0) {
      const gapWidth = nodeSpacingRef.current - NODE_SIZE;
      timelineRef.current.scrollTo({
        x: Math.max(0, idx * (NODE_SIZE + gapWidth) - 40),
        animated: true,
      });
    }
  }

  function toggleFilter(key) {
    setActiveFilters(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  }

  const milestones = MILESTONES[selectedYear] || [];

  const filteredCompanies = companies.filter(c => {
    const regionKey = region === 'Singapore' ? 'Singapore' : 'Global';
    if (!c.region.includes(regionKey)) return false;
    if (activeFilters.length === 0) return true;
    return activeFilters.some(f => c.benefits && c.benefits[f]);
  });

  const gapWidth = nodeSpacing - NODE_SIZE;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── 1. Header ────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>SECTION 4</Text>
          <Text style={styles.title}>Planning</Text>
          <Text style={styles.titleSub}>Your life, at a glance</Text>
        </View>

        {/* ── 2. Timeline ──────────────────────────────────────────────── */}
        <View style={styles.timelineSection}>
          <View {...pinchHandler.panHandlers}>
            <ScrollView
              ref={timelineRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.timelineContent}
            >
              {TIMELINE_YEARS.map((year, idx) => {
                const isSelected   = year === selectedYear;
                const isPast       = year < CURRENT_YEAR;
                const isCurrent    = year === CURRENT_YEAR;
                const hasMilestone = MILESTONE_YEARS.has(year);

                let circleStyle = styles.nodeEmpty;
                let textStyle   = styles.nodeText;
                if (isSelected) {
                  circleStyle = styles.nodeSelected;
                  textStyle   = styles.nodeTextSelected;
                } else if (isPast || isCurrent) {
                  circleStyle = styles.nodePast;
                  textStyle   = styles.nodeTextPast;
                } else if (hasMilestone) {
                  circleStyle = styles.nodeFutureMilestone;
                }

                return (
                  <View key={year} style={styles.nodeWrapper}>
                    {/* Connecting line (not before first node) */}
                    {idx > 0 && (
                      <View style={[styles.connector, { width: gapWidth }]} />
                    )}
                    <TouchableOpacity
                      onPress={() => handleYearTap(year)}
                      activeOpacity={0.75}
                      style={styles.nodeColumn}
                    >
                      <View style={[styles.nodeCircle, circleStyle]}>
                        <Text style={[styles.nodeText, textStyle]}>
                          {String(year).slice(2)}
                        </Text>
                      </View>
                      {hasMilestone ? (
                        <View style={styles.milestoneDot} />
                      ) : (
                        <View style={styles.milestoneDotHidden} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          <Text style={[styles.pinchHint, { opacity: showPinchHint ? 1 : 0 }]}>
            pinch to expand
          </Text>
        </View>

        {/* ── 3. Health Checkups Panel ─────────────────────────────────── */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Health Checkups</Text>
            <Text style={styles.panelYear}>{selectedYear}</Text>
          </View>

          {milestones.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No checkups recorded for {selectedYear}</Text>
            </View>
          ) : (
            milestones.map((m, i) => (
              <View key={m.id} style={[styles.milestoneCard, { backgroundColor: CARD_BG[i % 2] }]}>
                <View style={styles.milestoneLeftBar} />
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneTitle}>{m.title}</Text>
                  <Text style={styles.milestoneDesc} numberOfLines={1}>{m.desc}</Text>
                  <View style={styles.milestoneFooter}>
                    <View style={styles.healthTag}>
                      <Text style={styles.healthTagText}>Health</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setLearnMoreItem(m)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.learnMoreLink}>Learn more</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* ── 4. Career Panel ──────────────────────────────────────────── */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Career</Text>
            <TouchableOpacity
              onPress={() => setShowPrefs(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.changePrefsLink}>Change preferences</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.companyCard}>
            <Text style={styles.companyName}>{DEFAULT_COMPANY.name}</Text>
            <Text style={styles.companyHeadline}>
              {DEFAULT_COMPANY.maternity_weeks
                ? `${DEFAULT_COMPANY.maternity_weeks} Weeks Maternity Leave`
                : DEFAULT_COMPANY.highlight.split(',')[0].trim()}
            </Text>
            <Text style={styles.companyNotable} numberOfLines={2}>
              {DEFAULT_COMPANY.notable}
            </Text>
            <View style={styles.companyCardFooter}>
              <View style={styles.tagRow}>
                {(DEFAULT_COMPANY.tags || []).slice(0, 2).map(tag => {
                  const m = TAG_META[tag] ?? { label: tag, bg: '#E8F5E9', text: '#2E7D32' };
                  return (
                    <View key={tag} style={[styles.tagPill, { backgroundColor: m.bg }]}>
                      <Text style={[styles.tagPillText, { color: m.text }]}>{m.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.companyCardRight}>
                <Text style={styles.regionLabel}>SG</Text>
                <TouchableOpacity onPress={() => setShowCompanies(true)}>
                  <Text style={styles.seeMoreLink}>See more matches</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* ── 5. Source footer ─────────────────────────────────────────── */}
        <Text style={styles.sourceFooter}>
          Health data: MOH Singapore, CDC. Benefits data: company public disclosures.
        </Text>

      </ScrollView>

      {/* ══ Learn More bottom sheet ════════════════════════════════════════ */}
      <Modal
        visible={!!learnMoreItem}
        animationType="slide"
        transparent
        onRequestClose={() => setLearnMoreItem(null)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setLearnMoreItem(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setLearnMoreItem(null)}>
              <Text style={styles.sheetCloseTxt}>✕</Text>
            </TouchableOpacity>
            {learnMoreItem && (
              <>
                <Text style={styles.sheetTitle}>{learnMoreItem.title}</Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
                  <Text style={styles.sheetBody}>{learnMoreItem.body}</Text>
                </ScrollView>
                <Text style={styles.sheetSource}>Source: {learnMoreItem.source}</Text>
                <TouchableOpacity
                  style={styles.sheetPrimaryBtn}
                  onPress={() => Linking.openURL('https://www.healthhub.sg/programmes/screen-for-life')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.sheetPrimaryBtnText}>Find a clinic</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ══ See More Matches bottom sheet ══════════════════════════════════ */}
      <Modal
        visible={showCompanies}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompanies(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayDismiss} activeOpacity={1} onPress={() => setShowCompanies(false)} />
          <View style={[styles.sheet, styles.sheetTall]}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowCompanies(false)}>
              <Text style={styles.sheetCloseTxt}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.sheetTitle}>More matches</Text>
            <FlatList
              data={filteredCompanies.slice(0, 25)}
              keyExtractor={item => String(item.id)}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isExpanded = expandedCompany === item.id;
                const headline   = item.maternity_weeks
                  ? `${item.maternity_weeks} Weeks Maternity Leave`
                  : (item.highlight || '').split(',')[0].trim();
                return (
                  <TouchableOpacity
                    style={styles.companyRow}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setExpandedCompany(isExpanded ? null : item.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.companyRowInner}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.companyRowName}>{item.name}</Text>
                        <Text style={styles.companyRowBenefit} numberOfLines={1}>{headline}</Text>
                        {isExpanded && (
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.companyRowExpanded}>{item.notable}</Text>
                            <View style={[styles.tagRow, { marginTop: 6 }]}>
                              {(item.tags || []).slice(0, 2).map(tag => {
                                const m = TAG_META[tag] ?? { label: tag, bg: '#E8F5E9', text: '#2E7D32' };
                                return (
                                  <View key={tag} style={[styles.tagPill, { backgroundColor: m.bg }]}>
                                    <Text style={[styles.tagPillText, { color: m.text }]}>{m.label}</Text>
                                  </View>
                                );
                              })}
                            </View>
                          </View>
                        )}
                      </View>
                      <Text style={styles.chevron}>{isExpanded ? '▾' : '▸'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ══ Change Preferences bottom sheet ════════════════════════════════ */}
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
              {/* Region */}
              <Text style={styles.prefLabel}>REGION</Text>
              <View style={styles.prefToggleRow}>
                {['Singapore', 'Global'].map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.prefToggleBtn, region === r && styles.prefToggleBtnActive]}
                    onPress={() => setRegion(r)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefToggleBtnText, region === r && styles.prefToggleBtnTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Benefits */}
              <Text style={styles.prefLabel}>BENEFITS</Text>
              <View style={styles.prefChipRow}>
                {BENEFIT_FILTERS.map(f => {
                  const active = activeFilters.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.prefChip, active && styles.prefChipActive]}
                      onPress={() => toggleFilter(f.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.prefChipText, active && styles.prefChipTextActive]}>
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Career stage */}
              <Text style={styles.prefLabel}>CAREER STAGE</Text>
              <View style={styles.prefChipRow}>
                {CAREER_STAGES.map(s => (
                  <TouchableOpacity
                    key={s.key}
                    style={[styles.prefChip, careerStage === s.key && styles.prefChipActive]}
                    onPress={() => setCareerStage(prev => prev === s.key ? '' : s.key)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.prefChipText, careerStage === s.key && styles.prefChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
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
  safe:   { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { paddingBottom: 48 },

  // Header
  header:      { paddingHorizontal: 20, paddingTop: 20, marginBottom: 20 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', color: '#90A4AE', letterSpacing: 1.5, marginBottom: 4 },
  title:       { fontSize: 32, fontWeight: '800', color: '#0D1B2A', marginBottom: 2 },
  titleSub:    { fontSize: 14, color: '#888888' },

  // Timeline
  timelineSection: { marginBottom: 28 },
  timelineContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  nodeWrapper:     { flexDirection: 'row', alignItems: 'center' },
  connector:       { height: 1, backgroundColor: '#DCDCDC' },
  nodeColumn:      { alignItems: 'center' },
  nodeCircle: {
    width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  nodeSelected: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY, shadowOpacity: 0.45, shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 }, elevation: 5,
  },
  nodePast:           { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#D8D8D8' },
  nodeFutureMilestone:{ borderWidth: 1.5, borderColor: PRIMARY },
  nodeEmpty:          { borderWidth: 1, borderColor: '#D0D0D0' },
  nodeText:           { fontSize: 11, fontWeight: '600', color: PRIMARY },
  nodeTextSelected:   { color: '#FFFFFF', fontWeight: '700' },
  nodeTextPast:       { color: '#AAAAAA' },
  milestoneDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: PRIMARY, marginTop: 4 },
  milestoneDotHidden: { width: 6, height: 6, marginTop: 4, opacity: 0 },
  pinchHint:          { fontSize: 10, color: '#BBBBBB', textAlign: 'center', marginTop: 4 },

  // Panels
  panel:       { paddingHorizontal: 20, marginBottom: 28 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle:  { fontSize: 18, fontWeight: '700', color: '#0D1B2A' },
  panelYear:   { fontSize: 14, color: '#888888' },

  // Milestone cards
  milestoneCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  milestoneLeftBar: { width: 3, backgroundColor: PRIMARY, borderRadius: 2, marginRight: 12 },
  milestoneContent: { flex: 1 },
  milestoneTitle:   { fontSize: 15, fontWeight: '700', color: '#0D1B2A', marginBottom: 4 },
  milestoneDesc:    { fontSize: 12, color: '#666666', marginBottom: 10 },
  milestoneFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  healthTag:        { backgroundColor: '#E8F5E9', borderRadius: 100, paddingHorizontal: 6, paddingVertical: 4 },
  healthTagText:    { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  learnMoreLink:    { fontSize: 12, color: PRIMARY },
  emptyCard:        { backgroundColor: '#F8F8F8', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyCardText:    { fontSize: 13, color: '#AAAAAA' },

  // Career panel
  changePrefsLink: { fontSize: 13, color: PRIMARY },
  companyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  companyName:      { fontSize: 16, fontWeight: '700', color: '#0D1B2A', marginBottom: 4 },
  companyHeadline:  { fontSize: 13, color: PRIMARY, marginBottom: 6 },
  companyNotable:   { fontSize: 13, color: '#666666', lineHeight: 19, marginBottom: 12 },
  companyCardFooter:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  companyCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionLabel:      { fontSize: 11, color: '#AAAAAA' },
  seeMoreLink:      { fontSize: 13, color: PRIMARY },
  tagRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagPill:          { borderRadius: 100, paddingHorizontal: 6, paddingVertical: 4 },
  tagPillText:      { fontSize: 11, fontWeight: '700' },

  // Source footer
  sourceFooter: { fontSize: 11, color: '#AAAAAA', textAlign: 'center', paddingHorizontal: 20, paddingBottom: 8 },

  // Bottom sheets (shared)
  overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)', justifyContent: 'flex-end' },
  overlayDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    maxHeight: '70%',
  },
  sheetTall:     { maxHeight: '82%' },
  sheetHandle:   { width: 36, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetCloseBtn: { position: 'absolute', top: 20, right: 20, width: 28, height: 28, borderRadius: 14, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  sheetCloseTxt: { fontSize: 12, color: '#546E7A', fontWeight: '700' },
  sheetTitle:    { fontSize: 18, fontWeight: '700', color: '#0D1B2A', marginBottom: 14 },
  sheetBody:     { fontSize: 14, color: '#444444', lineHeight: 22 },
  sheetSource:   { fontSize: 11, color: '#AAAAAA', marginTop: 12, marginBottom: 16 },
  sheetPrimaryBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  sheetPrimaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  // Company row (see more modal)
  companyRow:      { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  companyRowInner: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 8 },
  companyRowName:  { fontSize: 14, fontWeight: '700', color: '#0D1B2A', marginBottom: 2 },
  companyRowBenefit:  { fontSize: 12, color: '#888888' },
  companyRowExpanded: { fontSize: 13, color: '#444444', lineHeight: 19, marginTop: 4 },
  chevron:         { fontSize: 14, color: '#AAAAAA', paddingTop: 2 },

  // Preferences modal
  prefLabel:    { fontSize: 11, fontWeight: '700', color: '#888888', letterSpacing: 1.2, marginBottom: 10, marginTop: 16 },
  prefToggleRow:{ flexDirection: 'row', gap: 8, marginBottom: 4 },
  prefToggleBtn:{
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#B3E5FC', alignItems: 'center', backgroundColor: '#F8FBFF',
  },
  prefToggleBtnActive:    { backgroundColor: PRIMARY, borderColor: PRIMARY },
  prefToggleBtnText:      { fontSize: 14, fontWeight: '600', color: PRIMARY },
  prefToggleBtnTextActive:{ color: '#FFFFFF' },
  prefChipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 100,
    borderWidth: 1.5, borderColor: '#D0D0D0', backgroundColor: '#FAFAFA',
  },
  prefChipActive:     { backgroundColor: PRIMARY, borderColor: PRIMARY },
  prefChipText:       { fontSize: 13, color: '#444444', fontWeight: '500' },
  prefChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  applyBtn: {
    backgroundColor: PRIMARY, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 8,
  },
  applyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
