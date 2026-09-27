"use client";

interface Props {
  totalRounds: number;
  onStartAgain: () => void;
  onChangeSettings: () => void;
}

export default function CompleteScreen({
  totalRounds,
  onStartAgain,
  onChangeSettings,
}: Props) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 pb-8 bg-finish-dim text-center">
      <span className="font-display text-lg font-semibold text-finish">
        Complete
      </span>
      <p className="mt-2 text-mist text-lg">
        {totalRounds} round{totalRounds === 1 ? "" : "s"} finished
      </p>
      <p className="mt-1 font-display text-3xl font-semibold">Great work!</p>

      <div className="w-full max-w-md mt-12 flex flex-col gap-3">
        <button
          type="button"
          onClick={onStartAgain}
          className="w-full h-16 rounded-2xl bg-finish text-ink font-display text-xl font-semibold active:scale-[0.98] transition-transform"
        >
          Start again
        </button>
        <button
          type="button"
          onClick={onChangeSettings}
          className="w-full h-14 rounded-2xl bg-white/10 text-chalk font-display text-lg font-semibold active:scale-[0.98] transition-transform"
        >
          Change settings
        </button>
      </div>
    </div>
  );
}
