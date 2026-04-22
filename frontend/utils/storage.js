import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER_AGE: 'user_age',
  USER_CONDITIONS: 'user_conditions',
  USER_GOALS: 'user_goals',
  USER_POINTS: 'user_points',
  SIMULATION_HISTORY: 'simulation_history',
  SIMULATION_CONDITION_INDEX: 'simulation_condition_index',
  ROADMAP_ITEMS: 'roadmap_items',
  LEA_STAGE: 'lea_stage',
  LEA_NAME: 'lea_name',
  LEA_BREED: 'lea_breed',
  USER_LIFE_STAGE: 'user_life_stage',
  USER_PRIORITIES: 'user_priorities',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  RELATIONSHIP_CONTENT_ENABLED: 'relationship_content_enabled',
};

export const Storage = {
  KEYS,

  async set(key, value) {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, serialized);
    } catch (e) {
      console.error('Storage.set error:', e);
    }
  },

  async get(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (e) {
      console.error('Storage.get error:', e);
      return null;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Storage.remove error:', e);
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Storage.clearAll error:', e);
    }
  },
};