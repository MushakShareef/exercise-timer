# Interval — Exercise Timer

A mobile-first exercise/rest interval timer built with Next.js (App Router),
React, TypeScript, and Tailwind. Installable as an Android PWA, works fully
offline after the first load, and keeps correct time even if the screen
locks or the tab is backgrounded.

## Run it

```bash
npm install
npm run dev       # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start
```

## Deploy (so you can install it on a phone)

The Wake Lock API, Service Worker install, and Add-to-Home-Screen prompt on
Android all require **HTTPS** (or `localhost`). The easiest path:

1. Push this folder to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new) (zero config needed —
   it's a standard Next.js app) — or run `npx vercel` from this folder.
3. Open the deployed URL on your Android phone in Chrome → menu → **Install
   app** / **Add to Home screen**.

You can also self-host with `npm run build && npm run start` behind any
reverse proxy that terminates TLS.

## How the timer stays correct through screen sleep

This is the part most timer apps get wrong, so it's worth calling out where
to look:

- **`lib/timerEngine.ts`** — the entire timing model. Nothing here uses a
  `setInterval` counter as ground truth. Every phase is defined purely by
  absolute `phaseStartedAt` / `phaseEndsAt` timestamps, and `syncState(state,
  now)` recomputes the correct phase/round from scratch given any `now`. If
  the screen was off for 50 seconds and three phases should have elapsed,
  `syncState` walks through all three in a loop — it never just "resumes"
  the last known phase.
- **`components/TimerApp.tsx`** — wires that engine to the UI. A `setInterval`
  every 200ms calls `syncState` purely to refresh the display, and
  `visibilitychange` / `focus` / `pageshow` listeners call it again
  immediately when the app wakes up, so you're not stuck watching a stale
  number until the next tick.
- Pausing freezes a `pausedRemainingMs` snapshot rather than leaving stale
  timestamps around; resuming re-anchors `phaseStartedAt`/`phaseEndsAt` to
  the current time.

## Project structure

```
app/                 Next.js App Router entry (layout, page, global CSS)
components/          ConfigScreen, ActiveScreen, CompleteScreen, TimerApp
lib/
  timerEngine.ts      Pure timestamp-based state machine (start/pause/resume/reset/sync)
  types.ts            Settings + WorkoutState shape
  storage.ts          localStorage persistence (settings + in-progress workout)
  useWakeLock.ts       Screen Wake Lock wrapper (best-effort, never load-bearing)
  useSound.ts          WebAudio beep cues, unlocked on the Start tap
public/
  manifest.webmanifest PWA manifest
  sw.js                 Service worker (cache-first, offline after first load)
  icons/                192/512 regular + maskable icons
```

## Notes

- Exercise minimum is 1 second, rest minimum is 0 seconds (0 = skip straight
  to the next round), rounds minimum is 1 — all enforced by the steppers in
  `ConfigScreen`.
- Sound is optional and only initializes its `AudioContext` after the Start
  tap, respecting mobile autoplay restrictions.
- Wake Lock, Fullscreen, and Service Worker registration all fail silently
  and gracefully on unsupported browsers — the timer itself never depends
  on any of them.
