import { Storage } from './storage';

export const POINTS = {
  CONDITION_CARD_READ: 1,
  CYCLE_LOG: 1,
  SIMULATION_COMPLETE: 5,
};

export const Points = {
  async getTotal() {
    const pts = await Storage.get(Storage.KEYS.USER_POINTS);
    return pts ?? 0;
  },

  async add(amount) {
    const current = await Points.getTotal();
    const newTotal = current + amount;
    await Storage.set(Storage.KEYS.USER_POINTS, newTotal);
    await Points.updateLeaStage(newTotal);
    return newTotal;
  },

  async updateLeaStage(total) {
    let stage = 'puppy';
    if (total >= 500) stage = 'adult';
    else if (total >= 50) stage = 'young';
    await Storage.set(Storage.KEYS.LEA_STAGE, stage);
  },
};