/**
 * Client-Side Logging & Performance Tracking Utility
 * Records application exceptions and metrics with visual output in development.
 */

import { notify } from './notifications';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'metric';
  message: string;
  context?: any;
}

export interface MetricEntry {
  timestamp: string;
  name: string;
  value: number; // millisecond duration, byte size, count, etc.
  tags?: Record<string, string>;
}

// In-memory queue of logs for runtime inspectability or debugging overlays
const logQueue: LogEntry[] = [];
const metricQueue: MetricEntry[] = [];
const MAX_LOGS = 200;

const activeMeasurements: Record<string, number> = {};

export const logger = {
  /**
   * Log information message
   */
  info: (message: string, context?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context,
    };
    logQueue.unshift(entry);
    if (logQueue.length > MAX_LOGS) logQueue.pop();

    console.log(`[INFO] ${message}`, context || '');
  },

  /**
   * Log warning message
   */
  warn: (message: string, context?: any) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context,
    };
    logQueue.unshift(entry);
    if (logQueue.length > MAX_LOGS) logQueue.pop();

    console.warn(`[WARN] ${message}`, context || '');
  },

  /**
   * Log errors with explicit logging payload
   */
  error: (error: Error | string | unknown, context?: any) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    // Guard against logging telemetry noise, access logs, or infinite telemetry loop feedback
    let contextStr = '';
    try {
      contextStr = typeof context === 'object' ? JSON.stringify(context) : String(context || '');
    } catch {
      contextStr = '';
    }
    const combinedLower = (message + ' ' + contextStr).toLowerCase();
    if (combinedLower.includes('/api/logs/error') ||
        combinedLower.includes('web-api') ||
        combinedLower.includes('telemetry') ||
        combinedLower.includes('http post /api/logs/error') ||
        combinedLower.includes('status 200') ||
        combinedLower.includes('status: 200') ||
        combinedLower.includes('globalexceptionlogger') ||
        combinedLower.includes('severity') ||
        combinedLower.includes('traceid') ||
        combinedLower.includes('spanid') ||
        combinedLower.includes('trace_id') ||
        combinedLower.includes('span_id')) {
      // Suppress sending backend error logs for telemetry feedback loops or HTTP access log messages
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      context: { ...context, stack },
    };
    logQueue.unshift(entry);
    if (logQueue.length > MAX_LOGS) logQueue.pop();

    console.error(`[ERROR] ${message}`, { context, stack });

    // Send the stack trace details to our backend centralized logging telemetry
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stack, context })
    }).catch(e => {
      // Fail silently to prevent recursive logging loops if backend is unreachable
      console.warn('[Logger Telemetry Bypass] Failed to submit stack trace to backend:', e);
    });
  },

  /**
   * Track client side performance metrics (e.g. rendering time, API latency)
   */
  metric: (name: string, value: number, tags?: Record<string, string>) => {
    const entry: MetricEntry = {
      timestamp: new Date().toISOString(),
      name,
      value,
      tags,
    };
    metricQueue.unshift(entry);
    if (metricQueue.length > MAX_LOGS) metricQueue.pop();

    console.log(`[METRIC] ${name}: ${value.toFixed(2)}ms`, tags || '');

    // High priority alert for API latency exceeding 3 seconds (3000ms)
    if (name.startsWith('api-latency-') && value > 3000) {
      const modelName = tags?.model || name.replace('api-latency-', '');
      notify.error(
        `🚨 High Latency alert: API response for '${modelName}' took ${(value / 1000).toFixed(1)}s (exceeded 3s threshold)`,
        undefined,
        'Performance'
      );
    }
  },

  /**
   * Begin timing a specific user workflow or rendering transaction
   */
  startMeasure: (name: string) => {
    activeMeasurements[name] = performance.now();
  },

  /**
   * Conclude timing of a measurement and report the metric automatically
   */
  endMeasure: (name: string, tags?: Record<string, string>) => {
    const startTime = activeMeasurements[name];
    if (startTime === undefined) {
      return;
    }
    const duration = performance.now() - startTime;
    delete activeMeasurements[name];
    logger.metric(name, duration, tags);
  },

  /**
   * Retrieve in-memory log history
   */
  getLogs: () => [...logQueue],

  /**
   * Retrieve cached metrics
   */
  getMetrics: () => [...metricQueue],

  /**
   * Clear logs and metrics
   */
  clear: () => {
    logQueue.length = 0;
    metricQueue.length = 0;
  }
};
