const PLACEHOLDER_LEA = require('../../assets/dogs/Puppy open eyes.png');
const PLACEHOLDER_MARA = require('../../assets/dogs/teen1 eyes open.png');
const PLACEHOLDER_DRLIN = require('../../assets/dogs/adult dog eyes open tail up.png');
const PLACEHOLDER_BG_SOFT = require('../../assets/picture background.png');
const PLACEHOLDER_BG_ALT = require('../../assets/Background 1.png');

export const CHARACTER_LABELS = {
  lea: 'Lea',
  mara: 'Mara',
  drlin: 'Dr. Lin',
};

export const CHARACTER_LAYOUTS = {
  lea: { left: '4%', width: '38%', zIndex: 3 },
  drlin: { right: '20%', width: '36%', zIndex: 2 },
  mara: { right: '2%', width: '35%', zIndex: 1 },
};

export const CHARACTER_SPRITES = {
  lea: {
    base: PLACEHOLDER_LEA,
    worried: PLACEHOLDER_LEA,
    determined: PLACEHOLDER_LEA,
    relieved: PLACEHOLDER_LEA,
    reflective: PLACEHOLDER_LEA,
  },
  mara: {
    base: PLACEHOLDER_MARA,
    composed: PLACEHOLDER_MARA,
    persuasive: PLACEHOLDER_MARA,
    serious: PLACEHOLDER_MARA,
  },
  drlin: {
    base: PLACEHOLDER_DRLIN,
    warm: PLACEHOLDER_DRLIN,
    informative: PLACEHOLDER_DRLIN,
    thoughtful: PLACEHOLDER_DRLIN,
  },
};

export const BACKGROUND_ASSETS = {
  bg_apartment_morning_age22: PLACEHOLDER_BG_SOFT,
  bg_clinic_lobby_day: PLACEHOLDER_BG_ALT,
  bg_clinic_consult_room: PLACEHOLDER_BG_SOFT,
  bg_office_evening_city: PLACEHOLDER_BG_ALT,
  bg_office_meeting_room: PLACEHOLDER_BG_SOFT,
  bg_office_rainy_window_age28: PLACEHOLDER_BG_ALT,
  bg_apartment_evening_age31: PLACEHOLDER_BG_SOFT,
  bg_terrace_quiet_age35: PLACEHOLDER_BG_ALT,
  bg_rooftop_sunset_age38: PLACEHOLDER_BG_SOFT,
};

export function getCharacterSprite(characterId, expression = 'base') {
  const characterSprites = CHARACTER_SPRITES[characterId] || CHARACTER_SPRITES.lea;
  return characterSprites[expression] || characterSprites.base;
}

export function getBackgroundAsset(backgroundId) {
  return BACKGROUND_ASSETS[backgroundId] || PLACEHOLDER_BG_SOFT;
}

export function getCharacterLabel(characterId) {
  return CHARACTER_LABELS[characterId] || characterId;
}
