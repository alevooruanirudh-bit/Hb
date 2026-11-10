import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Profile } from '@/db/db';
import { useSettings } from './settingsStore';

/**
 * Returns all profiles and the active one (live-updating from IndexedDB).
 * Falls back to the first profile if the stored active id no longer exists.
 */
export function useProfiles(): { profiles: Profile[] | undefined; active: Profile | undefined } {
  const activeId = useSettings((s) => s.activeProfileId);
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const active = profiles?.find((p) => p.id === activeId) ?? profiles?.[0];
  return { profiles, active };
}
