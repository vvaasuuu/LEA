const LEA_FRONT   = require('../../assets/leaSim/lea front.jpeg');
const LEA_SIDE    = require('../../assets/leaSim/lea side.jpeg');
const MARA_FRONT  = require('../../assets/ManagerSim/manager front.png');
const MARA_SIDE   = require('../../assets/ManagerSim/manager side.png');
const DOC_SIDE    = require('../../assets/DocSim/DocSideR.png');

export const CHARACTER_LABELS = {
  lea:   'Lea',
  mara:  'Mara',
  drlin: 'Doctor',
};

export const CHARACTER_LAYOUTS = {
  lea:   { left: '4%',  width: '38%', zIndex: 3 },
  drlin: { right: '20%', width: '36%', zIndex: 2 },
  mara:  { right: '2%', width: '35%', zIndex: 1 },
};

export const CHARACTER_SPRITES = {
  lea: {
    base:       LEA_FRONT,
    worried:    LEA_FRONT,
    determined: LEA_FRONT,
    relieved:   LEA_FRONT,
    reflective: LEA_SIDE,
  },
  mara: {
    base:       MARA_FRONT,
    composed:   MARA_FRONT,
    persuasive: MARA_FRONT,
    serious:    MARA_SIDE,
  },
  drlin: {
    base:        DOC_SIDE,
    warm:        DOC_SIDE,
    informative: DOC_SIDE,
    thoughtful:  DOC_SIDE,
  },
};

export function getCharacterSprite(characterId, expression = 'base') {
  const sprites = CHARACTER_SPRITES[characterId] || CHARACTER_SPRITES.lea;
  return sprites[expression] || sprites.base;
}

export function getCharacterLabel(characterId) {
  return CHARACTER_LABELS[characterId] || characterId;
}
