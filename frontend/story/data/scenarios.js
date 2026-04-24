import {
  DEFAULT_SCORES,
  fertilityWindowScenario,
  SCORE_COLORS as fertilityScoreColors,
  SCORE_LABELS as fertilityScoreLabels,
} from './fertilityWindowScenario';
import { moneyHabitsScenario } from './moneyHabitsScenario';

fertilityWindowScenario.selectorTitle = 'The Fertility Window\nvs Career Acceleration';
fertilityWindowScenario.initialScores = DEFAULT_SCORES;
fertilityWindowScenario.fixedStartScores = {
  career: 6,
  health: 4,
  relationship: 4,
  fertility: 7,
};
fertilityWindowScenario.scoreLabels = fertilityScoreLabels;
fertilityWindowScenario.scoreColors = fertilityScoreColors;
fertilityWindowScenario.getEndingText = function getEndingText(scores) {
  if (scores.fertility >= 30 && scores.career >= 25) {
    return 'You built a path with strong momentum and preserved room to choose later.';
  }
  if (scores.fertility >= 30) {
    return 'You repeatedly chose clarity and option-preserving moves, even when they cost momentum.';
  }
  if (scores.career >= 30) {
    return 'Your story leaned hard into acceleration, and the later tradeoffs became more concrete.';
  }
  return 'Your story stayed mixed and human: part planning, part timing, part tradeoff.';
};

export const STORY_SCENARIOS = [
  fertilityWindowScenario,
  moneyHabitsScenario,
];

export const STORY_SCENARIO_MAP = STORY_SCENARIOS.reduce((map, scenario) => {
  map[scenario.id] = scenario;
  return map;
}, {});
