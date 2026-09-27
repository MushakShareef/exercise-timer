import { useCallback, useRef } from "react";

type Cue = "exercise" | "rest" | "round" | "complete" | "tick";

/**
 * Tiny WebAudio beep generator. Mobile browsers restrict autoplay of audio
 * until a user gesture, so the AudioContext is only created lazily, inside
 * `unlock()`, which must be called from a click/tap handler (e.g. START).
 */
export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);

  const unlock = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    ctxRef.current?.resume().catch(() => {});
  }, []);

  const beep = useCallback(
    (freq: number, durationMs: number, volume = 0.2) => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain).connect(ctx.destination);
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);
      osc.start(t0);
      osc.stop(t0 + durationMs / 1000);
    },
    []
  );

  const play = useCallback(
    (cue: Cue) => {
      if (!ctxRef.current) return;
      switch (cue) {
        case "exercise":
          beep(880, 220, 0.22);
          break;
        case "rest":
          beep(440, 220, 0.18);
          break;
        case "round":
          beep(660, 120, 0.2);
          setTimeout(() => beep(880, 140, 0.2), 130);
          break;
        case "complete":
          beep(523, 140, 0.22);
          setTimeout(() => beep(659, 140, 0.22), 150);
          setTimeout(() => beep(784, 220, 0.22), 300);
          break;
        case "tick":
          beep(300, 70, 0.14);
          break;
      }
    },
    [beep]
  );

  return { unlock, play };
}
