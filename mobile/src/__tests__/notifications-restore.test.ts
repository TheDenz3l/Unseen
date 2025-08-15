import { __resetScheduler, __getScheduled, restorePendingNudges, scheduleOutcomeNudge, _internal, __forceInMemoryBackend } from '../notifications/scheduler';
import { mockDatabase } from './mockDatabase';
import * as realDb from '../storage/db';

// Patch the exported database instance to use mock for this test only
const originalDatabase = (realDb as any).database;
(realDb as any).database = mockDatabase;

describe('notification restore', () => {
  beforeEach(async () => {
    __resetScheduler();
    __forceInMemoryBackend();
    await mockDatabase.deleteAllData();
  });

  afterAll(() => {
    (realDb as any).database = originalDatabase;
  });

  test('restores unscheduled analysis nudges', async () => {
    // Create an analysis manually via mock DB
    const now = Date.now();
    await mockDatabase.createAnalysis({
      id: 'restore_1',
      threadId: 't1',
      featuresHash: 'fh',
      prob: 0.5,
      bucket: 'Uncertain',
      recommendation: 'wait;10',
      reasons: ['r1'],
      suggestions: [],
    });
    // It is new, no nudge yet
    expect(__getScheduled().size).toBe(0);
    await restorePendingNudges();
    expect(__getScheduled().size).toBe(1);
  });

  test('skips analyses past 12h window', async () => {
    const old = Date.now() - _internal.TWELVE_HOURS_MS - 1000;
    await mockDatabase.createAnalysis({
      id: 'old_analysis',
      threadId: 't2',
      featuresHash: 'fh2',
      prob: 0.4,
      bucket: 'Uncertain',
      recommendation: 'wait;5',
      reasons: ['r1'],
      suggestions: [],
      createdAt: old,
    });
    await restorePendingNudges();
    // Should not schedule
    expect(__getScheduled().has('old_analysis')).toBe(false);
  });

  test('does not duplicate existing nudges', async () => {
    const now = Date.now();
    await mockDatabase.createAnalysis({
      id: 'dup_analysis',
      threadId: 't3',
      featuresHash: 'fh3',
      prob: 0.6,
      bucket: 'Likely',
      recommendation: 'send',
      reasons: ['r1'],
      suggestions: [],
      createdAt: now,
    });
    await scheduleOutcomeNudge('dup_analysis', now);
    const sizeBefore = __getScheduled().size;
    await restorePendingNudges();
    expect(__getScheduled().size).toBe(sizeBefore);
  });

  test('restore loads persisted first then schedules missing (no duplicate)', async () => {
    const now = Date.now();
    // Create two analyses; schedule one manually, leave other unscheduled
    await mockDatabase.createAnalysis({
      id: 'already_scheduled',
      threadId: 't4',
      featuresHash: 'fh4',
      prob: 0.7,
      bucket: 'Likely',
      recommendation: 'send',
      reasons: ['r1'],
      suggestions: [],
      createdAt: now,
    });
    await mockDatabase.createAnalysis({
      id: 'needs_schedule',
      threadId: 't5',
      featuresHash: 'fh5',
      prob: 0.2,
      bucket: 'Unlikely',
      recommendation: 'wait;15',
      reasons: ['r1'],
      suggestions: [],
      createdAt: now,
    });
    await scheduleOutcomeNudge('already_scheduled', now);
    const pre = __getScheduled().size;
    await restorePendingNudges();
    // One new schedule should have been added
    expect(__getScheduled().size).toBe(pre + 1);
    // No duplicate for already scheduled
    const ids = Array.from(__getScheduled().keys());
    expect(ids.includes('already_scheduled')).toBe(true);
    expect(ids.includes('needs_schedule')).toBe(true);
  });
});
