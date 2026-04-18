import { useState, useRef, useCallback } from 'react';
import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

// --- Constants (per-second, converted to per-tick at runtime) ---

const FRAME_RATE = 20;
const TICK_MS = 1000 / FRAME_RATE;
/** Floor velocity (chars/s). */
const MIN_VELOCITY_S = 80;
/** Max chars released per second. */
const MAX_VELOCITY_S = 600;
/** Velocity gain per second while backlog > BREAKING_POINT. */
const ACCELERATION_S = 120;
/** Velocity loss per second while backlog <= BREAKING_POINT. */
const DECELERATION_S = 10;
/** Backlog threshold that switches between acceleration and deceleration. */
const BREAKING_POINT = 75;

// Per-tick derived values
const MIN_VELOCITY = MIN_VELOCITY_S / FRAME_RATE;
const MAX_VELOCITY = MAX_VELOCITY_S / FRAME_RATE;
const ACCELERATION = ACCELERATION_S / FRAME_RATE;
const DECELERATION = DECELERATION_S / FRAME_RATE;

export interface OutputThrottle {
  /** Total number of characters approved for display. */
  visibleChars: number;
  /** Call when new characters arrive (increases backlog). */
  addChars: (n: number) => void;
  /** Returns a promise that resolves when the backlog is fully drained. */
  waitForDrain: () => Promise<void>;
  /** Reset all state (call when a new execution starts). */
  reset: () => void;
}

/**
 * React hook that smooths streaming output delivery.
 *
 * Characters accumulate in a backlog and are released at a velocity
 * that ramps up with acceleration and decelerates when the backlog
 * drains below BREAKING_POINT.
 */
const CSV_PATH = join(process.cwd(), 'throttle-debug.csv');

export function useOutputThrottle(): OutputThrottle {
  const [visibleChars, setVisibleChars] = useState(0);

  // Mutable state lives in a ref so the interval callback always
  // sees current values without needing to restart the timer.
  const state = useRef({
    backlog: 0,
    velocity: MIN_VELOCITY,
    timer: null as ReturnType<typeof setInterval> | null,
    t0: 0,
    tick: 0,
    drainResolve: null as (() => void) | null,
  });

  const startTimer = useCallback(() => {
    if (state.current.timer) return;
    state.current.t0 = Date.now();
    state.current.tick = 0;
    writeFileSync(CSV_PATH, 'tick,time_ms,backlog,velocity,drain,visible_chars\n');
    state.current.timer = setInterval(() => {
      const s = state.current;
      s.tick++;

      // Accelerate or decelerate
      if (s.backlog > BREAKING_POINT) {
        s.velocity += ACCELERATION;
      } else {
        s.velocity -= DECELERATION;
      }
      s.velocity = Math.max(MIN_VELOCITY, Math.min(MAX_VELOCITY, s.velocity));

      // Drain
      const drain = Math.min(s.velocity, s.backlog);
      s.backlog -= drain;
      setVisibleChars(prev => {
        const next = prev + drain;
        appendFileSync(CSV_PATH, `${s.tick},${Date.now() - s.t0},${s.backlog.toFixed(2)},${s.velocity.toFixed(2)},${drain.toFixed(2)},${next.toFixed(2)}\n`);
        return next;
      });

      // Stop when empty
      if (s.backlog <= 0) {
        s.backlog = 0;
        s.velocity = MIN_VELOCITY;
        if (s.timer) {
          clearInterval(s.timer);
          s.timer = null;
        }
        if (s.drainResolve) {
          s.drainResolve();
          s.drainResolve = null;
        }
      }
    }, TICK_MS);
  }, []);

  const addChars = useCallback((n: number) => {
    if (n <= 0) return;
    state.current.backlog += n;
    startTimer();
  }, [startTimer]);

  const waitForDrain = useCallback((): Promise<void> => {
    if (state.current.backlog <= 0 && !state.current.timer) return Promise.resolve();
    return new Promise(resolve => { state.current.drainResolve = resolve; });
  }, []);

  const reset = useCallback(() => {
    const s = state.current;
    if (s.timer) {
      clearInterval(s.timer);
      s.timer = null;
    }
    s.backlog = 0;
    s.velocity = MIN_VELOCITY;
    setVisibleChars(0);
  }, []);

  return { visibleChars, addChars, waitForDrain, reset };
}
