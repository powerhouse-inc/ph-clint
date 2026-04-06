/**
 * Timing constants for process and routine tests.
 *
 * Shared between test fixtures (scripts) and test assertions so that
 * "fixture runs for X ms" and "test waits X + BUFFER ms" stay in sync.
 * All values in milliseconds.
 *
 * Plain JavaScript to avoid rootDir issues with ts-jest.
 */

// ── Fixture behaviour ─────────────────────────────────────────────

/** How long the controlled-duration script runs by default */
export const FIXTURE_RUN_DURATION = 300;

/** Interval between output lines in the streaming script */
export const FIXTURE_STREAM_INTERVAL = 20;

/** Time the graceful-shutdown script waits before exiting after SIGTERM */
export const FIXTURE_GRACEFUL_EXIT_DELAY = 50;

// ── Test timing ───────────────────────────────────────────────────

/** Extra buffer added on top of fixture durations to account for OS scheduling */
export const TEST_TIMING_BUFFER = 100;

/** Time to wait for a process to fully start (spawn + first output) */
export const PROCESS_START_WAIT = 200;

/** Time to wait after killing a process for cleanup */
export const PROCESS_CLEANUP_WAIT = 200;

/** Routine tick interval used in tests (kept short for speed) */
export const TEST_TICK_INTERVAL = 100;

/** Routine idle interval used in tests */
export const TEST_IDLE_INTERVAL = 50;

/** How long to let the routine run to observe at least one tick */
export const ROUTINE_ONE_TICK_WAIT = TEST_TICK_INTERVAL + TEST_TIMING_BUFFER;

/** How long to let the routine run to observe multiple ticks */
export const ROUTINE_MULTI_TICK_WAIT = TEST_TICK_INTERVAL * 3 + TEST_TIMING_BUFFER;

// ── Process manager test defaults ─────────────────────────────────

/** Short timeout used to test the timeout-kill path */
export const SHORT_TIMEOUT = 200;

/** Default timeout for process manager tests */
export const DEFAULT_TIMEOUT = 5_000;

/** Jest timeout for tests that spawn processes */
export const PROCESS_TEST_TIMEOUT = 10_000;
