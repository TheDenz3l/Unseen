import { mockDatabase } from './mockDatabase';

describe('Persistence', () => {
  beforeEach(async () => {
    // Initialize mock database for each test
    await mockDatabase.init();
    // Clear all data to ensure clean state
    await mockDatabase.deleteAllData();
  });

  afterAll(async () => {
    // Clean up database connection
    await mockDatabase.close();
  });

  describe('Database Operations', () => {
    test('should create and retrieve analysis', async () => {
      const analysisData = {
        id: 'test-analysis-1',
        threadId: 'test-thread-1',
        featuresHash: 'hash123',
        prob: 0.75,
        bucket: 'Likely',
        recommendation: 'send',
        reasons: ['Good timing', 'Positive sentiment'],
        suggestions: ['Great job!', 'Well done!'],
      };

      await mockDatabase.createAnalysis(analysisData);
      const analyses = await mockDatabase.getRecentAnalyses(10);
      
      expect(analyses).toHaveLength(1);
      expect(analyses[0].id).toBe(analysisData.id);
      expect(analyses[0].prob).toBe(0.75);
      expect(analyses[0].bucket).toBe('Likely');
      expect(analyses[0].reasons).toEqual(['Good timing', 'Positive sentiment']);
    });

    test('should log outcome and update analysis', async () => {
      const analysisData = {
        id: 'test-analysis-2',
        threadId: 'test-thread-2',
        featuresHash: 'hash456',
        prob: 0.65,
        bucket: 'Uncertain',
        recommendation: 'wait;120',
        reasons: ['Late timing'],
        suggestions: [],
      };

      await mockDatabase.createAnalysis(analysisData);
      await mockDatabase.logOutcome(analysisData.id, true, 45);
      
      const analyses = await mockDatabase.getRecentAnalyses();
      const analysis = analyses.find(a => a.id === analysisData.id);
      
      expect(analysis?.outcome).toBeDefined();
      expect(analysis?.outcome.gotReply).toBe(true);
      expect(analysis?.outcome.latencyMinutes).toBe(45);
    });

    test('should handle contact creation', async () => {
      const contactHash = 'contact123';
      const displayHint = 'John Doe';
      
      const contactId = await mockDatabase.getOrCreateContact(contactHash, displayHint);
      expect(contactId).toBe(contactHash);
      
      // Creating again should return same ID
      const sameContactId = await mockDatabase.getOrCreateContact(contactHash);
      expect(sameContactId).toBe(contactHash);
    });

    test('should delete all data', async () => {
      // Create some test data
      await mockDatabase.createAnalysis({
        id: 'test-analysis-3',
        threadId: 'test-thread-3',
        featuresHash: 'hash789',
        prob: 0.5,
        bucket: 'Uncertain',
        recommendation: 'send',
        reasons: ['Test reason'],
        suggestions: [],
      });

      // Verify data exists
      let analyses = await mockDatabase.getRecentAnalyses();
      expect(analyses.length).toBeGreaterThan(0);

      // Delete all data
      await mockDatabase.deleteAllData();

      // Verify data is gone
      analyses = await mockDatabase.getRecentAnalyses();
      expect(analyses).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    test('should load recent analyses quickly', async () => {
      // Create multiple analyses
      const promises = Array.from({ length: 25 }, (_, i) => 
        mockDatabase.createAnalysis({
          id: `perf-test-${i}`,
          threadId: `thread-${i}`,
          featuresHash: `hash-${i}`,
          prob: Math.random(),
          bucket: 'Uncertain',
          recommendation: 'send',
          reasons: [`Reason ${i}`],
          suggestions: [],
        })
      );
      
      await Promise.all(promises);

      // Time the retrieval
      const startTime = performance.now();
      const analyses = await mockDatabase.getRecentAnalyses(20);
      const endTime = performance.now();
      
      expect(analyses).toHaveLength(20); // Should limit to 20
      expect(endTime - startTime).toBeLessThan(50); // Should be very fast for mock
    });
  });
});
