import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Manages flash messages with automatic dismiss and proper cleanup.
 * Prevents memory leaks from unmanaged setTimeout on unmount.
 */
export function useFlashMessage(delay = 3000) {
  const [flash, setFlash] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash(message);
    timerRef.current = setTimeout(() => setFlash(''), delay);
  }, [delay]);

  const clearFlash = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFlash('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { flash, showFlash, clearFlash };
}
