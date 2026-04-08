import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import type { ServiceManager, ServiceInstanceStatus, ServiceDefinition } from '../core/types.js';

interface ServicePanelProps {
  services: ServiceManager;
  onExit: () => void;
  /** When set, scope the panel to a single service. */
  serviceId?: string;
}

type PanelView = 'list' | 'details' | 'logs';

function statusIcon(status: ServiceInstanceStatus['status']): string {
  return status === 'ready' ? '●' :
    status === 'starting' ? '◐' :
    status === 'failed' ? '✗' :
    status === 'stopping' ? '◑' : '○';
}

function statusColor(status: ServiceInstanceStatus['status']): string {
  return status === 'ready' ? 'green' :
    status === 'starting' ? 'yellow' :
    status === 'failed' ? 'red' : 'gray';
}

/**
 * Interactive service management panel for the REPL.
 * Shows service status, supports start/stop, log viewing, and detail inspection.
 */
export function ServicePanel({ services, onExit, serviceId }: ServicePanelProps) {
  const { stdout } = useStdout();
  const columns = stdout?.columns || 80;

  const [statuses, setStatuses] = useState(() => services.list(serviceId));
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<PanelView>('list');
  const [busy, setBusy] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [detailServiceId, setDetailServiceId] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Poll service statuses
  useEffect(() => {
    const timer = setInterval(() => {
      setStatuses(services.list(serviceId));
    }, 2000);
    return () => clearInterval(timer);
  }, [services]);

  // Cleanup log watcher on unmount
  useEffect(() => {
    return () => { cleanupRef.current?.(); };
  }, []);

  const openLogs = useCallback((svcId: string, instId: string) => {
    cleanupRef.current?.();
    const initial = services.logs(svcId, instId, 30).split('\n');
    setLogLines(initial);
    setDetailServiceId(svcId);
    setView('logs');
    const cleanup = services.watchLogs(svcId, instId, (line) => {
      setLogLines((prev) => [...prev.slice(-200), line]);
    });
    cleanupRef.current = cleanup;
  }, [services]);

  const closeSubview = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setLogLines([]);
    setDetailServiceId(null);
    setView('list');
    setStatuses(services.list(serviceId));
  }, [services]);

  const openDetails = useCallback((svcId: string) => {
    setDetailServiceId(svcId);
    setView('details');
  }, []);

  const toggleService = useCallback(async () => {
    const svc = statuses[selected];
    if (!svc || busy) return;

    if (svc.status === 'ready' || svc.status === 'starting') {
      setBusy(`Stopping ${svc.label}...`);
      try { await services.stop(svc.serviceId, svc.instanceId); } catch { /* ignore */ }
    } else {
      setBusy(`Starting ${svc.label}...`);
      try { await services.start(svc.serviceId); } catch { /* ignore */ }
    }
    setBusy(null);
    setStatuses(services.list(serviceId));
  }, [statuses, selected, busy, services]);

  useInput((ch, key) => {
    // Subviews: logs and details
    if (view === 'logs' || view === 'details') {
      if (key.escape || ch === 'q' || ch === 'Q') {
        closeSubview();
        return;
      }
      // In details view, allow 'l' to jump to logs
      if (view === 'details' && (ch === 'l' || ch === 'L') && detailServiceId) {
        // Find the instance to get its instanceId
        const inst = statuses.find((s) => s.serviceId === detailServiceId);
        if (inst) openLogs(detailServiceId, inst.instanceId);
        return;
      }
      return;
    }

    // List view
    if (key.escape || ch === 'q' || ch === 'Q') {
      onExit();
      return;
    }

    if (key.upArrow || ch === 'k') {
      setSelected((s) => Math.max(0, s - 1));
      return;
    }
    if (key.downArrow || ch === 'j') {
      setSelected((s) => Math.min(statuses.length - 1, s + 1));
      return;
    }

    if (key.return || ch === ' ') {
      toggleService();
      return;
    }

    if (ch === 'd' || ch === 'D') {
      const svc = statuses[selected];
      if (svc) openDetails(svc.serviceId);
      return;
    }

    if (ch === 'l' || ch === 'L') {
      const svc = statuses[selected];
      if (svc) openLogs(svc.serviceId, svc.instanceId);
      return;
    }

    if (ch === 'r' || ch === 'R') {
      setStatuses(services.list(serviceId));
      return;
    }
  });

  const hr = <Text color="green">{'─'.repeat(columns)}</Text>;

  // ── Details view ──
  if (view === 'details' && detailServiceId) {
    const svc = statuses.find((s) => s.serviceId === detailServiceId);
    const def = services.getDefinition(detailServiceId);

    // Readiness patterns from definition
    const patterns = def?.readiness?.patterns
      ?? (def?.readiness?.pattern ? [{ name: '_default', pattern: def.readiness.pattern, captures: def.readiness.captures }] : []);

    return (
      <Box flexDirection="column">
        {hr}
        <Box justifyContent="space-between">
          <Text bold color="cyan"> {svc?.label ?? detailServiceId} </Text>
          <Text dimColor> l logs  q/Esc back </Text>
        </Box>
        {hr}
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text><Text bold>ID:      </Text>{detailServiceId}</Text>
          <Text><Text bold>Status:  </Text><Text color={statusColor(svc?.status ?? 'idle')}>{statusIcon(svc?.status ?? 'idle')} {svc?.status ?? 'idle'}</Text></Text>
          <Text><Text bold>PID:     </Text>{svc?.pid ?? '—'}</Text>
          <Text><Text bold>Command: </Text>{typeof def?.command === 'function' ? '(dynamic)' : (def?.command ?? '—')}</Text>
          {def?.shutdown && (
            <Text><Text bold>Shutdown:</Text> {def.shutdown.signal} (timeout {def.shutdown.timeout}ms)</Text>
          )}
          {def?.restart?.enabled && (
            <Text><Text bold>Restart: </Text>enabled, max {def.restart.maxRetries} retries, {def.restart.delay}ms delay</Text>
          )}
          {svc?.error && (
            <Text><Text bold>Error:   </Text><Text color="red">{svc.error}</Text></Text>
          )}

          {/* Endpoints */}
          {svc?.endpoints && Object.keys(svc.endpoints).length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>Endpoints:</Text>
              {Object.entries(svc.endpoints).map(([k, v]) => (
                <Text key={k}>  {k}: {v}</Text>
              ))}
            </Box>
          )}

          {/* Readiness patterns */}
          {patterns.length > 0 && (
            <Box flexDirection="column" marginTop={1}>
              <Text bold>Readiness patterns{def?.readiness?.timeout ? ` (timeout ${def.readiness.timeout}ms)` : ''}:</Text>
              {patterns.map((p) => (
                <Box key={p.name} flexDirection="column">
                  <Text>  {p.name}: <Text dimColor>{p.pattern.source}</Text></Text>
                  {p.captures && Object.keys(p.captures).length > 0 && (
                    <Text dimColor>    captures: {Object.entries(p.captures).map(([k, v]) => `${k}→$${v}`).join(', ')}</Text>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Text>{''}</Text>
        {hr}
      </Box>
    );
  }

  // ── Log view ──
  if (view === 'logs' && detailServiceId) {
    const svc = statuses.find((s) => s.serviceId === detailServiceId);
    const visibleLines = logLines.slice(-20);
    return (
      <Box flexDirection="column">
        {hr}
        <Box justifyContent="space-between">
          <Text bold color="cyan"> Logs: {svc?.label ?? detailServiceId} </Text>
          <Text dimColor> q/Esc back </Text>
        </Box>
        {hr}
        <Box flexDirection="column" marginLeft={1} marginTop={1}>
          {visibleLines.map((line, i) => (
            <Text key={i} dimColor>{line}</Text>
          ))}
          {visibleLines.length === 0 && <Text dimColor>(no logs)</Text>}
        </Box>
      </Box>
    );
  }

  // ── List view ──
  return (
    <Box flexDirection="column">
      {hr}
      <Box justifyContent="space-between">
        <Text bold color="cyan"> Services </Text>
        <Text dimColor> ↑↓ select  Enter toggle  d details  l logs  r refresh  q close </Text>
      </Box>
      {hr}
      <Box flexDirection="column" marginTop={1} marginLeft={1}>
        {statuses.map((svc, i) => {
          const isSelected = i === selected;
          const icon = statusIcon(svc.status);
          const color = statusColor(svc.status);

          const epParts: string[] = [];
          if (svc.endpoints) {
            for (const [k, v] of Object.entries(svc.endpoints)) {
              epParts.push(`${k}=${v}`);
            }
          }

          return (
            <Box key={svc.instanceId}>
              <Text color={isSelected ? 'cyan' : undefined}>
                {isSelected ? '▸ ' : '  '}
              </Text>
              <Text color={color}>{icon} </Text>
              <Text bold={isSelected}>
                {svc.label.padEnd(24)}
              </Text>
              <Text dimColor> [{svc.status}]</Text>
              {svc.pid && <Text dimColor> pid {svc.pid}</Text>}
              {epParts.length > 0 && <Text dimColor> {epParts.join(' ')}</Text>}
              {svc.error && <Text color="red"> {svc.error}</Text>}
            </Box>
          );
        })}
      </Box>
      {busy && (
        <Box marginTop={1} marginLeft={1}>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text> {busy}</Text>
        </Box>
      )}
      <Text>{''}</Text>
      {hr}
    </Box>
  );
}
