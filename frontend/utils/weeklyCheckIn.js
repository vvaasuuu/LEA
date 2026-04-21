import { Storage } from './storage';
import weeklyActions from '../data/weekly_actions.json';

const KEY = 'weekly_checkin';
const HISTORY_KEY = 'weekly_checkin_history';
const MS_PER_HOUR = 3600000;

function getPool(priority) {
  return weeklyActions[priority]?.actions || [];
}

function pickInitialActions(priority) {
  return getPool(priority).slice(0, 3).map(a => ({ ...a, completed: false, skipped: false }));
}

export const WeeklyCheckInUtil = {
  async getState() {
    let state = await Storage.get(KEY);

    if (!state) {
      state = { checkinDate: new Date().toISOString(), priority: null, actions: [], reflection: null };
      await Storage.set(KEY, state);
      return { ...state, phase: 'idle' };
    }

    const ageHours = (Date.now() - new Date(state.checkinDate).getTime()) / MS_PER_HOUR;

    // Normalise — guard against old stored data missing the actions array
    if (!Array.isArray(state.actions)) state.actions = [];

    // Week ended (7+ days since checkin)
    if (ageHours >= 168) {
      if (state.priority && !state.reflection) {
        return { ...state, phase: 'reflecting' };
      }
      // Archive completed week and start fresh
      if (state.priority && state.reflection) {
        const history = await Storage.get(HISTORY_KEY) || [];
        if (!history.find(h => h.checkinDate === state.checkinDate)) {
          history.unshift(state);
          if (history.length > 12) history.pop();
          await Storage.set(HISTORY_KEY, history);
        }
      }
      const fresh = { checkinDate: new Date().toISOString(), priority: null, actions: [], reflection: null };
      await Storage.set(KEY, fresh);
      return { ...fresh, phase: 'idle' };
    }

    // No priority chosen yet
    if (!state.priority) {
      // Gentle reminder after 36 hours
      return { ...state, phase: ageHours >= 36 ? 'reminder' : 'idle' };
    }

    if (state.reflection) return { ...state, phase: 'complete' };
    return { ...state, phase: 'active' };
  },

  async selectPriority(priority) {
    const state = await Storage.get(KEY);
    const actions = pickInitialActions(priority);
    const updated = { ...state, priority, prioritySetAt: new Date().toISOString(), actions };
    await Storage.set(KEY, updated);
    return updated;
  },

  async completeAction(actionId) {
    const state = await Storage.get(KEY);
    const actions = state.actions.map(a =>
      a.id === actionId ? { ...a, completed: true, skipped: false } : a
    );
    await Storage.set(KEY, { ...state, actions });
    return actions;
  },

  async skipAction(actionId) {
    const state = await Storage.get(KEY);
    const actions = state.actions.map(a =>
      a.id === actionId ? { ...a, skipped: true } : a
    );
    await Storage.set(KEY, { ...state, actions });
    return actions;
  },

  async replaceAction(actionId) {
    const state = await Storage.get(KEY);
    const pool = getPool(state.priority);
    const currentIds = state.actions.map(a => a.id);
    const available = pool.filter(a => !currentIds.includes(a.id));
    if (!available.length) return state.actions;
    const replacement = available[Math.floor(Math.random() * available.length)];
    const actions = state.actions.map(a =>
      a.id === actionId ? { ...replacement, completed: false, skipped: false } : a
    );
    await Storage.set(KEY, { ...state, actions });
    return actions;
  },

  async resetPriority() {
    const state = await Storage.get(KEY);
    await Storage.set(KEY, { ...state, priority: null, actions: [], prioritySetAt: null });
  },

  async saveReflection(response, extra = null) {
    const state = await Storage.get(KEY);
    const updated = { ...state, reflection: response, reflectionExtra: extra, completedAt: new Date().toISOString() };
    await Storage.set(KEY, updated);
    const history = await Storage.get(HISTORY_KEY) || [];
    history.unshift(updated);
    if (history.length > 12) history.pop();
    await Storage.set(HISTORY_KEY, history);
    return updated;
  },

  async getHistory() {
    return await Storage.get(HISTORY_KEY) || [];
  },
};
