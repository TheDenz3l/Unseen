import { mockDatabase } from './mockDatabase';

/**
 * History navigation logic unit: ensure we can retrieve by id after creation.
 * (UI navigation itself is React Navigation – here we verify data contract.)
 */

describe('History → Result data contract', () => {
  beforeEach(async () => {
    await mockDatabase.init();
    await mockDatabase.deleteAllData();
  });

  test('getAnalysisById returns created analysis', async () => {
    await mockDatabase.createAnalysis({
      id: 'nav-1',
      threadId: 't-1',
      featuresHash: 'fh1',
      prob: 0.42,
      bucket: 'Uncertain',
      recommendation: 'wait;120',
      reasons: ['Reason one'],
      suggestions: ['Suggestion one']
    });

    const item = await mockDatabase.getAnalysisById('nav-1');
    expect(item).toBeTruthy();
    expect(item?.id).toBe('nav-1');
    expect(item?.bucket).toBe('Uncertain');
  });

  test('getAnalysisById returns null for missing', async () => {
    const item = await mockDatabase.getAnalysisById('does-not-exist');
    expect(item).toBeNull();
  });
});
