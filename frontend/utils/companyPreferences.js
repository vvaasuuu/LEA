export const TAG_LABELS = {
  extended_maternity: 'Maternity Leave',
  fertility_coverage: 'Fertility Support',
  menstrual_leave: 'Menstrual Leave',
  flexible_remote_work: 'Flexible Work',
  women_leadership: 'Leadership',
  mental_health: 'Mental Health',
  menopause_support: 'Menopause',
  childcare_support: 'Childcare',
  wellness: 'Wellness',
};

export const BENEFIT_FILTERS = [
  { key: 'fertility_coverage', label: 'Fertility Support' },
  { key: 'menstrual_leave', label: 'Menstrual Leave' },
  { key: 'flexible_remote_work', label: 'Flexible Work' },
  { key: 'mental_health', label: 'Mental Health Support' },
  { key: 'women_leadership', label: 'Leadership Programmes' },
  { key: 'extended_maternity', label: 'Maternity Leave' },
  { key: 'wellness', label: 'Wellness Subsidy' },
];

export const CAREER_STAGES = [
  { key: 'student', label: 'Student / Fresh Graduate' },
  { key: 'early', label: 'Early Career (1-3 years)' },
  { key: 'mid', label: 'Mid Career (3-7 years)' },
];

export const DEFAULT_COMPANY_PREFERENCES = {
  region: 'Singapore',
  activeFilters: [],
  careerStage: '',
};

const CAREER_STAGE_SIGNALS = {
  student: {
    tags: ['women_leadership', 'mental_health', 'wellness', 'flexible_remote_work'],
    keywords: ['graduate', 'upskill', 'network', 'women in tech', 'development'],
  },
  early: {
    tags: ['flexible_remote_work', 'mental_health', 'women_leadership', 'wellness'],
    keywords: ['growth', 'hybrid', 'leadership', 'development', 'flexible'],
  },
  mid: {
    tags: ['fertility_coverage', 'extended_maternity', 'childcare_support', 'menopause_support', 'women_leadership'],
    keywords: ['fertility', 'parental', 'childcare', 'menopause', 'family'],
  },
};

export function normalizeCompanyPreferences(value) {
  return {
    region: value?.region === 'Global' ? 'Global' : DEFAULT_COMPANY_PREFERENCES.region,
    activeFilters: Array.isArray(value?.activeFilters) ? value.activeFilters : [],
    careerStage: typeof value?.careerStage === 'string' ? value.careerStage : '',
  };
}

function matchesSearch(company, searchQuery) {
  if (!searchQuery.trim()) return true;

  const q = searchQuery.trim().toLowerCase();
  const searchableText = [
    company.name,
    company.highlight,
    company.notable,
    ...(company.tags || []).map((tag) => TAG_LABELS[tag] || tag),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(q);
}

function matchesPreferences(company, preferences) {
  const prefs = normalizeCompanyPreferences(preferences);
  const regionMatch = prefs.region === 'Global' ? true : company.region?.includes('Singapore');
  if (!regionMatch) return false;

  if (prefs.activeFilters.length > 0) {
    const matchesAllSelectedBenefits = prefs.activeFilters.every((filterKey) => company.benefits?.[filterKey]);
    if (!matchesAllSelectedBenefits) return false;
  }

  return true;
}

function getPreferenceScore(company, preferences) {
  const prefs = normalizeCompanyPreferences(preferences);
  let score = 0;

  prefs.activeFilters.forEach((filterKey) => {
    if (company.benefits?.[filterKey]) {
      score += 5;
    }
  });

  if (!prefs.careerStage) {
    return score;
  }

  const stageSignals = CAREER_STAGE_SIGNALS[prefs.careerStage];
  if (!stageSignals) {
    return score;
  }

  stageSignals.tags.forEach((tag) => {
    if (company.tags?.includes(tag)) {
      score += 2;
    }
  });

  const descriptiveText = `${company.highlight || ''} ${company.notable || ''}`.toLowerCase();
  stageSignals.keywords.forEach((keyword) => {
    if (descriptiveText.includes(keyword)) {
      score += 1;
    }
  });

  return score;
}

export function filterCompanies(companies, preferences, searchQuery = '') {
  const prefs = normalizeCompanyPreferences(preferences);

  return [...companies]
    .filter((company) => matchesPreferences(company, prefs) && matchesSearch(company, searchQuery))
    .sort((a, b) => {
      const scoreDifference = getPreferenceScore(b, prefs) - getPreferenceScore(a, prefs);
      if (scoreDifference !== 0) {
        return scoreDifference;
      }
      return a.name.localeCompare(b.name);
    });
}

export function getCompanyPreferenceCount(preferences) {
  const prefs = normalizeCompanyPreferences(preferences);
  let count = 0;

  if (prefs.region !== DEFAULT_COMPANY_PREFERENCES.region) {
    count += 1;
  }
  count += prefs.activeFilters.length;
  if (prefs.careerStage) {
    count += 1;
  }

  return count;
}
