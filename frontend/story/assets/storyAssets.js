const LEA_FRONT   = require('../../assets/leaSim/lea front.jpeg');
const LEA_SIDE    = require('../../assets/leaSim/lea side.png');
const LEA_SIDE_M  = require('../../assets/leaSim/Lea Side M.png');
const MANAGER     = require('../../assets/ManagerSim/Manager.png');
const DOC_FRONT   = require('../../assets/DocSim/Doc Front.png');

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
    sideM:      LEA_SIDE_M,
  },
  mara: {
    base:       MANAGER,
    composed:   MANAGER,
    persuasive: MANAGER,
    serious:    MANAGER,
  },
  drlin: {
    base:        DOC_FRONT,
    warm:        DOC_FRONT,
    informative: DOC_FRONT,
    thoughtful:  DOC_FRONT,
  },
};

export function getCharacterSprite(characterId, expression = 'base') {
  const sprites = CHARACTER_SPRITES[characterId] || CHARACTER_SPRITES.lea;
  return sprites[expression] || sprites.base;
}

export function getCharacterLabel(characterId) {
  return CHARACTER_LABELS[characterId] || characterId;
}
