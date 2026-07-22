/**
 * Triggers lightweight haptic feedback on mobile devices using the browser Vibration API.
 * Safely handles environments where vibration is unsupported or disabled by iframe/sandbox constraints.
 */
export function triggerHapticFeedback(pattern: number | number[] = 10) {
  if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function') {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      console.warn('[Haptics] Vibration failed or blocked by frame sandbox:', e);
    }
  }
}
