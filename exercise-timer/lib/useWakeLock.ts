import { useCallback, useEffect, useRef } from "react";

/**
 * Wraps the Screen Wake Lock API. This is purely a UX enhancement to keep
 * the screen on while a workout runs — the timer engine (timerEngine.ts)
 * never depends on it and stays correct whether or not a lock is held.
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  const request = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        sentinelRef.current = await (navigator as any).wakeLock.request(
          "screen"
        );
      }
    } catch {
      // Unsupported, denied, or not allowed in this context — ignore.
      sentinelRef.current = null;
    }
  }, []);

  const release = useCallback(async () => {
    try {
      await sentinelRef.current?.release();
    } catch {
      // ignore
    } finally {
      sentinelRef.current = null;
    }
  }, []);

  // Re-acquire automatically if the tab regains visibility while a lock
  // was expected (the OS releases wake locks when a tab is hidden).
  useEffect(() => {
    return () => {
      sentinelRef.current?.release().catch(() => {});
    };
  }, []);

  return { request, release };
}
