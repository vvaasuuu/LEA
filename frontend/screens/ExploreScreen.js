import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TextInput, TouchableOpacity, Modal, ScrollView, Linking,
} from 'react-native';

const CONDITIONS = [
  {
    id: '1',
    emoji: '🩸',
    name: 'PCOS',
    tagline: 'Polycystic Ovary Syndrome',
    tags: ['Hormonal', 'Common'],
    summary: 'A hormonal disorder causing irregular periods, excess androgens, and ovarian cysts.',
    body: 'PCOS affects around 1 in 10 women of reproductive age. It is caused by an imbalance of reproductive hormones, which can lead to irregular periods, difficulty conceiving, and symptoms like acne and excess hair growth.\n\nKey symptoms include irregular or absent periods, weight gain, acne, thinning hair, and darkening of skin. Treatment focuses on managing symptoms through lifestyle changes, hormonal birth control, or other medications.\n\nEarly diagnosis is important as PCOS can increase the risk of type 2 diabetes and heart disease if left unmanaged.',
    link: 'abc.com',
  },
  {
    id: '2',
    emoji: '🔴',
    name: 'Endometriosis',
    tagline: 'Tissue grows outside the uterus',
    tags: ['Chronic', 'Pain'],
    summary: 'A condition where tissue similar to the uterine lining grows outside the uterus, causing pain and heavy bleeding.',
    body: 'Endometriosis affects roughly 1 in 9 women. The tissue behaves like the uterine lining — it thickens, breaks down, and bleeds with each menstrual cycle — but has no way to exit the body.\n\nThis causes significant pain, especially during periods, as well as pain during sex, bowel movements, and urination. It can also cause fertility problems.\n\nDiagnosis is often delayed by 7–10 years due to symptoms being dismissed. Treatment includes pain management, hormonal therapy, and surgery.',
    link: 'abc.com',
  },
  {
    id: '3',
    emoji: '💜',
    name: 'Adenomyosis',
    tagline: 'Uterine lining grows into the muscle wall',
    tags: ['Chronic', 'Pain'],
    summary: 'When the uterine lining grows into the muscle wall, causing a heavy, enlarged uterus and painful periods.',
    body: 'Adenomyosis occurs when the endometrial tissue that normally lines the uterus begins to grow into the muscular wall of the uterus, making it enlarged and causing heavy, painful periods.\n\nSymptoms include severe menstrual cramps, heavy or prolonged bleeding, and an enlarged uterus. It is most common in women in their 40s and 50s, and in women who have had children.\n\nTreatment ranges from pain medications to hormonal therapy, and in severe cases, hysterectomy.',
    link: 'abc.com',
  },
  {
    id: '4',
    emoji: '⚡',
    name: 'PMDD',
    tagline: 'Premenstrual Dysphoric Disorder',
    tags: ['Mental Health', 'Hormonal'],
    summary: 'A severe form of PMS causing significant mood disturbances and physical symptoms in the week before menstruation.',
    body: 'PMDD is a much more severe form of premenstrual syndrome (PMS). Symptoms typically appear 1–2 weeks before your period and resolve shortly after it starts.\n\nEmotional symptoms can include extreme mood swings, depression, irritability, and anxiety. Physical symptoms include bloating, breast tenderness, and headaches.\n\nPMDD is thought to be related to hormonal changes and their interaction with brain chemistry. Treatment includes SSRIs, hormonal contraceptives, and lifestyle changes.',
    link: 'abc.com',
  },
  {
    id: '5',
    emoji: '🦋',
    name: 'Thyroid Disorders',
    tagline: 'Hypothyroidism & Hyperthyroidism',
    tags: ['Hormonal', 'Systemic'],
    summary: 'Thyroid dysfunction can significantly impact menstrual cycles, fertility, and overall wellbeing.',
    body: 'The thyroid gland produces hormones that regulate metabolism, and thyroid disorders are far more common in women than men.\n\nHypothyroidism (underactive thyroid) can cause heavy periods, fatigue, weight gain, and cold intolerance. Hyperthyroidism (overactive) can lead to light or absent periods, weight loss, and anxiety.\n\nBoth conditions are manageable with medication, and regular monitoring is essential for women planning to conceive.',
    link: 'abc.com',
  },
  {
    id: '6',
    emoji: '🌡️',
    name: 'Fibroids',
    tagline: 'Uterine Leiomyomas',
    tags: ['Common', 'Benign'],
    summary: 'Non-cancerous growths in or on the uterus that can cause heavy bleeding, pelvic pain, and pressure.',
    body: 'Uterine fibroids are non-cancerous growths that develop in or around the uterus. They are very common — up to 70% of women will develop fibroids by age 50, though many will never know it.\n\nSymptoms depend on size and location but can include heavy menstrual bleeding, pelvic pain or pressure, frequent urination, and back pain. Many fibroids cause no symptoms at all.\n\nTreatment options range from watchful waiting to medication, non-surgical procedures, and surgery.',
    link: 'abc.com',
  },
  {
    id: '7',
    emoji: '🧬',
    name: 'Premature Ovarian Insufficiency',
    tagline: 'Early loss of normal ovarian function',
    tags: ['Hormonal', 'Rare'],
    summary: 'When the ovaries stop functioning normally before age 40, leading to irregular or absent periods.',
    body: 'Premature ovarian insufficiency (POI) affects about 1 in 100 women under 40. The ovaries stop producing normal amounts of estrogen and releasing eggs regularly.\n\nSymptoms mirror those of menopause: irregular or absent periods, hot flushes, night sweats, vaginal dryness, and difficulty conceiving.\n\nThe cause is often unknown, but can be linked to chromosomal abnormalities, autoimmune conditions, or cancer treatments. Hormone replacement therapy is usually recommended to protect bone and heart health.',
    link: 'abc.com',
  },
];

