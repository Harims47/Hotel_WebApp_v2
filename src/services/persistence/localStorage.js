import { INITIAL_STATE } from '../../data/seed';

const STATE_KEY = 'restaurant_os_v1_state';
const STATE_VERSION = '1.0.1'; // Update this to clear stale data

export const loadState = () => {
  try {
    const serializedState = localStorage.getItem(STATE_KEY);
    if (serializedState === null) {
      return { ...INITIAL_STATE, _version: STATE_VERSION };
    }
    const state = JSON.parse(serializedState);
    if (state._version !== STATE_VERSION) {
      console.warn('Stale data detected, resetting to initial state.');
      return { ...INITIAL_STATE, _version: STATE_VERSION };
    }
    return state;
  } catch (err) {
    console.error('Failed to load state from localStorage', err);
    return { ...INITIAL_STATE, _version: STATE_VERSION };
  }
};

export const saveState = (state) => {
  try {
    const stateToPersist = {
      ...state,
      _version: STATE_VERSION,
    };
    const serializedState = JSON.stringify(stateToPersist);
    localStorage.setItem(STATE_KEY, serializedState);
  } catch (err) {
    console.error('Failed to save state to localStorage', err);
  }
};

export const resetDemoData = () => {
  try {
    localStorage.removeItem(STATE_KEY);
    window.location.href = '/login';
  } catch (err) {
    console.error('Failed to reset demo data', err);
  }
};
