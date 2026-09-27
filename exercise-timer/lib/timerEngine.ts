import { Settings, TimerPhase, WorkoutState, createIdleState } from "./types";

/**
 * TIMER ENGINE
 * ------------
 * The entire module is pure and deterministic: every function takes a state
 * and (where relevant) a `now` timestamp, and returns a new state. Nothing in
 * here uses `setInterval`/`setTimeout` counters as a source of truth — the
 * only inputs that matter are absolute timestamps (`phaseStartedAt`,
 * `phaseEndsAt`) and `Date.now()`. That is what makes the timer immune to
 * throttled/suspended JS when the screen sleeps or the tab is backgrounded:
 * whenever the UI wakes back up, it just asks "what time is it now?" and
 * recomputes everything from scratch.
 */

function durationForPhase(phase: TimerPhase, settings: Settings): number {
  if (phase === "EXERCISE") return settings.exerciseSec * 1000;
  if (phase === "REST") return settings.restSec * 1000;
  return 0;
}

/** Pure phase/round transition table. No timestamps here. */
function advance(
  phase: TimerPhase,
  round: number,
  totalRounds: number
): { phase: TimerPhase; round: number } {
  if (phase === "EXERCISE") {
    // Exercise always moves to rest; whether that rest is the *last* thing
    // (no more exercise afterwards) is decided when REST itself elapses.
    return { phase: "REST", round };
  }
  if (phase === "REST") {
    if (round >= totalRounds) {
      return { phase: "COMPLETE", round };
    }
    return { phase: "EXERCISE", round: round + 1 };
  }
  return { phase: "COMPLETE", round };
}

const MAX_PHASE_SKIPS = 5000; // safety bound, not a real-world limit

/**
 * The authoritative recovery function. Call this any time the UI wakes up
 * (tab becomes visible, window refocuses, or on every animation frame while
 * running) with the current wall-clock time. It walks forward through as
 * many phase boundaries as have already elapsed — one, ten, or the entire
 * rest of the workout — until it lands on the phase/round the user should
 * actually be looking at right now.
 *
 * Each step sets the new phaseStartedAt to the *previous* phaseEndsAt
 * (never to `now`), so scheduled boundaries stay exactly duration-apart
 * forever. That is what prevents drift: a phase's length is always
 * `exerciseSec`/`restSec` exactly, regardless of how late or early the
 * calling frame happened to fire.
 */
export function syncState(state: WorkoutState, now: number): WorkoutState {
  if (
    !state.isRunning ||
    state.isPaused ||
    state.phase === "IDLE" ||
    state.phase === "COMPLETE" ||
    state.phaseEndsAt === null
  ) {
    return state;
  }

  let phase: TimerPhase = state.phase;
  let round = state.currentRound;
  let phaseStartedAt: number | null = state.phaseStartedAt;
  let phaseEndsAt: number | null = state.phaseEndsAt;
  let skips = 0;

  while (phaseEndsAt !== null && now >= phaseEndsAt && skips < MAX_PHASE_SKIPS) {
    const result = advance(phase, round, state.totalRounds);
    phase = result.phase;
    round = result.round;

    if (phase === "COMPLETE") {
      phaseStartedAt = null;
      phaseEndsAt = null;
      break;
    }

    phaseStartedAt = phaseEndsAt; // exact boundary, not `now`
    phaseEndsAt = phaseStartedAt + durationForPhase(phase, state.settings);
    skips++;
  }

  return {
    ...state,
    phase,
    currentRound: round,
    phaseStartedAt,
    phaseEndsAt,
    isRunning: phase !== "COMPLETE",
  };
}

export function start(settings: Settings, now: number): WorkoutState {
  const durationMs = durationForPhase("EXERCISE", settings);
  return {
    phase: "EXERCISE",
    currentRound: 1,
    totalRounds: settings.rounds,
    phaseStartedAt: now,
    phaseEndsAt: now + durationMs,
    isRunning: true,
    isPaused: false,
    pausedRemainingMs: null,
    settings,
  };
}

export function pause(state: WorkoutState, now: number): WorkoutState {
  if (!state.isRunning || state.isPaused || state.phaseEndsAt === null) {
    return state;
  }
  // Freeze the exact remaining time. We deliberately do NOT keep counting
  // from the stale phaseEndsAt while paused.
  const remaining = Math.max(0, state.phaseEndsAt - now);
  return {
    ...state,
    isPaused: true,
    pausedRemainingMs: remaining,
    phaseStartedAt: null,
    phaseEndsAt: null,
  };
}

export function resume(state: WorkoutState, now: number): WorkoutState {
  if (!state.isPaused || state.pausedRemainingMs === null) {
    return state;
  }
  return {
    ...state,
    isPaused: false,
    phaseStartedAt: now,
    phaseEndsAt: now + state.pausedRemainingMs,
    pausedRemainingMs: null,
  };
}

export function reset(settings: Settings): WorkoutState {
  return createIdleState(settings);
}

/** Remaining whole seconds to display for the current phase, at time `now`. */
export function remainingSeconds(state: WorkoutState, now: number): number {
  if (state.isPaused && state.pausedRemainingMs !== null) {
    return Math.ceil(state.pausedRemainingMs / 1000);
  }
  if (state.phaseEndsAt === null) return 0;
  const remainingMs = Math.max(0, state.phaseEndsAt - now);
  return Math.ceil(remainingMs / 1000);
}

export function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
