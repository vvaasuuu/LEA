function dialogue(character, expression, text, extras = {}) {
  return {
    type: 'dialogue',
    speaker: character === 'drlin' ? 'Doctor' : character === 'lea' ? 'Lea' : 'Mara',
    character,
    expression,
    text,
    ...extras,
  };
}

function narration(text, extras = {}) {
  return {
    type: 'narration',
    speaker: null,
    character: null,
    expression: null,
    text,
    ...extras,
  };
}

function consequenceNarration(text) {
  return narration(text, { phase: 'consequence' });
}

function consequenceDialogue(character, expression, text) {
  return dialogue(character, expression, text, { phase: 'consequence' });
}

export const DEFAULT_SCORES = {
  career: 0,
  health: 0,
  relationship: 0,
  fertility: 0,
};

export const SCORE_LABELS = {
  career: 'Career',
  health: 'Health',
  relationship: 'Relationship',
  fertility: 'Fertility',
};

export const SCORE_COLORS = {
  career: '#F28C28',
  health: '#1A936F',
  relationship: '#E85D75',
  fertility: '#3D5A80',
};

export const fertilityWindowScenario = {
  id: 'fertility_window_vs_career_acceleration',
  title: 'The Fertility Window vs Career Acceleration',
  initialEpisodeId: 'E1_baseline',
  summaryEpisodeId: 'SUMMARY',
  episodes: {
    E1_baseline: {
      id: 'E1_baseline',
      age: 22,
      title: 'Something Slightly Off',
      background: 'bg_apartment_morning_age22',
      lines: [
        dialogue('lea', 'worried', "I'm okay."),
        dialogue('lea', 'worried', "I just don't feel fully like myself lately."),
        narration("You're 22. Work is starting to get serious."),
        narration("You've been more tired than usual."),
        narration('Your cycle feels slightly irregular.'),
        narration('Nothing feels dramatic. Just different.'),
        dialogue('drlin', 'warm', "If energy or cycles change, it's worth checking early."),
        dialogue('drlin', 'warm', 'Not because something is wrong.'),
        dialogue('drlin', 'informative', 'Because early information is often easier to use.'),
      ],
      choices: [
        {
          id: 'E1A_ignore',
          label: 'Ignore it for now',
          effect: { career: 4, health: -1, relationship: 1, fertility: -2 },
          consequence: [
            consequenceNarration('You decide it can wait.'),
            consequenceDialogue('lea', 'reflective', "Maybe it's nothing."),
          ],
          nextEpisodeId: 'E2_delay',
        },
        {
          id: 'E1B_thyroid',
          label: 'Do a thyroid panel only',
          effect: { career: 0, health: 3, relationship: 1, fertility: 1 },
          consequence: [
            consequenceNarration("Your thyroid markers are slightly off. It's manageable, but useful to know now."),
            consequenceDialogue('lea', 'relieved', "I'm glad I checked."),
          ],
          nextEpisodeId: 'E2_thyroid_aware',
        },
        {
          id: 'E1C_amh',
          label: 'Do an AMH test and fertility consult only',
          effect: { career: 0, health: 1, relationship: 0, fertility: 5 },
          consequence: [
            consequenceNarration('Dr. Lin explains AMH is a planning tool, not a prediction.'),
            consequenceDialogue('lea', 'relieved', 'This is helpful, not scary.'),
          ],
          nextEpisodeId: 'E2_fertility_aware',
        },
        {
          id: 'E1D_both',
          label: 'Do both thyroid and fertility baseline checks',
          effect: { career: -1, health: 4, relationship: 2, fertility: 6 },
          consequence: [
            consequenceNarration('You get the clearest picture early.'),
            consequenceDialogue('lea', 'determined', "I didn't expect this much clarity at 22."),
          ],
          nextEpisodeId: 'E2_informed',
        },
      ],
    },
    E2_delay: {
      id: 'E2_delay',
      age: 24,
      title: "The Information You Didn't Ask For",
      background: 'bg_clinic_lobby_day',
      lines: [
        dialogue('lea', 'reflective', "We weren't even thinking about this yet."),
        dialogue('drlin', 'warm', "This isn't urgent."),
        dialogue('drlin', 'informative', "It's just useful timing information."),
        narration('At your routine visit, Dr. Lin says your mid-twenties are often a strong time to think about egg freezing.'),
        dialogue('drlin', 'informative', 'If you ever want it, earlier planning gives you more room.'),
        dialogue('drlin', 'informative', 'The process usually means around 10 days of hormone stimulation.'),
        dialogue('drlin', 'informative', 'Then monitoring visits.'),
        dialogue('drlin', 'informative', 'Then retrieval under sedation.'),
        dialogue('lea', 'worried', "I wasn't planning to think about this yet."),
      ],
      choices: [
        {
          id: 'E2DA_ignore',
          label: 'Ignore it for now',
          effect: { career: 4, health: -1, relationship: 1, fertility: -5 },
          consequence: [
            consequenceNarration('You move on and focus on work.'),
            consequenceDialogue('lea', 'reflective', "I'll think about it later."),
          ],
          nextEpisodeId: 'E3_delay',
        },
        {
          id: 'E2DB_research',
          label: 'Research it seriously',
          effect: { career: 0, health: 2, relationship: 0, fertility: 5 },
          consequence: [
            consequenceNarration('You learn about costs, timing, and success rates.'),
            consequenceDialogue('lea', 'determined', 'This feels time-sensitive, not panic-driven.'),
          ],
          nextEpisodeId: 'E3_informed',
        },
        {
          id: 'E2DC_support',
          label: 'Ask Mara about company support',
          effect: { career: 5, health: 0, relationship: -1, fertility: 3 },
          consequence: [
            consequenceNarration('Mara says some fertility support may be coming.'),
            consequenceDialogue('mara', 'persuasive', 'Company policy can change the timing.'),
          ],
          nextEpisodeId: 'E3_company',
        },
      ],
    },
    E2_thyroid_aware: {
      id: 'E2_thyroid_aware',
      age: 24,
      title: "The Information You Didn't Ask For",
      background: 'bg_clinic_consult_room',
      lines: [
        dialogue('lea', 'reflective', 'I already knew my body needed a little attention.'),
        dialogue('lea', 'worried', "I didn't expect fertility to join the conversation."),
        dialogue('drlin', 'informative', 'Managing thyroid early makes later choices calmer.'),
        dialogue('drlin', 'warm', "It doesn't decide anything for you."),
        dialogue('drlin', 'warm', 'It just removes one unknown.'),
        narration('Because you already checked your thyroid, this conversation feels clearer.'),
      ],
      choices: [
        {
          id: 'E2TA_delay',
          label: 'Delay the fertility conversation',
          effect: { career: 4, health: 1, relationship: 0, fertility: -4 },
          consequence: [
            consequenceNarration('You focus on work and keep monitoring your thyroid.'),
            consequenceDialogue('lea', 'reflective', 'Not now. But not never.'),
          ],
          nextEpisodeId: 'E3_delay',
        },
        {
          id: 'E2TB_learn',
          label: 'Learn properly before deciding',
          effect: { career: 0, health: 2, relationship: 0, fertility: 5 },
          consequence: [
            consequenceNarration('You ask better questions and get clearer answers.'),
            consequenceDialogue('lea', 'relieved', 'This feels easier with context.'),
          ],
          nextEpisodeId: 'E3_informed',
        },
        {
          id: 'E2TC_support',
          label: 'Ask how company support could change things',
          effect: { career: 4, health: 0, relationship: 0, fertility: 4 },
          consequence: [
            consequenceNarration('You realize work structure matters too.'),
            consequenceDialogue('mara', 'persuasive', 'If this matters, support matters too.'),
          ],
          nextEpisodeId: 'E3_company',
        },
      ],
    },
    E2_fertility_aware: {
      id: 'E2_fertility_aware',
      age: 24,
      title: "The Information You Didn't Ask For",
      background: 'bg_clinic_lobby_day',
      lines: [
        dialogue('lea', 'reflective', 'I thought AMH would give me an answer.'),
        dialogue('lea', 'reflective', 'It gave me context.'),
        dialogue('drlin', 'warm', "That's what it's for."),
        dialogue('drlin', 'informative', 'AMH helps with planning.'),
        dialogue('drlin', 'informative', "It doesn't predict your whole future."),
        narration('Because you already had an AMH test, the topic feels less abstract.'),
      ],
      choices: [
        {
          id: 'E2FA_work',
          label: 'Put it aside and focus on work',
          effect: { career: 5, health: -1, relationship: 0, fertility: -4 },
          consequence: [
            consequenceNarration("You choose not to build your life around it yet."),
            consequenceDialogue('lea', 'reflective', "I have the information. I'm just not acting on it."),
          ],
          nextEpisodeId: 'E3_delay',
        },
        {
          id: 'E2FB_serious',
          label: 'Take fertility planning seriously now',
          effect: { career: 0, health: 1, relationship: 0, fertility: 6 },
          consequence: [
            consequenceNarration('You start thinking in years, not someday.'),
            consequenceDialogue('lea', 'determined', 'It feels real now.'),
          ],
          nextEpisodeId: 'E3_informed',
        },
        {
          id: 'E2FC_policy',
          label: 'Explore employer policy',
          effect: { career: 4, health: 0, relationship: -1, fertility: 4 },
          consequence: [
            consequenceNarration('You see that workplace support changes feasibility.'),
            consequenceDialogue('mara', 'serious', 'This is also a policy question.'),
          ],
          nextEpisodeId: 'E3_company',
        },
      ],
    },
    E2_informed: {
      id: 'E2_informed',
      age: 24,
      title: "The Information You Didn't Ask For",
      background: 'bg_clinic_consult_room',
      lines: [
        dialogue('lea', 'relieved', "I'm glad I know more early."),
        dialogue('drlin', 'warm', 'That gives you a longer runway.'),
        narration('Because you already checked both thyroid and AMH, this conversation feels grounded.'),
        dialogue('drlin', 'informative', 'Egg freezing is one option.'),
        dialogue('drlin', 'warm', 'Not a requirement.'),
        dialogue('drlin', 'informative', 'Just one path that stays easier when considered earlier.'),
      ],
      choices: [
        {
          id: 'E2IA_later',
          label: 'Leave it for later',
          effect: { career: 4, health: 1, relationship: 0, fertility: -3 },
          consequence: [
            consequenceNarration('You choose informed delay.'),
            consequenceDialogue('lea', 'reflective', 'Knowing helps, even if I wait.'),
          ],
          nextEpisodeId: 'E3_delay',
        },
        {
          id: 'E2IB_plan',
          label: 'Keep learning and plan deliberately',
          effect: { career: 0, health: 2, relationship: 1, fertility: 6 },
          consequence: [
            consequenceNarration('You treat this like long-range planning.'),
            consequenceDialogue('lea', 'determined', 'I want a framework, not a rushed answer.'),
          ],
          nextEpisodeId: 'E3_informed',
        },
        {
          id: 'E2IC_support',
          label: 'Investigate company support',
          effect: { career: 4, health: 0, relationship: 0, fertility: 5 },
          consequence: [
            consequenceNarration('You start asking structural questions early.'),
            consequenceDialogue('mara', 'persuasive', "It's smart to ask now."),
          ],
          nextEpisodeId: 'E3_company',
        },
      ],
    },
    E3_delay: {
      id: 'E3_delay',
      age: 26,
      title: 'The Quiet Delay',
      background: 'bg_office_evening_city',
      lines: [
        dialogue('lea', 'reflective', "We didn't decide against it."),
        dialogue('lea', 'reflective', 'We just kept delaying it.'),
        dialogue('mara', 'persuasive', 'The next two years could really move your career.'),
        narration('Your work is accelerating.'),
        narration('Fertility stays in the background.'),
        narration('But it never fully leaves.'),
      ],
      choices: [
        {
          id: 'E3DA_momentum',
          label: 'Keep delaying and ride the momentum',
          effect: { career: 10, health: -2, relationship: -1, fertility: -8 },
          consequence: [
            consequenceNarration('Work stays front and center.'),
            consequenceDialogue('lea', 'determined', "We're gaining speed."),
          ],
          nextEpisodeId: 'E4_delay',
        },
        {
          id: 'E3DB_labs',
          label: 'Book updated labs and a consult now',
          effect: { career: -2, health: 4, relationship: 1, fertility: 6 },
          consequence: [
            consequenceNarration('You finally get current information.'),
            consequenceDialogue('drlin', 'informative', 'Clarity makes the next choice easier.'),
          ],
          nextEpisodeId: 'E4_informed',
        },
        {
          id: 'E3DC_employer',
          label: 'Ask if a different employer would make this easier',
          effect: { career: 5, health: 0, relationship: -1, fertility: 5 },
          consequence: [
            consequenceNarration('You start seeing policy as part of the decision.'),
            consequenceDialogue('mara', 'serious', 'Different companies make different choices easier.'),
          ],
          nextEpisodeId: 'E4_company',
        },
      ],
    },
    E3_informed: {
      id: 'E3_informed',
      age: 26,
      title: 'The Informed Choice',
      background: 'bg_clinic_consult_room',
      lines: [
        dialogue('lea', 'determined', "We're not rushing."),
        dialogue('lea', 'determined', "We're just not avoiding it."),
        dialogue('drlin', 'warm', "That's usually the best place to decide from."),
        narration('You understand the basics now.'),
        narration('Egg freezing takes planning.'),
        narration('AMH is context.'),
        narration('Thyroid management helps if it applies to you.'),
      ],
      choices: [
        {
          id: 'E3IA_prepare',
          label: 'Prepare to freeze within the next year or two',
          effect: { career: -1, health: 1, relationship: 1, fertility: 8 },
          consequence: [
            consequenceNarration('You turn an idea into a plan.'),
            consequenceDialogue('lea', 'determined', 'This feels real now.'),
          ],
          nextEpisodeId: 'E4_informed',
        },
        {
          id: 'E3IB_wait',
          label: 'Wait strategically and revisit at 28',
          effect: { career: 6, health: -1, relationship: 0, fertility: -4 },
          consequence: [
            consequenceNarration('You choose intentional delay.'),
            consequenceDialogue('lea', 'reflective', "We're sequencing it."),
          ],
          nextEpisodeId: 'E4_delay',
        },
        {
          id: 'E3IC_jobs',
          label: 'Explore jobs with fertility support',
          effect: { career: 8, health: 0, relationship: -1, fertility: 7 },
          consequence: [
            consequenceNarration('You use work structure as leverage.'),
            consequenceDialogue('mara', 'persuasive', 'Support changes what feels possible.'),
          ],
          nextEpisodeId: 'E4_company',
        },
      ],
    },
    E3_company: {
      id: 'E3_company',
      age: 26,
      title: 'The Company Effect',
      background: 'bg_office_meeting_room',
      lines: [
        dialogue('lea', 'reflective', "I didn't expect work policy to matter this much."),
        dialogue('mara', 'serious', 'It matters more than people think.'),
        narration('You learn some companies offer better coverage, flexibility, or leave.'),
        narration('The question is no longer only personal.'),
        narration("It's structural too."),
      ],
      choices: [
        {
          id: 'E3CA_stay',
          label: 'Stay and prioritize career acceleration',
          effect: { career: 10, health: -1, relationship: -1, fertility: -5 },
          consequence: [
            consequenceNarration('You keep momentum high.'),
            consequenceDialogue('lea', 'determined', 'This keeps the career path clean.'),
          ],
          nextEpisodeId: 'E4_delay',
        },
        {
          id: 'E3CB_move',
          label: 'Move toward a fertility-supportive company',
          effect: { career: 7, health: 0, relationship: -1, fertility: 10 },
          consequence: [
            consequenceNarration('You choose more support and more flexibility.'),
            consequenceDialogue('lea', 'relieved', 'That move bought me room.'),
          ],
          nextEpisodeId: 'E4_company',
        },
        {
          id: 'E3CC_negotiate',
          label: 'Negotiate support directly',
          effect: { career: 5, health: 1, relationship: 0, fertility: 8 },
          consequence: [
            consequenceNarration('Even partial support changes the calculation.'),
            consequenceDialogue('mara', 'persuasive', "It's worth asking clearly."),
          ],
          nextEpisodeId: 'E4_informed',
        },
      ],
    },
    E4_delay: {
      id: 'E4_delay',
      age: 28,
      title: 'The Window Becomes Concrete',
      background: 'bg_office_rainy_window_age28',
      lines: [
        dialogue('lea', 'worried', 'This is the first time it feels concrete.'),
        dialogue('drlin', 'warm', 'You still have options.'),
        dialogue('drlin', 'informative', 'Timing just matters more now.'),
        narration('At 28, the choice feels more immediate.'),
        narration('Career is fuller.'),
        narration('Time feels more expensive.'),
      ],
      choices: [
        {
          id: 'E4DA_freeze',
          label: 'Freeze eggs now',
          effect: { career: -3, health: -2, relationship: 1, fertility: 20 },
          consequence: [
            consequenceNarration('You commit to the process and feel real relief afterward.'),
            consequenceDialogue('lea', 'relieved', "That was a lot, but I'm glad I did it."),
          ],
          nextEpisodeId: 'E5_frozen',
        },
        {
          id: 'E4DB_wait',
          label: 'Wait 1-2 more years strategically',
          effect: { career: 8, health: -1, relationship: 0, fertility: -8 },
          consequence: [
            consequenceNarration('You choose a calculated delay.'),
            consequenceDialogue('lea', 'reflective', 'Waiting is still a choice.'),
          ],
          nextEpisodeId: 'E5_waiting',
        },
        {
          id: 'E4DC_change',
          label: 'Change roles or negotiate benefits first',
          effect: { career: 7, health: 1, relationship: -1, fertility: 9 },
          consequence: [
            consequenceNarration('You decide structure needs to improve before the next step.'),
            consequenceDialogue('mara', 'serious', "That's a valid reason to make a work change."),
          ],
          nextEpisodeId: 'E5_policy',
        },
      ],
    },
    E4_informed: {
      id: 'E4_informed',
      age: 28,
      title: 'The Planned Decision',
      background: 'bg_clinic_consult_room',
      lines: [
        dialogue('lea', 'determined', 'We knew this point was coming.'),
        dialogue('drlin', 'warm', "You're deciding from context, not surprise."),
        narration('At 28, you have enough information to choose deliberately.'),
        narration('Thyroid and AMH are part of the picture.'),
        narration('Neither is driving panic.'),
      ],
      choices: [
        {
          id: 'E4IA_freeze',
          label: 'Freeze eggs now',
          effect: { career: -2, health: -2, relationship: 1, fertility: 20 },
          consequence: [
            consequenceNarration('You move ahead because the timing makes sense for you.'),
            consequenceDialogue('lea', 'relieved', 'This feels aligned.'),
          ],
          nextEpisodeId: 'E5_frozen',
        },
        {
          id: 'E4IB_wait',
          label: 'Wait and reassess at 31',
          effect: { career: 7, health: 0, relationship: 0, fertility: -7 },
          consequence: [
            consequenceNarration('You take a measured risk.'),
            consequenceDialogue('lea', 'reflective', 'If I wait, I want it to be deliberate.'),
          ],
          nextEpisodeId: 'E5_waiting',
        },
        {
          id: 'E4IC_setup',
          label: 'Use role or policy changes to create a better setup',
          effect: { career: 8, health: 1, relationship: 0, fertility: 8 },
          consequence: [
            consequenceNarration('You improve the conditions before acting.'),
            consequenceDialogue('mara', 'persuasive', 'A better setup changes the whole experience.'),
          ],
          nextEpisodeId: 'E5_policy',
        },
      ],
    },
    E4_company: {
      id: 'E4_company',
      age: 28,
      title: 'The Policy Decision',
      background: 'bg_office_meeting_room',
      lines: [
        dialogue('lea', 'reflective', "This wasn't only about biology."),
        dialogue('lea', 'reflective', 'It was also about whether my life could make room for it.'),
        dialogue('mara', 'persuasive', 'Support changes action.'),
        narration('At 28, policy, leave, coverage, and flexibility are central.'),
      ],
      choices: [
        {
          id: 'E4CA_use_support',
          label: 'Use the support and freeze eggs now',
          effect: { career: -1, health: -2, relationship: 1, fertility: 20 },
          consequence: [
            consequenceNarration('The process feels more manageable because the structure around you is better.'),
            consequenceDialogue('lea', 'relieved', 'This still felt big. Just not chaotic.'),
          ],
          nextEpisodeId: 'E5_frozen',
        },
        {
          id: 'E4CB_wait',
          label: 'Keep the supportive role, but wait longer',
          effect: { career: 7, health: 0, relationship: 0, fertility: -6 },
          consequence: [
            consequenceNarration('You keep the support in place without acting yet.'),
            consequenceDialogue('lea', 'reflective', 'Support helps, even before I use it.'),
          ],
          nextEpisodeId: 'E5_waiting',
        },
        {
          id: 'E4CC_optimize',
          label: 'Improve flexibility even more before deciding',
          effect: { career: 6, health: 2, relationship: 0, fertility: 8 },
          consequence: [
            consequenceNarration('You optimize the conditions first.'),
            consequenceDialogue('mara', 'serious', 'Sometimes the setup is the real barrier.'),
          ],
          nextEpisodeId: 'E5_policy',
        },
      ],
    },
    E5_frozen: {
      id: 'E5_frozen',
      age: 31,
      title: 'The Relief',
      background: 'bg_apartment_evening_age31',
      lines: [
        dialogue('lea', 'relieved', "I didn't expect relief to be the strongest feeling."),
        dialogue('drlin', 'warm', "That's common."),
        narration("At 31, you've already frozen your eggs."),
        narration("It didn't create certainty."),
        narration('It did create space.'),
      ],
      choices: [
        {
          id: 'E5FA_career',
          label: 'Focus fully on career now',
          effect: { career: 10, health: 0, relationship: -1, fertility: 3 },
          consequence: [
            consequenceNarration('You throw yourself into work with less background pressure.'),
            consequenceDialogue('lea', 'determined', 'This gave me room.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
        {
          id: 'E5FB_balanced',
          label: 'Keep career moving, but stay balanced',
          effect: { career: 6, health: 3, relationship: 2, fertility: 2 },
          consequence: [
            consequenceNarration('You use the relief to live more deliberately.'),
            consequenceDialogue('lea', 'reflective', 'I want to use this space well.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
        {
          id: 'E5FC_reassess',
          label: 'Reassess what kind of life you want',
          effect: { career: 2, health: 2, relationship: 4, fertility: 1 },
          consequence: [
            consequenceNarration('The reduced pressure changes how you think about the future.'),
            consequenceDialogue('lea', 'reflective', 'I can hear myself more clearly now.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
      ],
    },
    E5_waiting: {
      id: 'E5_waiting',
      age: 31,
      title: 'The Updated Picture',
      background: 'bg_clinic_consult_room',
      lines: [
        dialogue('lea', 'reflective', "I'm glad we checked instead of guessing."),
        dialogue('drlin', 'warm', 'You still have choices.'),
        dialogue('drlin', 'thoughtful', "They're just more specific now."),
        narration('At 31, updated labs make the picture clearer.'),
        narration('The conversation is still open.'),
        narration('Just less roomy than before.'),
      ],
      choices: [
        {
          id: 'E5WA_freeze',
          label: 'Freeze eggs now',
          effect: { career: -2, health: -2, relationship: 1, fertility: 16 },
          consequence: [
            consequenceNarration('You act now, with clearer eyes than before.'),
            consequenceDialogue('lea', 'determined', "It may not be ideal timing, but it's still meaningful."),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
        {
          id: 'E5WB_wait',
          label: 'Keep waiting',
          effect: { career: 8, health: -1, relationship: -1, fertility: -10 },
          consequence: [
            consequenceNarration('You accept a narrower planning window.'),
            consequenceDialogue('lea', 'reflective', 'This is still a valid choice. Just a tighter one.'),
          ],
          nextEpisodeId: 'E6_window_narrower',
        },
        {
          id: 'E5WC_change_jobs',
          label: 'Change jobs or reduce pace first',
          effect: { career: 4, health: 2, relationship: 1, fertility: 6 },
          consequence: [
            consequenceNarration('You decide the structure around you needs to change first.'),
            consequenceDialogue('mara', 'serious', 'Sometimes the week changes before the decision can.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
      ],
    },
    E5_policy: {
      id: 'E5_policy',
      age: 31,
      title: 'The Structural Advantage',
      background: 'bg_apartment_evening_age31',
      lines: [
        dialogue('lea', 'reflective', 'Support changed more than the budget.'),
        dialogue('lea', 'reflective', 'It changed how possible this felt.'),
        dialogue('mara', 'persuasive', "That's exactly why policy matters."),
        narration('At 31, better support or flexibility has made planning easier to approach.'),
      ],
      choices: [
        {
          id: 'E5PA_use_support',
          label: 'Use the support and freeze eggs now',
          effect: { career: -1, health: -2, relationship: 1, fertility: 18 },
          consequence: [
            consequenceNarration('The friction is lower, so acting feels more practical.'),
            consequenceDialogue('lea', 'relieved', 'This feels manageable now.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
        {
          id: 'E5PB_wait',
          label: 'Keep the role and wait',
          effect: { career: 8, health: -1, relationship: 0, fertility: -7 },
          consequence: [
            consequenceNarration('You rely on the supportive setup while delaying again.'),
            consequenceDialogue('lea', 'reflective', 'Waiting feels different when the structure is better.'),
          ],
          nextEpisodeId: 'E6_window_narrower',
        },
        {
          id: 'E5PC_rebalance',
          label: 'Use the flexibility to rebalance first',
          effect: { career: 5, health: 3, relationship: 2, fertility: 5 },
          consequence: [
            consequenceNarration('You use the breathing room to get everything else steadier first.'),
            consequenceDialogue('drlin', 'warm', 'That often makes the next step easier.'),
          ],
          nextEpisodeId: 'E6_options_protected',
        },
      ],
    },
    E6_options_protected: {
      id: 'E6_options_protected',
      age: 35,
      title: 'More Room Than Before',
      background: 'bg_terrace_quiet_age35',
      lines: [
        dialogue('lea', 'relieved', "I'm glad I stayed engaged with the question."),
        dialogue('drlin', 'warm', 'You still have room to choose.'),
        narration('At 35, your path has left you with relatively protected options.'),
        narration('The key feeling is not certainty.'),
        narration("It's room."),
      ],
      choices: [
        {
          id: 'E6OA_career',
          label: 'Prioritise career and let the options sit in the background',
          effect: { career: 9, health: 0, relationship: -1, fertility: 2 },
          consequence: [
            consequenceNarration('You keep building with less pressure.'),
            consequenceDialogue('lea', 'determined', 'I created options so I could use the space.'),
          ],
          nextEpisodeId: 'E7_options_protected',
        },
        {
          id: 'E6OB_family',
          label: 'Start actively planning for family',
          effect: { career: 2, health: 2, relationship: 4, fertility: 4 },
          consequence: [
            consequenceNarration('The question becomes more personal than theoretical.'),
            consequenceDialogue('lea', 'reflective', "I'm choosing now, not reacting."),
          ],
          nextEpisodeId: 'E7_options_protected',
        },
        {
          id: 'E6OC_balance',
          label: 'Keep balancing both',
          effect: { career: 5, health: 1, relationship: 2, fertility: 2 },
          consequence: [
            consequenceNarration('You accept a mixed but workable season.'),
            consequenceDialogue('lea', 'reflective', "This isn't neat, but it works."),
          ],
          nextEpisodeId: 'E7_options_protected',
        },
      ],
    },
    E6_window_narrower: {
      id: 'E6_window_narrower',
      age: 35,
      title: 'A More Specific Conversation',
      background: 'bg_terrace_quiet_age35',
      lines: [
        dialogue('lea', 'reflective', "This doesn't feel like panic."),
        dialogue('lea', 'reflective', 'It just feels more specific now.'),
        dialogue('drlin', 'warm', 'You still have options.'),
        dialogue('drlin', 'thoughtful', 'They just need more planning.'),
        narration('At 35, the conversation is narrower than before.'),
        narration('Not closed.'),
        narration('Just less casual.'),
      ],
      choices: [
        {
          id: 'E6WA_act',
          label: 'Act now to preserve options',
          effect: { career: -2, health: -1, relationship: 1, fertility: 12 },
          consequence: [
            consequenceNarration('You move with intention.'),
            consequenceDialogue('lea', 'determined', 'It still matters.'),
          ],
          nextEpisodeId: 'E7_window_narrower',
        },
        {
          id: 'E6WB_career',
          label: 'Keep prioritising career',
          effect: { career: 8, health: -1, relationship: -1, fertility: -8 },
          consequence: [
            consequenceNarration('You choose work and accept the tighter path.'),
            consequenceDialogue('lea', 'reflective', 'I can be honest that work came first here.'),
          ],
          nextEpisodeId: 'E7_window_narrower',
        },
        {
          id: 'E6WC_structure',
          label: 'Change work structure, then revisit quickly',
          effect: { career: 3, health: 2, relationship: 1, fertility: 4 },
          consequence: [
            consequenceNarration('You make your life more compatible with the next choice.'),
            consequenceDialogue('mara', 'persuasive', 'A different work shape can change everything.'),
          ],
          nextEpisodeId: 'E7_window_narrower',
        },
      ],
    },
    E7_options_protected: {
      id: 'E7_options_protected',
      age: 38,
      title: 'Looking Back with Context',
      background: 'bg_rooftop_sunset_age38',
      lines: [
        dialogue('lea', 'reflective', 'This was never about finding the perfect choice.'),
        narration('At 38, you look back on a path where your options stayed relatively protected.'),
        narration('Not certain.'),
        narration('Just better supported.'),
      ],
      choices: [
        {
          id: 'E7OA_career',
          label: 'I prioritised my career, and that gave me a lot',
          effect: { career: 3, health: 0, relationship: 0, fertility: 0 },
          consequence: [
            consequenceNarration('You honour the ambition in your path.'),
            consequenceDialogue('lea', 'determined', 'I built something meaningful.'),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7OB_options',
          label: 'I protected my options, and that matters to me',
          effect: { career: 0, health: 1, relationship: 2, fertility: 3 },
          consequence: [
            consequenceNarration('You value the relief that planning created.'),
            consequenceDialogue('lea', 'relieved', "I'm glad I used information well."),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7OC_balance',
          label: 'I tried to balance both, imperfectly',
          effect: { career: 1, health: 1, relationship: 1, fertility: 1 },
          consequence: [
            consequenceNarration('You accept a realistic, mixed path.'),
            consequenceDialogue('lea', 'reflective', "It wasn't perfect. It was thoughtful."),
          ],
          nextEpisodeId: 'SUMMARY',
        },
      ],
    },
    E7_window_narrower: {
      id: 'E7_window_narrower',
      age: 38,
      title: 'Looking Back with Context',
      background: 'bg_rooftop_sunset_age38',
      lines: [
        dialogue('lea', 'reflective', "I don't think I made the wrong choices."),
        dialogue('lea', 'reflective', 'I think I made real ones.'),
        narration('At 38, you look back on a path where the window became narrower over time.'),
        narration('The story is still yours.'),
        narration('It just required more tradeoffs later.'),
      ],
      choices: [
        {
          id: 'E7WA_career',
          label: 'I prioritised my career, and that gave me a lot',
          effect: { career: 3, health: 0, relationship: 0, fertility: -1 },
          consequence: [
            consequenceNarration('You claim the value of what work gave you.'),
            consequenceDialogue('lea', 'determined', 'I chose momentum when it mattered.'),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7WB_options',
          label: 'I protected my options when I could, and that mattered',
          effect: { career: 0, health: 1, relationship: 1, fertility: 2 },
          consequence: [
            consequenceNarration('You honour the moments you moved from avoidance to awareness.'),
            consequenceDialogue('lea', 'reflective', "I didn't leave it entirely to chance."),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7WC_balance',
          label: 'I tried to balance both, imperfectly',
          effect: { career: 1, health: 1, relationship: 2, fertility: 0 },
          consequence: [
            consequenceNarration('You let the story stay mixed.'),
            consequenceDialogue('lea', 'reflective', 'I was living a real life, not an optimized one.'),
          ],
          nextEpisodeId: 'SUMMARY',
        },
      ],
    },
  },
};

export function applyScoreEffect(scores, effect) {
  return Object.keys(scores).reduce((nextScores, key) => {
    nextScores[key] = (scores[key] || 0) + (effect[key] || 0);
    return nextScores;
  }, {});
}
