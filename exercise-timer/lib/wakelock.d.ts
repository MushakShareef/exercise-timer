export {};

declare global {
  interface WakeLockSentinel extends EventTarget {
    released: boolean;
    type: "screen";
    release(): Promise<void>;
  }
}
