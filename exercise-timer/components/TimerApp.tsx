"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  pause as pauseEngine,
  remainingSeconds,
  reset as resetEngine,
  resume as resumeEngine,
  start as startEngine,
  syncState,
} from "@/lib/timerEngine";
import { Settings, TimerPhase, WorkoutState, createIdleState } from "@/lib/types";
import {
  clearWorkout,
  loadSettings,
  loadWorkout,
  saveSettings,
  saveWorkout,
} from "@/lib/storage";
import { useSound } from "@/lib/useSound";
import { useWakeLock } from "@/lib/useWakeLock";
import ConfigScreen from "./ConfigScreen";
import ActiveScreen from "./ActiveScreen";
import CompleteScreen from "./CompleteScreen";

const REFRESH_MS = 200; // display refresh only — never the timing source of truth

export default function TimerApp() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [state, setState] = useState<WorkoutState>(() => createIdleState(settings));
  const [remaining, setRemaining] = useState(0);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const sound = useSound();
  const wakeLock = useWakeLock();

  const prevPhaseRef = useRef<TimerPhase>("IDLE");
  const lastCountdownSecondRef = useRef<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- Hydration: restore settings + any in-progress workout, then
  // immediately fast-forward the clock in case time passed while closed. ----
  useEffect(() => {
    const restoredSettings = loadSettings();
    setSettings(restoredSettings);

    const restored = loadWorkout();
    if (restored) {
      const caught = syncState(restored, Date.now());
      setState(caught);
      prevPhaseRef.current = caught.phase;
    }
    setFullscreenSupported(
      typeof document !== "undefined" &&
        (document.documentElement.requestFullscreen !== undefined ||
          (document as any).webkitRequestFullscreen !== undefined)
    );
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTransitionCues = useCallback(
    (prevPhase: TimerPhase, next: WorkoutState) => {
      if (!next.settings.soundOn) return;
      if (next.phase !== prevPhase) {
        if (next.phase === "EXERCISE") sound.play("exercise");
        else if (next.phase === "REST") sound.play("rest");
        else if (next.phase === "COMPLETE") sound.play("complete");
      }
    },
    [sound]
  );

  const applySync = useCallback(
    (now: number) => {
      setState((prev) => {
        if (!prev.isRunning || prev.isPaused) return prev;
        const prevPhase = prev.phase;
        const next = syncState(prev, now);
        if (next !== prev) {
          playTransitionCues(prevPhase, next);
          saveWorkout(next);
          if (next.phase === "COMPLETE") {
            wakeLock.release();
            lastCountdownSecondRef.current = null;
          }
        }
        return next;
      });
    },
    [playTransitionCues, wakeLock]
  );

  // ---- Refresh loop: purely a display tick. All correctness comes from
  // syncState()/remainingSeconds() re-reading Date.now() each call. ----
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      applySync(now);
      setRemaining(remainingSeconds(stateRef.current, now));
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [hydrated, applySync]);

  // ---- The authoritative recovery hook: whenever the tab becomes visible
  // again (screen unlocked, app resumed from background), resync instantly
  // rather than waiting for the next interval tick. ----
  useEffect(() => {
    const syncTimerWithClock = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        applySync(now);
        setRemaining(remainingSeconds(stateRef.current, now));
      }
    };
    document.addEventListener("visibilitychange", syncTimerWithClock);
    window.addEventListener("focus", syncTimerWithClock);
    window.addEventListener("pageshow", syncTimerWithClock);
    return () => {
      document.removeEventListener("visibilitychange", syncTimerWithClock);
      window.removeEventListener("focus", syncTimerWithClock);
      window.removeEventListener("pageshow", syncTimerWithClock);
    };
  }, [applySync]);

  // ---- Countdown tick sound, once per whole second in the final 3 sec. ----
  useEffect(() => {
    if (
      state.settings.countdownOn &&
      state.settings.soundOn &&
      state.isRunning &&
      !state.isPaused &&
      remaining > 0 &&
      remaining <= 3 &&
      lastCountdownSecondRef.current !== remaining
    ) {
      lastCountdownSecondRef.current = remaining;
      sound.play("tick");
    }
    if (remaining > 3) lastCountdownSecondRef.current = null;
  }, [remaining, state.settings.countdownOn, state.settings.soundOn, state.isRunning, state.isPaused, sound]);

  const handleSettingsChange = useCallback((next: Settings) => {
    setSettings(next);
    saveSettings(next);
  }, []);

  const handleStart = useCallback(() => {
    sound.unlock();
    const now = Date.now();
    const next = startEngine(settings, now);
    prevPhaseRef.current = next.phase;
    setState(next);
    setRemaining(remainingSeconds(next, now));
    saveWorkout(next);
    wakeLock.request();
    if (settings.soundOn) sound.play("exercise");
  }, [settings, sound, wakeLock]);

  const handlePauseResume = useCallback(() => {
    const now = Date.now();
    setState((prev) => {
      const next = prev.isPaused ? resumeEngine(prev, now) : pauseEngine(prev, now);
      saveWorkout(next);
      if (next.isPaused) wakeLock.release();
      else wakeLock.request();
      setRemaining(remainingSeconds(next, now));
      return next;
    });
  }, [wakeLock]);

  const handleReset = useCallback(() => {
    const next = resetEngine(settings);
    setState(next);
    setRemaining(0);
    clearWorkout();
    wakeLock.release();
    lastCountdownSecondRef.current = null;
  }, [settings, wakeLock]);

  const handleStartAgain = useCallback(() => {
    handleStart();
  }, [handleStart]);

  const handleFullscreen = useCallback(() => {
    const el = document.documentElement as any;
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  }, []);

  if (!hydrated) {
    return <div className="min-h-dvh bg-ink" />;
  }

  if (state.phase === "IDLE") {
    return (
      <ConfigScreen
        settings={settings}
        onChange={handleSettingsChange}
        onStart={handleStart}
      />
    );
  }

  if (state.phase === "COMPLETE") {
    return (
      <CompleteScreen
        totalRounds={state.totalRounds}
        onStartAgain={handleStartAgain}
        onChangeSettings={handleReset}
      />
    );
  }

  return (
    <ActiveScreen
      state={state}
      remaining={remaining}
      onPauseResume={handlePauseResume}
      onReset={handleReset}
      onFullscreen={handleFullscreen}
      fullscreenSupported={fullscreenSupported}
    />
  );
}
