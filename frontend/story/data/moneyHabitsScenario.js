function dialogue(speaker, character, expression, text, extras = {}) {
  return {
    type: 'dialogue',
    speaker,
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

function consequenceDialogue(speaker, character, expression, text) {
  return dialogue(speaker, character, expression, text, { phase: 'consequence' });
}

export const moneyHabitsScenario = {
  id: 'money_habits_and_tradeoffs',
  title: 'Money, Freedom, and Tradeoffs',
  selectorTitle: 'Money, Freedom,\nand Tradeoffs',
  initialEpisodeId: 'E1_money_start',
  summaryEpisodeId: 'SUMMARY',
  initialScores: {
    career: 0,
    health: 0,
    relationship: 0,
    wealth: 0,
    identity: 0,
  },
  scoreLabels: {
    career: 'Career',
    health: 'Health',
    relationship: 'Relationship',
    wealth: 'Wealth',
    identity: 'Identity',
  },
  scoreColors: {
    career: '#9C6644',
    health: '#2A9D8F',
    relationship: '#D1495B',
    wealth: '#D4A017',
    identity: '#6C5CE7',
  },
  getEndingText(scores) {
    if (scores.wealth >= 28 && scores.identity >= 8) {
      return 'You turned money into agency, then decided what kind of life that agency was for.';
    }
    if (scores.wealth >= 28) {
      return 'Your path built real financial control, even when it asked for restraint along the way.';
    }
    if (scores.relationship >= 20 && scores.health >= 12) {
      return 'You treated money as part of a life, not the whole point of it, and your relationships show it.';
    }
    return 'Your story stayed mixed: part security, part living, part learning what enough means.';
  },
  episodes: {
    E1_money_start: {
      id: 'E1_money_start',
      age: 22,
      title: 'Your First Real Salary',
      lines: [
        dialogue('Lea', 'lea', 'relieved', 'I finally have my own money.'),
        dialogue('Mum', 'mum', 'firm', 'Save first. Life is unpredictable.'),
        narration("You just started working. For the first time, you're earning consistently."),
        narration("Your parents suggest saving aggressively early. Your friends are already planning trips, shopping, and enjoying life."),
        narration("You're not sure what balance to strike."),
      ],
      choices: [
        {
          id: 'E1A_save',
          label: 'Save aggressively from the start',
          effect: { career: 2, health: 0, relationship: 1, wealth: 6, identity: 0 },
          consequence: [
            consequenceNarration('You build discipline early, but hold back on spending.'),
            consequenceDialogue('Lea', 'lea', 'determined', "I'll thank myself later."),
          ],
          nextEpisodeId: 'E2_saver',
        },
        {
          id: 'E1B_spend',
          label: 'Spend and enjoy your early twenties',
          effect: { career: 2, health: 2, relationship: 4, wealth: -3, identity: 0 },
          consequence: [
            consequenceNarration('You prioritize experiences and social life.'),
            consequenceDialogue('Lea', 'lea', 'relieved', "I don't want to miss this phase."),
          ],
          nextEpisodeId: 'E2_spender',
        },
        {
          id: 'E1C_balance',
          label: 'Try to balance saving and spending',
          effect: { career: 2, health: 1, relationship: 2, wealth: 2, identity: 0 },
          consequence: [
            consequenceNarration("You set loose boundaries, but it's not very structured."),
            consequenceDialogue('Lea', 'lea', 'reflective', "I'll figure it out as I go."),
          ],
          nextEpisodeId: 'E2_balanced',
        },
        {
          id: 'E1D_family',
          label: 'Give a portion of your income to family',
          effect: { career: 1, health: 0, relationship: 5, wealth: 1, identity: 0 },
          consequence: [
            consequenceNarration('You take on responsibility early.'),
            consequenceDialogue('Lea', 'lea', 'reflective', "It feels right, even if it's harder."),
          ],
          nextEpisodeId: 'E2_family',
        },
      ],
    },
    E2_saver: {
      id: 'E2_saver',
      age: 24,
      title: 'Watching Others Live',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I have money... but I'm not using it."),
        narration("You've built solid savings. Meanwhile, your friends are traveling, upgrading their lifestyles, and creating memories you're not part of."),
      ],
      choices: [
        {
          id: 'E2SA_strict',
          label: 'Continue strict saving',
          effect: { career: 4, health: 0, relationship: -2, wealth: 8, identity: 0 },
          consequence: [
            consequenceNarration('Your financial position strengthens quickly.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'This will matter later.'),
          ],
          nextEpisodeId: 'E3_wealth_focus',
        },
        {
          id: 'E2SB_intentional',
          label: 'Start spending a little more intentionally',
          effect: { career: 2, health: 2, relationship: 2, wealth: 2, identity: 0 },
          consequence: [
            consequenceNarration('You loosen up without losing control.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I can enjoy this and still be responsible.'),
          ],
          nextEpisodeId: 'E3_balanced',
        },
        {
          id: 'E2SC_invest',
          label: 'Invest your savings more aggressively',
          effect: { career: 3, health: 0, relationship: -1, wealth: 10, identity: 0 },
          consequence: [
            consequenceNarration('You shift from saving to growing wealth.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I want my money to work for me.'),
          ],
          nextEpisodeId: 'E3_investing',
        },
      ],
    },
    E2_spender: {
      id: 'E2_spender',
      age: 24,
      title: 'Living Fully',
      lines: [
        dialogue('Lea', 'lea', 'relieved', 'These are some of the best years of my life.'),
        narration("You've traveled, gone out, and built strong social memories - but your savings are minimal."),
      ],
      choices: [
        {
          id: 'E2PA_enjoy',
          label: 'Keep enjoying without worrying too much',
          effect: { career: 3, health: 2, relationship: 5, wealth: -6, identity: 0 },
          consequence: [
            consequenceNarration('You stay in the moment.'),
            consequenceDialogue('Lea', 'lea', 'relieved', "I'll figure money out later."),
          ],
          nextEpisodeId: 'E3_spender',
        },
        {
          id: 'E2PB_save_now',
          label: 'Start getting serious about saving now',
          effect: { career: 2, health: 0, relationship: 0, wealth: 5, identity: 0 },
          consequence: [
            consequenceNarration('You shift your habits gradually.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'Okay, time to be a bit smarter.'),
          ],
          nextEpisodeId: 'E3_balanced',
        },
        {
          id: 'E2PC_hustle',
          label: 'Take on side income or freelance work',
          effect: { career: 5, health: -1, relationship: -1, wealth: 6, identity: 0 },
          consequence: [
            consequenceNarration('You try to maintain your lifestyle while increasing income.'),
            consequenceDialogue('Lea', 'lea', 'determined', "I don't want to give this up - I'll earn more instead."),
          ],
          nextEpisodeId: 'E3_hustle',
        },
      ],
    },
    E2_balanced: {
      id: 'E2_balanced',
      age: 24,
      title: 'Loose Boundaries',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I'm not doing badly. I'm just not very clear."),
        narration("You've saved some, spent some, and mostly gone by feel. Nothing is off the rails, but nothing is especially intentional either."),
      ],
      choices: [
        {
          id: 'E2BA_tighten',
          label: 'Create a stricter savings system',
          effect: { career: 2, health: 0, relationship: -1, wealth: 5, identity: 1 },
          consequence: [
            consequenceNarration('More structure starts compounding quickly.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I need a plan, not vibes.'),
          ],
          nextEpisodeId: 'E3_wealth_focus',
        },
        {
          id: 'E2BB_keep_mix',
          label: 'Keep balancing without overcorrecting',
          effect: { career: 2, health: 1, relationship: 2, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('You keep a flexible middle path.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'Maybe steady is enough for now.'),
          ],
          nextEpisodeId: 'E3_balanced',
        },
        {
          id: 'E2BC_more_fun',
          label: 'Lean more into lifestyle and experiences',
          effect: { career: 2, health: 2, relationship: 3, wealth: -3, identity: 1 },
          consequence: [
            consequenceNarration('You decide your twenties should feel lived, not optimized.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I want to remember this decade.'),
          ],
          nextEpisodeId: 'E3_spender',
        },
      ],
    },
    E2_family: {
      id: 'E2_family',
      age: 24,
      title: 'Shared Money, Shared Weight',
      lines: [
        dialogue('Lea', 'lea', 'reflective', 'My money never really feels like only mine.'),
        narration('Helping family has strengthened your bonds, but it also means your own financial cushion is growing more slowly.'),
      ],
      choices: [
        {
          id: 'E2FA_support',
          label: 'Keep helping at the same level',
          effect: { career: 1, health: 0, relationship: 5, wealth: 0, identity: 1 },
          consequence: [
            consequenceNarration('You stay deeply reliable for the people around you.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'This matters, even when it stretches me.'),
          ],
          nextEpisodeId: 'E3_balanced',
        },
        {
          id: 'E2FB_income',
          label: 'Grow your income to support both goals',
          effect: { career: 5, health: -1, relationship: 1, wealth: 5, identity: 1 },
          consequence: [
            consequenceNarration('You push harder so duty does not swallow your future.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'If I need more room, I need more income.'),
          ],
          nextEpisodeId: 'E3_hustle',
        },
        {
          id: 'E2FC_boundaries',
          label: 'Set firmer financial boundaries',
          effect: { career: 2, health: 1, relationship: -1, wealth: 6, identity: 2 },
          consequence: [
            consequenceNarration('You protect more of your future, even if it feels uncomfortable.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'Care has to include me too.'),
          ],
          nextEpisodeId: 'E3_wealth_focus',
        },
      ],
    },
    E3_wealth_focus: {
      id: 'E3_wealth_focus',
      age: 26,
      title: 'Security as a Goal',
      lines: [
        dialogue('Lea', 'lea', 'determined', "I'm not just saving money. I'm buying breathing room."),
        narration('By 26, your habits are giving you visible financial traction. The cost is that life can start feeling a bit narrow.'),
      ],
      choices: [
        {
          id: 'E3WA_push',
          label: 'Double down on security',
          effect: { career: 4, health: 0, relationship: -2, wealth: 8, identity: 1 },
          consequence: [
            consequenceNarration('You make financial freedom a central goal.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I want this to change my life later.'),
          ],
          nextEpisodeId: 'E4_wealth',
        },
        {
          id: 'E3WB_loosen',
          label: 'Loosen up and make room for living',
          effect: { career: 2, health: 2, relationship: 2, wealth: -1, identity: 1 },
          consequence: [
            consequenceNarration('You keep your base, but let life feel warmer.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I can protect the future without disappearing into it.'),
          ],
          nextEpisodeId: 'E4_balanced',
        },
        {
          id: 'E3WC_family',
          label: 'Use your stability to help family more',
          effect: { career: 1, health: 0, relationship: 5, wealth: 1, identity: 1 },
          consequence: [
            consequenceNarration('Security turns into responsibility again.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'If I have room, I want to share it.'),
          ],
          nextEpisodeId: 'E4_family',
        },
      ],
    },
    E3_investing: {
      id: 'E3_investing',
      age: 26,
      title: 'The Early Advantage',
      lines: [
        dialogue('Lea', 'lea', 'determined', "I'm ahead... but it came with trade-offs."),
        narration("Your investments are growing. You're financially ahead of many peers - but your lifestyle has been restrained."),
      ],
      choices: [
        {
          id: 'E3IA_disciplined',
          label: 'Stay disciplined and grow wealth further',
          effect: { career: 5, health: 0, relationship: -2, wealth: 10, identity: 1 },
          consequence: [
            consequenceNarration('You maximize long-term gains.'),
            consequenceDialogue('Lea', 'lea', 'determined', "I'm building something bigger."),
          ],
          nextEpisodeId: 'E4_wealth',
        },
        {
          id: 'E3IB_upgrade',
          label: 'Start upgrading your lifestyle',
          effect: { career: 2, health: 2, relationship: 2, wealth: -2, identity: 1 },
          consequence: [
            consequenceNarration('You begin enjoying the benefits of your discipline.'),
            consequenceDialogue('Lea', 'lea', 'relieved', "I've earned this."),
          ],
          nextEpisodeId: 'E4_balanced',
        },
        {
          id: 'E3IC_family',
          label: 'Help family financially in a bigger way',
          effect: { career: 1, health: 0, relationship: 5, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('Your role in your family deepens.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'This matters more than numbers.'),
          ],
          nextEpisodeId: 'E4_family',
        },
      ],
    },
    E3_balanced: {
      id: 'E3_balanced',
      age: 26,
      title: 'The Middle Path',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I'm not winning hard in any one direction, but life feels more workable."),
        narration('Your twenties feel fuller than before, and your finances are steadier than chaos. The question is whether this middle path is enough for you.'),
      ],
      choices: [
        {
          id: 'E3BA_build',
          label: 'Take money more seriously from here',
          effect: { career: 3, health: 0, relationship: -1, wealth: 6, identity: 1 },
          consequence: [
            consequenceNarration('You decide balance needs a stronger financial backbone.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I want the middle path to actually hold.'),
          ],
          nextEpisodeId: 'E4_wealth',
        },
        {
          id: 'E3BB_keep',
          label: 'Protect the balance you have',
          effect: { career: 2, health: 2, relationship: 2, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('You resist the pull toward extremes.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I like my life when it still feels like mine.'),
          ],
          nextEpisodeId: 'E4_balanced',
        },
        {
          id: 'E3BC_family',
          label: 'Center family and shared stability',
          effect: { career: 1, health: 0, relationship: 4, wealth: 1, identity: 1 },
          consequence: [
            consequenceNarration('You define success in more relational terms.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'Enough means more than just my account balance.'),
          ],
          nextEpisodeId: 'E4_family',
        },
      ],
    },
    E3_spender: {
      id: 'E3_spender',
      age: 26,
      title: 'The Cost of Coasting',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I've had fun. I just don't feel very secure."),
        narration('The memories are real, but so is the pressure of having very little saved. Money has started feeling louder in the background.'),
      ],
      choices: [
        {
          id: 'E3SA_reset',
          label: 'Reset hard and build savings now',
          effect: { career: 3, health: 0, relationship: -1, wealth: 7, identity: 1 },
          consequence: [
            consequenceNarration('You choose a sharper financial turn.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I need more stability than this.'),
          ],
          nextEpisodeId: 'E4_wealth',
        },
        {
          id: 'E3SB_enjoy',
          label: 'Keep living fully and trust yourself later',
          effect: { career: 2, health: 2, relationship: 3, wealth: -4, identity: 1 },
          consequence: [
            consequenceNarration('You refuse to let fear make your life smaller.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I still want life to feel alive.'),
          ],
          nextEpisodeId: 'E4_balanced',
        },
        {
          id: 'E3SC_support',
          label: 'Spend more selectively and show up for family',
          effect: { career: 1, health: 1, relationship: 4, wealth: 0, identity: 1 },
          consequence: [
            consequenceNarration('You make your money choices more relational than aspirational.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'If I spend, I want it to matter.'),
          ],
          nextEpisodeId: 'E4_family',
        },
      ],
    },
    E3_hustle: {
      id: 'E3_hustle',
      age: 26,
      title: 'Earn More, Keep Pace',
      lines: [
        dialogue('Lea', 'lea', 'determined', "I'm trying to solve everything by increasing income."),
        narration('Extra work is giving you more cash, but your time and energy are getting tighter. The strategy works - at a cost.'),
      ],
      choices: [
        {
          id: 'E3HA_scale',
          label: 'Keep pushing income while you can',
          effect: { career: 5, health: -1, relationship: -1, wealth: 7, identity: 1 },
          consequence: [
            consequenceNarration('You turn hustle into momentum.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'If this season is intense, I want it to pay off.'),
          ],
          nextEpisodeId: 'E4_wealth',
        },
        {
          id: 'E3HB_pull_back',
          label: 'Reduce the hustle and protect your life',
          effect: { career: 2, health: 2, relationship: 2, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('You stop trying to solve every tension with output.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'More income is not the same as more life.'),
          ],
          nextEpisodeId: 'E4_balanced',
        },
        {
          id: 'E3HC_direct',
          label: 'Use the extra income to support family and obligations',
          effect: { career: 2, health: -1, relationship: 4, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('Your hustle becomes a tool for more than just yourself.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'If I am working this hard, I want it to help people.'),
          ],
          nextEpisodeId: 'E4_family',
        },
      ],
    },
    E4_wealth: {
      id: 'E4_wealth',
      age: 28,
      title: 'Freedom vs Living',
      lines: [
        dialogue('Lea', 'lea', 'reflective', 'I could be financially free early... but at what cost?'),
        narration("You're close to significant financial independence. But your lifestyle still feels restricted."),
      ],
      choices: [
        {
          id: 'E4WA_free',
          label: 'Push hard for early financial independence',
          effect: { career: 6, health: -1, relationship: -2, wealth: 12, identity: 1 },
          consequence: [
            consequenceNarration('You aim to finish the race early.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'Short-term sacrifice, long-term freedom.'),
          ],
          nextEpisodeId: 'E5_free',
        },
        {
          id: 'E4WB_enjoy',
          label: 'Relax and enjoy life more now',
          effect: { career: 3, health: 3, relationship: 3, wealth: -3, identity: 1 },
          consequence: [
            consequenceNarration('You slow down the financial goal.'),
            consequenceDialogue('Lea', 'lea', 'relieved', "I don't want to postpone living."),
          ],
          nextEpisodeId: 'E5_balanced',
        },
        {
          id: 'E4WC_redefine',
          label: "Redefine what 'enough' means",
          effect: { career: 2, health: 2, relationship: 2, wealth: 5, identity: 2 },
          consequence: [
            consequenceNarration('You shift from chasing maximum to chasing meaning.'),
            consequenceDialogue('Lea', 'lea', 'reflective', "Maybe freedom isn't just a number."),
          ],
          nextEpisodeId: 'E5_redefine',
        },
      ],
    },
    E4_balanced: {
      id: 'E4_balanced',
      age: 28,
      title: 'A Life That Still Fits',
      lines: [
        dialogue('Lea', 'lea', 'relieved', "I'm not as far ahead financially, but life feels more recognisable."),
        narration('You have some savings, some joy, and some breathing room. The tension now is whether to optimize harder or protect the life you have.'),
      ],
      choices: [
        {
          id: 'E4BA_push',
          label: 'Push harder and try to catch up financially',
          effect: { career: 4, health: -1, relationship: -1, wealth: 7, identity: 1 },
          consequence: [
            consequenceNarration('You choose a more intense wealth-building phase.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I want more optionality than this.'),
          ],
          nextEpisodeId: 'E5_free',
        },
        {
          id: 'E4BB_keep',
          label: 'Keep protecting balance',
          effect: { career: 3, health: 3, relationship: 3, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('You invest in sustainability, not just acceleration.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I want this to feel livable, not just efficient.'),
          ],
          nextEpisodeId: 'E5_balanced',
        },
        {
          id: 'E4BC_meaning',
          label: 'Decide on a more intentional definition of enough',
          effect: { career: 2, health: 2, relationship: 2, wealth: 4, identity: 2 },
          consequence: [
            consequenceNarration('You stop measuring success against every possible outcome.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'Maybe clarity matters more than maximizing.'),
          ],
          nextEpisodeId: 'E5_redefine',
        },
      ],
    },
    E4_family: {
      id: 'E4_family',
      age: 28,
      title: 'Money in More Than One Direction',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "My money doesn't only represent me. It represents who I show up for."),
        narration('Family responsibilities keep shaping how much freedom your income can create. The question is whether to lean further in, pull back, or redefine the goal entirely.'),
      ],
      choices: [
        {
          id: 'E4FA_security',
          label: 'Build more wealth so you can support others better',
          effect: { career: 4, health: -1, relationship: 2, wealth: 7, identity: 1 },
          consequence: [
            consequenceNarration('You treat financial strength as a form of care.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'If I want to help, I need a stronger base.'),
          ],
          nextEpisodeId: 'E5_free',
        },
        {
          id: 'E4FB_present',
          label: 'Stay present and keep life more relational now',
          effect: { career: 2, health: 2, relationship: 4, wealth: 1, identity: 1 },
          consequence: [
            consequenceNarration('You choose presence over maximum accumulation.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I do not want money to replace time.'),
          ],
          nextEpisodeId: 'E5_balanced',
        },
        {
          id: 'E4FC_enough',
          label: 'Redefine success around enough, not endless growth',
          effect: { career: 2, health: 2, relationship: 3, wealth: 3, identity: 2 },
          consequence: [
            consequenceNarration('You choose a steadier, more values-based frame.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I want my money decisions to sound like me.'),
          ],
          nextEpisodeId: 'E5_redefine',
        },
      ],
    },
    E5_free: {
      id: 'E5_free',
      age: 31,
      title: 'The Milestone',
      lines: [
        dialogue('Lea', 'lea', 'relieved', 'I reached what I was aiming for.'),
        narration("You've achieved strong financial security. Possibly even early independence. But now comes the question - what next?"),
      ],
      choices: [
        {
          id: 'E5FA_more',
          label: 'Keep working and build even more',
          effect: { career: 8, health: 0, relationship: -1, wealth: 6, identity: 1 },
          consequence: [
            consequenceNarration('You continue building, even after enough.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'I still have momentum, and I want to use it.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5FB_flexibility',
          label: 'Slow down and enjoy flexibility',
          effect: { career: 3, health: 4, relationship: 3, wealth: 2, identity: 1 },
          consequence: [
            consequenceNarration('You use your freedom.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'This is what the room was for.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5FC_purpose',
          label: 'Shift toward purpose-driven work',
          effect: { career: 4, health: 2, relationship: 2, wealth: 1, identity: 2 },
          consequence: [
            consequenceNarration('You redefine success beyond money.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I want my work to feel chosen, not just rewarded.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
      ],
    },
    E5_balanced: {
      id: 'E5_balanced',
      age: 31,
      title: 'The Life You Can Actually Feel',
      lines: [
        dialogue('Lea', 'lea', 'relieved', "I'm not maximized, but I'm here for my own life."),
        narration('Your choices have built a more moderate kind of security, alongside more time, more memories, and less constant pressure.'),
      ],
      choices: [
        {
          id: 'E5BA_build',
          label: 'Build a little more wealth without losing the balance',
          effect: { career: 4, health: 1, relationship: 1, wealth: 4, identity: 1 },
          consequence: [
            consequenceNarration('You look for steadier growth, not total reinvention.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I can still strengthen this without hardening.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5BB_live',
          label: 'Use your stability to live more fully now',
          effect: { career: 2, health: 3, relationship: 3, wealth: 1, identity: 1 },
          consequence: [
            consequenceNarration('You decide enough should feel usable.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I want to actually enjoy what I built.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5BC_values',
          label: 'Focus on a life that feels aligned, not optimized',
          effect: { career: 3, health: 2, relationship: 2, wealth: 2, identity: 2 },
          consequence: [
            consequenceNarration('You let coherence matter more than comparison.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I want to like the shape of my life.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
      ],
    },
    E5_redefine: {
      id: 'E5_redefine',
      age: 31,
      title: 'Redefining Enough',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I'm less interested in the biggest number. I'm more interested in the right one."),
        narration('You have started measuring wealth in room, energy, values, and choice - not just in accumulation.'),
      ],
      choices: [
        {
          id: 'E5RA_security',
          label: 'Keep a strong financial base while staying intentional',
          effect: { career: 4, health: 1, relationship: 1, wealth: 4, identity: 2 },
          consequence: [
            consequenceNarration('You build security without returning to obsession.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'Enough still deserves structure.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5RB_time',
          label: 'Prioritise time, flexibility, and daily life',
          effect: { career: 2, health: 3, relationship: 3, wealth: 1, identity: 2 },
          consequence: [
            consequenceNarration('You make spaciousness part of your definition of wealth.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I want enough to feel like room, not just proof.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
        {
          id: 'E5RC_meaning',
          label: 'Let your values, not comparison, lead the next chapter',
          effect: { career: 3, health: 2, relationship: 2, wealth: 2, identity: 3 },
          consequence: [
            consequenceNarration('You become more explicit about the life you are building toward.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I want my choices to sound like me when I look back.'),
          ],
          nextEpisodeId: 'E6_reflect',
        },
      ],
    },
    E6_reflect: {
      id: 'E6_reflect',
      age: 35,
      title: 'What It Added Up To',
      lines: [
        dialogue('Lea', 'lea', 'reflective', 'I thought money would answer everything.'),
        narration('At 35, your choices around money have shaped your life - your stress, your freedom, your relationships.'),
      ],
      choices: [
        {
          id: 'E6A_wealth',
          label: 'Prioritise building more wealth',
          effect: { career: 7, health: 0, relationship: -1, wealth: 5, identity: 1 },
          consequence: [
            consequenceNarration('You decide the next decade still benefits from stronger financial leverage.'),
            consequenceDialogue('Lea', 'lea', 'determined', 'More room still matters to me.'),
          ],
          nextEpisodeId: 'E7_final',
        },
        {
          id: 'E6B_relationships',
          label: 'Prioritise relationships and time',
          effect: { career: 2, health: 3, relationship: 4, wealth: 0, identity: 1 },
          consequence: [
            consequenceNarration('You make your time feel less secondary to your income.'),
            consequenceDialogue('Lea', 'lea', 'relieved', 'I want my life to feel inhabited.'),
          ],
          nextEpisodeId: 'E7_final',
        },
        {
          id: 'E6C_balance',
          label: 'Balance both consciously',
          effect: { career: 4, health: 2, relationship: 2, wealth: 2, identity: 2 },
          consequence: [
            consequenceNarration('You keep trying to hold both security and presence on purpose.'),
            consequenceDialogue('Lea', 'lea', 'reflective', 'I want the trade-offs to feel chosen, not accidental.'),
          ],
          nextEpisodeId: 'E7_final',
        },
      ],
    },
    E7_final: {
      id: 'E7_final',
      age: 38,
      title: 'Looking Back at Your Choices',
      lines: [
        dialogue('Lea', 'lea', 'reflective', "I don't think it was about money. It was about how I lived."),
        narration('You reflect on your financial journey - the trade-offs, the freedom, and the life you built around it.'),
      ],
      choices: [
        {
          id: 'E7A_control',
          label: 'I built wealth, and it gave me control',
          effect: { career: 0, health: 0, relationship: 0, wealth: 2, identity: 2 },
          consequence: [
            consequenceDialogue('Lea', 'lea', 'determined', 'I created my own safety.'),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7B_experience',
          label: 'I lived fully, even if it cost me financially',
          effect: { career: 0, health: 2, relationship: 2, wealth: 0, identity: 1 },
          consequence: [
            consequenceDialogue('Lea', 'lea', 'relieved', "I don't regret the experiences."),
          ],
          nextEpisodeId: 'SUMMARY',
        },
        {
          id: 'E7C_imperfect',
          label: 'I tried to balance both, imperfectly',
          effect: { career: 0, health: 0, relationship: 1, wealth: 1, identity: 1 },
          consequence: [
            consequenceDialogue('Lea', 'lea', 'reflective', "It wasn't perfect, but it was mine."),
          ],
          nextEpisodeId: 'SUMMARY',
        },
      ],
    },
  },
};
