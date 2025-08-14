/**
 * Notification scheduling abstraction (Phase 5 - Outcome Nudge)
 * Minimal implementation without platform dependency for now.
 * Future: swap backend with expo-notifications when added.
 */

import { database } from '../storage/db';
// Attempt dynamic import of expo-notifications (will fail in tests / node env)
let ExpoNotifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoNotifications = require('expo-notifications');
} catch {}

// Outcome nudge delay (was 12h, product decision updated to 5h)
const TWELVE_HOURS_MS = 5 * 60 * 60 * 1000; // keeping identifier to avoid touching test helpers

interface SchedulerBackend {
  requestPermission(): Promise<boolean>;
  schedule(analysisId: string, fireDate: Date, title: string, body: string): Promise<string>; // returns notification id
  cancel(notificationId: string): Promise<void>;
}

// In-memory fallback backend (Jest-friendly / placeholder)
class InMemoryBackend implements SchedulerBackend {
  async requestPermission(): Promise<boolean> { return true; }
  async schedule(analysisId: string, fireDate: Date, title: string, body: string): Promise<string> {
    return `mem_${analysisId}`;
  }
  async cancel(_notificationId: string): Promise<void> { /* noop */ }
}

class ExpoBackend implements SchedulerBackend {
  async requestPermission(): Promise<boolean> {
    if (!ExpoNotifications) return false;
    const settings = await ExpoNotifications.getPermissionsAsync();
    if (settings.status !== 'granted') {
      const req = await ExpoNotifications.requestPermissionsAsync();
      if (req.status !== 'granted') return false;
    }
    return true;
  }
  async schedule(analysisId: string, fireDate: Date, title: string, body: string): Promise<string> {
    if (!ExpoNotifications) return `mem_${analysisId}`;
  // Updated trigger format per Expo SDK 53 deprecation warning
  const trigger = { type: 'date', date: fireDate } as const;
    const id = await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, data: { analysisId, kind: 'outcome_nudge' } },
      trigger,
    });
    return id;
  }
  async cancel(notificationId: string): Promise<void> {
    if (!ExpoNotifications) return; 
    await ExpoNotifications.cancelScheduledNotificationAsync(notificationId);
  }
}

let backend: SchedulerBackend = ExpoNotifications ? new ExpoBackend() : new InMemoryBackend();
let forceInMemory = false;

export function __forceInMemoryBackend() {
  forceInMemory = true;
  backend = new InMemoryBackend();
}
let permissionRequested = false;

// Internal mapping so we can cancel by analysisId quickly
const scheduled = new Map<string, { notificationId: string; fireTime: number }>();
// Track analyses currently in-flight (backend.schedule awaiting)
const pending = new Set<string>();
// Track cancellations that happened while schedule was pending
const cancelledDuringPending = new Set<string>();

export function __setSchedulerBackend(b: SchedulerBackend) { backend = b; }
export function __getScheduled() { return scheduled; }
export function __resetScheduler() { scheduled.clear(); pending.clear(); cancelledDuringPending.clear(); permissionRequested = false; }

export async function requestNotificationPermission(): Promise<boolean> {
  if (!permissionRequested) {
    permissionRequested = true;
    try {
  const granted = forceInMemory ? true : await backend.requestPermission();
      if (!granted) {
        console.log('[Notifications] Permission denied');
        return false;
      }
      console.log('[Notifications] Permission granted');
      return true;
    } catch (e) {
      console.warn('[Notifications] Permission request failed', e);
      return false;
    }
  }
  return true; // already requested (assume granted in placeholder)
}

export async function scheduleOutcomeNudge(analysisId: string, createdAt: number) {
  // Compute nominal fire time (12h after creation)
  let fireTime = createdAt + TWELVE_HOURS_MS;

  // Dev overrides (precedence: explicit delay > short flag)
  const g: any = globalThis as any;
  if (typeof g.__NUDGE_DEV_DELAY_MS === 'number' && g.__NUDGE_DEV_DELAY_MS > 0) {
    fireTime = Date.now() + g.__NUDGE_DEV_DELAY_MS;
    console.log(`[Notifications] Dev override delay ms = ${g.__NUDGE_DEV_DELAY_MS}`);
  } else if (g.__NUDGE_DEV_SHORT) {
    fireTime = Date.now() + 10_000; // 10 seconds
    console.log('[Notifications] Dev short mode (10s) active');
  }
  const now = Date.now();
  if (fireTime <= now) {
    // Skip scheduling if already past (edge case)
    return;
  }
  const permitted = await requestNotificationPermission();
  if (!permitted) return;
  if (scheduled.has(analysisId) || pending.has(analysisId)) return; // already scheduled or in-flight
  try {
    const fireDate = new Date(fireTime);
    pending.add(analysisId);
    const title = 'Did you get a reply?';
    const body = 'Log the outcome to improve future recommendations.';
    const id = await backend.schedule(analysisId, fireDate, title, body);
    pending.delete(analysisId);
    if (cancelledDuringPending.has(analysisId)) {
      // A cancel was requested while awaiting schedule -> do not persist
      cancelledDuringPending.delete(analysisId);
      return;
    }
    scheduled.set(analysisId, { notificationId: id, fireTime });
    // Persist
    await database.createNudge(analysisId, id, fireTime);
    console.log(`[Notifications] Scheduled nudge for ${analysisId} at ${fireDate.toISOString()}`);
  } catch (e) {
    pending.delete(analysisId);
    console.warn('[Notifications] Schedule failed', e);
  }
}

export async function cancelOutcomeNudge(analysisId: string) {
  const entry = scheduled.get(analysisId);
  if (!entry) {
    // If schedule still pending, mark for suppression
    if (pending.has(analysisId)) {
      cancelledDuringPending.add(analysisId);
    }
    return;
  }
  try {
    await backend.cancel(entry.notificationId);
    scheduled.delete(analysisId);
    await database.deleteNudge(analysisId);
    console.log(`[Notifications] Cancelled nudge for ${analysisId}`);
  } catch (e) {
    console.warn('[Notifications] Cancel failed', e);
  }
}

// Utility for tests / metrics
export function getScheduledCount() { return scheduled.size; }

export const _internal = { TWELVE_HOURS_MS, _pending: pending, _cancelledDuringPending: cancelledDuringPending };

// Restore any missing nudges after app start (idempotent)
export async function restorePendingNudges() {
  // Load existing persisted first to avoid duplicate scheduling on hot reloads
  const active = await database.getActiveNudges();
  for (const n of active) {
    if (!scheduled.has(n.analysis_id)) {
      scheduled.set(n.analysis_id, { notificationId: n.notification_id, fireTime: n.fire_time });
    }
  }
  // Then schedule any analyses that still need a nudge
  const now = Date.now();
  const needing = await database.getAnalysesNeedingNudges(now, TWELVE_HOURS_MS);
  for (const row of needing) {
    if (!scheduled.has(row.id) && !pending.has(row.id)) {
      await scheduleOutcomeNudge(row.id, row.created_at); // will compute fire time
    }
  }
}

export async function cancelAllNudges() {
  for (const [analysisId] of scheduled) {
    await cancelOutcomeNudge(analysisId);
  }
}