export default function ExploreScreen() {
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = CONDITIONS.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.tagline.toLowerCase().includes(query.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe}>

      {/* Fixed header + search */}
      <View style={styles.top}>
        <Text style={styles.sectionLabel}>SECTION 2</Text>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search conditions…"
            placeholderTextColor="#90A4AE"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cards */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            {filtered.length} condition{filtered.length !== 1 ? 's' : ''}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>No results for "{query}"</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} activeOpacity={0.75}>
            <View style={styles.cardTop}>
              <View style={styles.cardEmojiBubble}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles.cardMeta}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardTagline}>{item.tagline}</Text>
              </View>
            </View>
            <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
            <View style={styles.tagRow}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail modal */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected && (
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeaderBar}>
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalEmoji}>{selected.emoji}</Text>
              <Text style={styles.modalName}>{selected.name}</Text>
              <Text style={styles.modalTagline}>{selected.tagline}</Text>
              <View style={styles.tagRow}>
                {selected.tags.map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.divider} />
              <Text style={styles.modalBody}>{selected.body}</Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.readMoreBtn}
                onPress={() => Linking.openURL(`https://${selected.link}`)}
                activeOpacity={0.8}
              >
                <Text style={styles.readMoreText}>Read more at {selected.link} →</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  // Header + search
  top:          { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#0288D1', letterSpacing: 1.5, marginBottom: 4 },
  title:        { fontSize: 32, fontWeight: '800', color: '#01579B', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0F8FF', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#E1F5FE',
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#01579B' },
  clearBtn:    { fontSize: 14, color: '#90A4AE', paddingLeft: 8 },

  // List
  list:       { paddingHorizontal: 20, paddingBottom: 40 },
  listHeader: { fontSize: 12, color: '#90A4AE', marginBottom: 12, marginTop: 4 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    marginBottom: 12, borderWidth: 1.5, borderColor: '#E1F5FE',
    shadowColor: '#0288D1', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmojiBubble: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#E1F5FE', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardEmoji:   { fontSize: 24 },
  cardMeta:    { flex: 1 },
  cardName:    { fontSize: 16, fontWeight: '700', color: '#01579B' },
  cardTagline: { fontSize: 12, color: '#546E7A', marginTop: 2 },
  cardSummary: { fontSize: 13, color: '#546E7A', lineHeight: 19, marginBottom: 10 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:         { backgroundColor: '#E1F5FE', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  tagText:     { fontSize: 11, color: '#0277BD', fontWeight: '600' },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyText:  { fontSize: 15, color: '#90A4AE' },

  // Modal
  modalSafe:      { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeaderBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, alignItems: 'flex-end' },
  closeBtn:       { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F8FF', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { fontSize: 14, color: '#546E7A', fontWeight: '700' },
  modalScroll:    { paddingHorizontal: 24, paddingBottom: 24 },
  modalEmoji:     { fontSize: 48, marginBottom: 12 },
  modalName:      { fontSize: 28, fontWeight: '800', color: '#01579B', marginBottom: 4 },
  modalTagline:   { fontSize: 15, color: '#546E7A', marginBottom: 12 },
  divider:        { height: 1, backgroundColor: '#E1F5FE', marginVertical: 16 },
  modalBody:      { fontSize: 15, color: '#263238', lineHeight: 25 },

  // Modal footer
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#E1F5FE' },
  readMoreBtn: {
    backgroundColor: '#0288D1', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  readMoreText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
