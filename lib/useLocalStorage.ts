'use client';

import { useSyncExternalStore } from 'react';
import { NYIRIRA_STORAGE_EVENT } from './storage';

function subscribe(onStoreChange: () => void): () => void {
  const handleNative = (event: StorageEvent) => {
    // React on any cross-tab change (event.key === null means 'clear()').
    if (event.key === null || event.key.startsWith('nyirira_')) {
      onStoreChange();
    }
  };
  const handleLocal = () => onStoreChange();

  window.addEventListener('storage', handleNative);
  window.addEventListener(NYIRIRA_STORAGE_EVENT, handleLocal);

  return () => {
    window.removeEventListener('storage', handleNative);
    window.removeEventListener(NYIRIRA_STORAGE_EVENT, handleLocal);
  };
}

/**
 * Subscribe to a raw localStorage value for a `nyirira_`-prefixed key.
 *
 * Built on useSyncExternalStore, which is React's supported way to read
 * external stores like localStorage during SSR:
 * - `getServerSnapshot` returns null on the server, so the server HTML and the
 *   hydration render always match (no hydration mismatch).
 * - After hydration React re-checks `getSnapshot` and transparently re-renders
 *   with the client value.
 *
 * Returns the raw string (or null); parse with the helpers in storage.ts.
 */
export function useLocalStorageValue(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null
  );
}
