/**
 * Ranktica AI - Centralized Global Exception Logger
 * src/shared/GlobalExceptionLogger.ts
 * 
 * Hooks into window.onerror and unhandledrejection events to:
 * 1. Propagate errors to the console (preserving original behavior).
 * 2. Submit high-priority diagnostics to the server-side telemetry endpoint.
 * 3. Log user-facing incidents into local persistent activity logs.
 * 4. Record trace spans and user actions in the Telemetry system.
 */

import { logger } from '../infrastructure/logger';
import { logActivity } from './activityLogger';
import { TelemetryEngine } from './telemetry/TelemetrySystem';

declare global {
  interface Window {
    __global_exception_logger_initialized__?: boolean;
  }
}

function isBenignOrTelemetryError(reason: any): boolean {
  if (!reason) return false;

  // Safe circular-aware stringification to prevent throwing on self-referential or host objects
  const seen = new Set();
  const safeStringify = (val: any): string => {
    try {
      return JSON.stringify(val, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });
    } catch {
      try {
        const parts: string[] = [];
        for (const k in val) {
          try {
            parts.push(`${k}:${String(val[k])}`);
          } catch {}
        }
        return parts.join(' ');
      } catch {
        return String(val);
      }
    }
  };

  try {
    let rawStr = '';
    if (typeof reason === 'string') {
      rawStr = reason;
    } else if (reason instanceof Error || (reason && typeof reason === 'object' && ('message' in reason || 'stack' in reason))) {
      rawStr = (reason.message || '') + ' ' + (reason.stack || '') + ' ' + (reason.name || '') + ' ' + String(reason);
    } else if (typeof reason === 'object') {
      rawStr = safeStringify(reason) + ' ' + String(reason);
    } else {
      rawStr = String(reason);
    }
    const rawLower = rawStr.toLowerCase();
    if (rawLower.includes('/api/logs/error') || 
        rawLower.includes('telemetry') || 
        rawLower.includes('globalexceptionlogger') ||
        rawLower.includes('web-api') ||
        rawLower.includes('http post /api/logs/error') ||
        rawLower.includes('severity') ||
        rawLower.includes('traceid') ||
        rawLower.includes('spanid') ||
        rawLower.includes('latencyms') ||
        rawLower.includes('durationms') ||
        rawLower.includes('latency_ms') ||
        rawLower.includes('trace_id') ||
        rawLower.includes('span_id') ||
        rawLower.includes('status 200') ||
        rawLower.includes('status: 200') ||
        rawLower.includes('success: true') ||
        rawLower.includes('service_name') ||
        rawLower.includes('execution_time_ms')) {
      return true;
    }
  } catch (e) {}

  const scannedStrings: string[] = [];

  function collectStrings(obj: any, depth = 0) {
    if (depth > 5 || !obj) return;
    
    try {
      if (typeof obj === 'string') {
        scannedStrings.push(obj);
        const trimmed = obj.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed);
            collectStrings(parsed, depth + 1);
          } catch {
            // ignore JSON parse error
          }
        }
        return;
      }
      
      if (typeof obj === 'number' || typeof obj === 'boolean') {
        scannedStrings.push(String(obj));
        return;
      }

      if (typeof obj === 'object') {
        // Try to safely stringify or get common properties
        try {
          if ('message' in obj && obj.message) {
            scannedStrings.push(String(obj.message));
            const trimmedMsg = String(obj.message).trim();
            if (trimmedMsg.startsWith('{') || trimmedMsg.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmedMsg);
                collectStrings(parsed, depth + 1);
              } catch {}
            }
          }
        } catch (e) {}

        try {
          if ('stack' in obj && obj.stack) {
            scannedStrings.push(String(obj.stack));
          }
        } catch (e) {}

        try {
          if ('name' in obj && obj.name) {
            scannedStrings.push(String(obj.name));
          }
        } catch (e) {}

        try {
          if ('reason' in obj && obj.reason) {
            if (typeof obj.reason === 'string') {
              scannedStrings.push(obj.reason);
            } else {
              collectStrings(obj.reason, depth + 1);
            }
          }
        } catch (e) {}

        // Safely loop keys of the object
        let keys: string[] = [];
        try {
          keys = Object.keys(obj);
        } catch (e) {
          // If Object.keys fails (e.g. for some host objects), try for-in
          try {
            for (const k in obj) {
              keys.push(k);
            }
          } catch (e2) {}
        }

        for (const key of keys) {
          try {
            const val = obj[key];
            if (typeof val === 'string') {
              scannedStrings.push(val);
              const trimmedVal = val.trim();
              if (trimmedVal.startsWith('{') || trimmedVal.startsWith('[')) {
                try {
                  const parsed = JSON.parse(trimmedVal);
                  collectStrings(parsed, depth + 1);
                } catch {}
              }
            } else if (typeof val === 'number' || typeof val === 'boolean') {
              scannedStrings.push(String(val));
            } else if (typeof val === 'object' && val !== null) {
              collectStrings(val, depth + 1);
            }
          } catch (e) {
            // ignore property access error
          }
        }
      }
    } catch (outerErr) {
      // ignore
    }
  }

  // Collect from reason
  collectStrings(reason);

  // Also collect from String representation and JSON representation
  try {
    scannedStrings.push(String(reason));
  } catch {}

  try {
    if (typeof reason === 'object') {
      scannedStrings.push(JSON.stringify(reason));
    }
  } catch {}

  const unifiedText = scannedStrings.filter(Boolean).join(' ').toLowerCase();

  // Rules matching
  // 1. Prevent recursion/feedback loops from telemetry calls or exception logging system
  if (unifiedText.includes('/api/logs/error') || 
      unifiedText.includes('telemetry') || 
      unifiedText.includes('globalexceptionlogger') ||
      unifiedText.includes('web-api') ||
      unifiedText.includes('severity') ||
      unifiedText.includes('traceid') ||
      unifiedText.includes('spanid') ||
      unifiedText.includes('latencyms') ||
      unifiedText.includes('durationms') ||
      unifiedText.includes('trace_id') ||
      unifiedText.includes('span_id') ||
      unifiedText.includes('latency_ms') ||
      unifiedText.includes('status 200') ||
      unifiedText.includes('status: 200') ||
      unifiedText.includes('success: true') ||
      unifiedText.includes('service_name') ||
      unifiedText.includes('execution_time_ms')) {
    return true;
  }
  
  // 2. Filter out raw server/container/proxy log strings passed in sandboxed iframe rejections
  if (unifiedText.includes('web-api') && (unifiedText.includes('http post') || unifiedText.includes('status') || unifiedText.includes('status 200'))) {
    return true;
  }
  
  // 3. Filter out benign/standard browser noise or canceled/aborted fetches during page transition or iframe reset
  if (unifiedText.includes('abort') || 
      unifiedText.includes('failed to fetch') || 
      unifiedText.includes('networkerror') || 
      unifiedText.includes('resizeobserver') ||
      unifiedText.includes('scripterror') ||
      unifiedText.includes('cancelled') ||
      unifiedText.includes('canceled') ||
      unifiedText.includes('websocket') ||
      unifiedText.includes('ws://') ||
      unifiedText.includes('wss://') ||
      unifiedText.includes('vite') ||
      unifiedText.includes('audioworkermanager')) {
    return true;
  }

  // 4. Any other SRE logs or JSON log objects containing severity, trace, span, latency, or service
  if (unifiedText.includes('severity') || 
      unifiedText.includes('traceid') || 
      unifiedText.includes('spanid') || 
      unifiedText.includes('latencyms') || 
      (unifiedText.includes('service') && unifiedText.includes('timestamp'))) {
    return true;
  }

  return false;
}

