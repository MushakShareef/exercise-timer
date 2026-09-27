export type TimerPhase = "IDLE" | "EXERCISE" | "REST" | "COMPLETE";

export interface Settings {
  exerciseSec: number;
  restSec: number;
  rounds: number;
  soundOn: boolean;
  countdownOn: boolean;
}

export interface WorkoutState {
  phase: TimerPhase;
  currentRound: number; // 1-indexed
  totalRounds: number;

  // Absolute-clock authoritative timestamps (ms since epoch).
  // These — never an incrementing counter — are the source of truth.
  phaseStartedAt: number | null;
  phaseEndsAt: number | null;

  isRunning: boolean;
  isPaused: boolean;
  // Remaining ms in the current phase, frozen at the moment of pausing.
  pausedRemainingMs: number | null;

  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  exerciseSec: 20,
  restSec: 5,
  rounds: 5,
  soundOn: true,
  countdownOn: true,
};

export function createIdleState(settings: Settings): WorkoutState {
  return {
    phase: "IDLE",
    currentRound: 1,
    totalRounds: settings.rounds,
    phaseStartedAt: null,
    phaseEndsAt: null,
    isRunning: false,
    isPaused: false,
    pausedRemainingMs: null,
    settings,
  };
}
