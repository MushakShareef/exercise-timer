import { DEFAULT_SETTINGS, Settings, WorkoutState } from "./types";

const SETTINGS_KEY = "interval-timer:settings";
const WORKOUT_KEY = "interval-timer:workout";

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (private mode, quota) — fail silently, it's only
    // a convenience.
  }
}

/**
 * Only timestamps + phase/round + settings are ever persisted here — never
 * a "seconds remaining" counter, per the no-drift requirement. On reload,
 * syncState() recomputes the correct phase from these exact same fields.
 */
export function saveWorkout(state: WorkoutState): void {
  try {
    if (state.phase === "IDLE" || state.phase === "COMPLETE") {
      window.localStorage.removeItem(WORKOUT_KEY);
      return;
    }
    window.localStorage.setItem(WORKOUT_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadWorkout(): WorkoutState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkoutState;
  } catch {
    return null;
  }
}

export function clearWorkout(): void {
  try {
    window.localStorage.removeItem(WORKOUT_KEY);
  } catch {
    // ignore
  }
}