// Module-level variables for telemetry rate-limiting Circuit Breaker
let errorCountInWindow = 0;
let windowStartTime = Date.now();
const MAX_ERRORS_PER_WINDOW = 5;
const WINDOW_DURATION_MS = 5000;

function checkCircuitBreaker(): boolean {
  const now = Date.now();
  if (now - windowStartTime > WINDOW_DURATION_MS) {
    windowStartTime = now;
    errorCountInWindow = 0;
  }
  
  if (errorCountInWindow >= MAX_ERRORS_PER_WINDOW) {
    console.warn('[Exception Logger] Circuit breaker tripped. Suppressing error log transmission to prevent telemetry loop cascade.');
    return false;
  }
  
  errorCountInWindow++;
  return true;
}

export function initGlobalExceptionLogger(): void {
  if (typeof window === 'undefined') return;

  // Prevent multiple initializations in HMR or re-renders
  if (window.__global_exception_logger_initialized__) {
    console.debug('[Exception Logger] Global Exception Logger is already active.');
    return;
  }

  window.__global_exception_logger_initialized__ = true;

  // Safe circular-aware stringifier for event-level checks
  const localSafeStringify = (val: any): string => {
    const seen = new Set();
    try {
      return JSON.stringify(val, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      });
    } catch {
      try {
        const parts: string[] = [];
        for (const k in val) {
          try { parts.push(`${k}:${String(val[k])}`); } catch {}
        }
        return parts.join(' ');
      } catch {
        return String(val);
      }
    }
  };

  // Cache existing onerror handler
  const originalOnError = window.onerror;

  // Intercept uncaught synchronous or asynchronous DOM/JS errors
  window.onerror = function (message, source, lineno, colno, error) {
    const errorMsg = message instanceof Event ? 'Event error triggered' : String(message);
    
    // Immediate pre-filter to prevent loops or unhandled telemetry capture
    try {
      let serializedErr = '';
      if (typeof error === 'string') {
        serializedErr = error;
      } else if (error instanceof Error || (error && typeof error === 'object' && ('message' in error || 'stack' in error))) {
        serializedErr = (error.message || '') + ' ' + (error.stack || '') + ' ' + (error.name || '') + ' ' + String(error);
      } else if (error && typeof error === 'object') {
        serializedErr = localSafeStringify(error) + ' ' + String(error);
      } else {
        serializedErr = String(error);
      }

      const errLower = serializedErr.toLowerCase();
      const msgStr = errorMsg.toLowerCase();
      
      if (msgStr.includes('/api/logs/error') || msgStr.includes('web-api') || msgStr.includes('telemetry') || msgStr.includes('http post /api/logs/error') ||
          errLower.includes('/api/logs/error') || errLower.includes('web-api') || errLower.includes('telemetry') || errLower.includes('http post /api/logs/error') ||
          errLower.includes('globalexceptionlogger') || errLower.includes('severity') || errLower.includes('traceid') || errLower.includes('spanid') ||
          errLower.includes('durationms') || errLower.includes('latencyms') || errLower.includes('trace_id') || errLower.includes('span_id') ||
          errLower.includes('status 200') || errLower.includes('status: 200') || errLower.includes('success: true') ||
          errLower.includes('service_name') || errLower.includes('execution_time_ms')) {
        if (originalOnError) {
          return originalOnError.apply(this, [message, source, lineno, colno, error]);
        }
        return false;
      }
    } catch (e) {}

    // Ignore benign sandbox logs, telemetry errors, or loop-generating events
    if (isBenignOrTelemetryError(error) || isBenignOrTelemetryError(errorMsg)) {
      if (originalOnError) {
        return originalOnError.apply(this, [message, source, lineno, colno, error]);
      }
      return false;
    }

    const fileName = String(source || 'Unknown Module');
    const line = lineno || 0;
    const col = colno || 0;
    const stackTrace = error instanceof Error ? error.stack : undefined;

    // 1. Send to server telemetry via logger.error (rate-limited by Circuit Breaker)
    if (checkCircuitBreaker()) {
      logger.error(error || errorMsg, {
        source: 'GlobalExceptionLogger:window.onerror',
        fileName,
        lineno: line,
        colno: col,
        stackTrace,
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    }

    // 2. Push to local persistent Activity Logs
    logActivity(
      `Centralized Engine Fault: "${errorMsg.substring(0, 80)}${errorMsg.length > 80 ? '...' : ''}" (at ${fileName}:${line}:${col})`,
      'Global Exception Logger',
      'system_error',
      'System'
    );

    // 3. Record failed trace span in Telemetry System
    try {
      const span = TelemetryEngine.startSpan('global:uncaught_exception', {
        attributes: {
          source: fileName,
          line,
          col,
          trigger: 'window.onerror'
        }
      });
      TelemetryEngine.endSpan(span, 'FAILURE', errorMsg, { stack: stackTrace });

      // 4. Record interaction telemetry user action
      TelemetryEngine.recordUserAction('uncaught_exception_detected', 'System', undefined, {
        message: errorMsg,
        source: fileName,
        line,
        col
      });
    } catch (telemetryErr) {
      console.warn('[Exception Logger] Failed to record telemetry:', telemetryErr);
    }

    // Call original handler if it exists
    if (originalOnError) {
      return originalOnError.apply(this, [message, source, lineno, colno, error]);
    }

    // Return false to let standard browser logging happen naturally
    return false;
  };

  // Intercept uncaught Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    try {
      const reason = event.reason;
      const errorMsg = reason instanceof Error ? reason.message : (reason ? String(reason) : 'Unhandled promise rejection');
      
      // Immediate pre-filter to prevent loops or unhandled telemetry capture
      let serialized = '';
      try {
        if (typeof reason === 'string') {
          serialized = reason;
        } else if (reason instanceof Error || (reason && typeof reason === 'object' && ('message' in reason || 'stack' in reason))) {
          serialized = (reason.message || '') + ' ' + (reason.stack || '') + ' ' + (reason.name || '') + ' ' + String(reason);
        } else if (reason && typeof reason === 'object') {
          serialized = localSafeStringify(reason) + ' ' + String(reason);
        } else {
          serialized = String(reason);
        }

        const serializedLower = serialized.toLowerCase();
        const msgStr = errorMsg.toLowerCase();

        if (msgStr.includes('/api/logs/error') || msgStr.includes('web-api') || msgStr.includes('telemetry') || msgStr.includes('http post /api/logs/error') ||
            serializedLower.includes('/api/logs/error') || serializedLower.includes('web-api') || serializedLower.includes('telemetry') || serializedLower.includes('http post /api/logs/error') ||
            serializedLower.includes('globalexceptionlogger') || serializedLower.includes('severity') || serializedLower.includes('traceid') || serializedLower.includes('spanid') ||
            serializedLower.includes('durationms') || serializedLower.includes('latencyms') || serializedLower.includes('trace_id') || serializedLower.includes('span_id') ||
            serializedLower.includes('status 200') || serializedLower.includes('status: 200') || serializedLower.includes('success: true') ||
            serializedLower.includes('service_name') || serializedLower.includes('execution_time_ms')) {
          return;
        }
      } catch (e) {}

      // Ignore benign sandbox logs, telemetry errors, or loop-generating events
      if (isBenignOrTelemetryError(reason) || isBenignOrTelemetryError(errorMsg) || isBenignOrTelemetryError(serialized)) {
        return;
      }

      const stackTrace = reason instanceof Error ? reason.stack : undefined;

      // 1. Send to server telemetry via logger.error (rate-limited by Circuit Breaker)
      if (checkCircuitBreaker()) {
        logger.error(reason || errorMsg, {
          source: 'GlobalExceptionLogger:unhandledrejection',
          stackTrace,
          url: window.location.href,
          userAgent: navigator.userAgent
        });
      }

      // 2. Push to local persistent Activity Logs
      logActivity(
        `Unhandled Promise Rejection: "${errorMsg.substring(0, 80)}${errorMsg.length > 80 ? '...' : ''}"`,
        'Global Exception Logger',
        'system_error',
        'System'
      );

      // 3. Record failed trace span in Telemetry System
      try {
        const span = TelemetryEngine.startSpan('global:unhandled_rejection', {
          attributes: {
            trigger: 'unhandledrejection'
          }
        });
        TelemetryEngine.endSpan(span, 'FAILURE', errorMsg, { stack: stackTrace });

        // 4. Record interaction telemetry user action
        TelemetryEngine.recordUserAction('unhandled_rejection_detected', 'System', undefined, {
          message: errorMsg,
          reason: typeof reason === 'object' ? 'Object rejection' : String(reason)
        });
      } catch (telemetryErr) {
        console.warn('[Exception Logger] Failed to record promise rejection telemetry:', telemetryErr);
      }
    } catch (outerErr) {
      console.warn('[Exception Logger] Error inside unhandledrejection event handler:', outerErr);
    }
  });

  console.log('[SYSTEM] Centralized Global Exception Logger initialized successfully.');
}
