"use client";

import { Settings } from "@/lib/types";

interface Props {
  settings: Settings;
  onChange: (next: Settings) => void;
  onStart: () => void;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function StepRow({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-white/10">
      <span className="text-base text-mist">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          className="h-12 w-12 rounded-full bg-panel active:bg-white/10 text-2xl leading-none flex items-center justify-center"
          onClick={() => onChange(clamp(value - step, min, max))}
        >
          –
        </button>
        <div className="w-24 text-center font-display text-2xl tabular-nums">
          {value}
          <span className="text-sm text-mist ml-1">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          className="h-12 w-12 rounded-full bg-panel active:bg-white/10 text-2xl leading-none flex items-center justify-center"
          onClick={() => onChange(clamp(value + step, min, max))}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-4 border-b border-white/10"
    >
      <span className="text-base text-mist">{label}</span>
      <span
        className={`relative h-8 w-14 rounded-full transition-colors ${
          checked ? "bg-exercise" : "bg-panel"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-chalk transition-transform ${
            checked ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function ConfigScreen({ settings, onChange, onStart }: Props) {
  return (
    <div className="min-h-dvh flex flex-col px-6 pt-10 pb-8 max-w-md mx-auto w-full">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Interval
        </h1>
        <p className="text-mist mt-1">
          {settings.exerciseSec}s exercise · {settings.restSec}s rest ·{" "}
          {settings.rounds} round{settings.rounds === 1 ? "" : "s"}
        </p>
      </header>

      <section className="flex-1">
        <StepRow
          label="Exercise"
          value={settings.exerciseSec}
          unit="sec"
          min={1}
          max={600}
          step={1}
          onChange={(v) => onChange({ ...settings, exerciseSec: v })}
        />
        <StepRow
          label="Rest"
          value={settings.restSec}
          unit="sec"
          min={0}
          max={600}
          step={1}
          onChange={(v) => onChange({ ...settings, restSec: v })}
        />
        <StepRow
          label="Rounds"
          value={settings.rounds}
          unit=""
          min={1}
          max={99}
          step={1}
          onChange={(v) => onChange({ ...settings, rounds: v })}
        />

        <div className="mt-2">
          <Toggle
            label="Sound"
            checked={settings.soundOn}
            onChange={(v) => onChange({ ...settings, soundOn: v })}
          />
          <Toggle
            label="Countdown (3-2-1)"
            checked={settings.countdownOn}
            onChange={(v) => onChange({ ...settings, countdownOn: v })}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={onStart}
        className="mt-8 w-full h-16 rounded-2xl bg-exercise text-ink font-display text-xl font-semibold active:scale-[0.98] transition-transform"
      >
        Start
      </button>
    </div>
  );
}
