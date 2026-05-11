import { jest } from '@jest/globals';
import type { ClintMetrics, ObservabilityHandle } from '../../src/observability/index.js';

/**
 * No-op metric instruments shaped like the OTel ones so callers under test can
 * assert `.add()` / `.record()` was called without booting the real SDK.
 */
export function createMockMetrics(): ClintMetrics {
  return {
    llmTokens: { add: jest.fn() } as unknown as ClintMetrics['llmTokens'],
    toolExecutions: { add: jest.fn() } as unknown as ClintMetrics['toolExecutions'],
    routineIterations: { add: jest.fn() } as unknown as ClintMetrics['routineIterations'],
    agentStreamDuration: { record: jest.fn() } as unknown as ClintMetrics['agentStreamDuration'],
  };
}

/**
 * Stub ObservabilityHandle suitable for unit tests that need to instantiate
 * AgentSetupContext / BootstrapResult without booting real telemetry.
 */
export function createMockObservability(): ObservabilityHandle {
  return {
    sentry: null,
    otel: null,
    metrics: createMockMetrics(),
    shutdown: async () => {},
  };
}
