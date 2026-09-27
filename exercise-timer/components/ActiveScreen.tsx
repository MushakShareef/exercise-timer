"use client";

import { formatMMSS } from "@/lib/timerEngine";
import { WorkoutState } from "@/lib/types";

interface Props {
  state: WorkoutState;
  remaining: number; // whole seconds left in current phase
  onPauseResume: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  fullscreenSupported: boolean;
}

export default function ActiveScreen({
  state,
  remaining,
  onPauseResume,
  onReset,
  onFullscreen,
  fullscreenSupported,
}: Props) {
  const isRest = state.phase === "REST";
  const showCountdown =
    state.settings.countdownOn &&
    !state.isPaused &&
    remaining > 0 &&
    remaining <= 3;

  const bg = isRest ? "bg-rest-dim" : "bg-exercise-dim";
  const accent = isRest ? "text-rest" : "text-exercise";
  const label = isRest ? "Rest" : "Exercise";

  return (
    <div
      className={`min-h-dvh flex flex-col items-center justify-between px-6 pt-10 pb-8 ${bg} transition-colors duration-500`}
    >
      <div className="w-full max-w-md flex items-center justify-between">
        <span className={`font-display text-lg font-semibold ${accent}`}>
          {state.isPaused ? "Paused" : label}
        </span>
        {fullscreenSupported && (
          <button
            type="button"
            aria-label="Toggle full screen"
            onClick={onFullscreen}
            className="h-10 w-10 rounded-full bg-black/20 flex items-center justify-center text-mist"
          >
            ⛶
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div
          className={`font-display font-bold tabular-nums leading-none ${accent} ${
            showCountdown ? "text-[11rem]" : "text-[9rem]"
          } transition-all`}
        >
          {showCountdown ? remaining : formatMMSS(remaining)}
        </div>
        <p className="mt-4 text-mist text-lg">
          Round {state.currentRound} / {state.totalRounds}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="flex gap-1.5 justify-center mb-8">
          {Array.from({ length: state.totalRounds }, (_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 max-w-8 rounded-full ${
                i < state.currentRound - 1
                  ? "bg-chalk/70"
                  : i === state.currentRound - 1
                  ? accent.replace("text-", "bg-")
                  : "bg-white/15"
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onPauseResume}
            className="flex-1 h-16 rounded-2xl bg-white/10 font-display text-lg font-semibold active:scale-[0.98] transition-transform"
          >
            {state.isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-16 px-6 rounded-2xl bg-white/5 text-mist font-display text-lg font-semibold active:scale-[0.98] transition-transform"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
