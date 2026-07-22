import { useEffect, useRef } from 'react';
import { logger } from '../infrastructure/logger';
import { ToolType } from './types';

export const usePerformanceMonitor = (currentTool: ToolType) => {
  const previousToolRef = useRef<ToolType>(currentTool);
  const switchStartRef = useRef<number>(performance.now());

  // Detect when tool changes and set the starting measurement point
  useEffect(() => {
    if (previousToolRef.current !== currentTool) {
      previousToolRef.current = currentTool;
      switchStartRef.current = performance.now();
    }
  }, [currentTool]);

  // Log switching latency once the effect triggers after render and paint completes
  useEffect(() => {
    const end = performance.now();
    const duration = end - switchStartRef.current;
    
    // Log tool-switching latency to system metrics
    logger.metric(`navigate-${currentTool}`, duration, {
      tool: currentTool,
      source: 'usePerformanceMonitor'
    });

    // Capture standard Navigation Timing API metrics once on initial load
    try {
      const navigationEntries = window.performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navTiming = navigationEntries[0] as PerformanceNavigationTiming;
        
        // Log essential milestones from Navigation Timing API to the logger
        const dnsLookup = navTiming.domainLookupEnd - navTiming.domainLookupStart;
        const tcpConnect = navTiming.connectEnd - navTiming.connectStart;
        const domInteractive = navTiming.domInteractive;
        const loadEvent = navTiming.loadEventEnd - navTiming.loadEventStart;

        if (dnsLookup > 0) logger.metric('navigation-dns-lookup', dnsLookup);
        if (tcpConnect > 0) logger.metric('navigation-tcp-connect', tcpConnect);
        if (domInteractive > 0) logger.metric('navigation-dom-interactive', domInteractive);
        if (loadEvent > 0) logger.metric('navigation-load-event-duration', loadEvent);
        logger.metric('navigation-initial-load-duration', navTiming.duration);
      }
    } catch (e) {
      console.warn('[PerformanceMonitor] Navigation Timing API is not supported or failed:', e);
    }
  }, [currentTool]);
};
