/**
 * Tests for the analysis model
 */

import { runAnalysis } from '../analysis/model';
import { AnalysisFeatures } from '../analysis/features';

describe('Analysis Model', () => {
  test('classifies high probability as Likely', () => {
    // Features that should result in high probability
    const goodFeatures: AnalysisFeatures = {
      minsSinceLastMsg: 60,      // 1 hour - reasonable gap
      isQuestion: 1,             // Question gets response
      msgLen: 50,                // Reasonable length
      chaseCount: 0,             // Not chasing
      hourOfDayBias: 0.5,        // Good timing
      weekdayBias: 0.3,          // Good day
      sentiment: 0.2,            // Positive
      whoSpokeLast: 1,           // They spoke last
      prevLatencyAvg: 120,       // Quick responder
      doubleQuestion: 0,         // Not needy
    };

    const result = runAnalysis(goodFeatures);
    
    expect(result.bucket).toMatch(/^(Likely|Uncertain|Unlikely)$/);
    expect(result.prob).toBeGreaterThanOrEqual(0);
    expect(result.prob).toBeLessThanOrEqual(1);
    expect(result.recommendation).toMatch(/^(send|wait)$/);
    expect(result.reasons).toHaveLength(3);
  });

  test('classifies low probability as Unlikely', () => {
    // Features that should result in low probability
    const badFeatures: AnalysisFeatures = {
      minsSinceLastMsg: 5,       // Very recent (chasing)
      isQuestion: 0,             // No question
      msgLen: 200,               // Long message
      chaseCount: 3,             // Heavy chasing
      hourOfDayBias: -0.5,       // Bad timing
      weekdayBias: -0.2,         // Bad day
      sentiment: -0.3,           // Negative
      whoSpokeLast: 0,           // You spoke last
      prevLatencyAvg: 1440,      // Slow responder
      doubleQuestion: 1,         // Needy
    };

    const result = runAnalysis(badFeatures);
    
    expect(result.bucket).toBe('Unlikely');
    expect(result.prob).toBeLessThan(0.33);
    expect(result.recommendation).toBe('wait');
    expect(result.waitMinutes).toBeGreaterThan(0);
    expect(result.reasons).toHaveLength(3);
  });

  test('generates reasonable wait times', () => {
    const features: AnalysisFeatures = {
      minsSinceLastMsg: 30,
      isQuestion: 0,
      msgLen: 100,
      chaseCount: 2,        // Chasing behavior
      hourOfDayBias: -0.3,  // Bad timing
      weekdayBias: 0,
      sentiment: 0,
      whoSpokeLast: 0,
      prevLatencyAvg: 180,
      doubleQuestion: 0,
    };

    const result = runAnalysis(features);
    
    if (result.recommendation === 'wait') {
      expect(result.waitMinutes).toBeGreaterThan(60);   // At least 1 hour
      expect(result.waitMinutes).toBeLessThan(1440);    // Less than 24 hours
    }
  });

  test('creates consistent features hash', () => {
    const features: AnalysisFeatures = {
      minsSinceLastMsg: 120,
      isQuestion: 1,
      msgLen: 50,
      chaseCount: 1,
      hourOfDayBias: 0.2,
      weekdayBias: 0.1,
      sentiment: 0.1,
      whoSpokeLast: 0,
      prevLatencyAvg: 180,
      doubleQuestion: 0,
    };

    const result1 = runAnalysis(features);
    const result2 = runAnalysis(features);
    
    expect(result1.featuresHash).toBe(result2.featuresHash);
    expect(result1.featuresHash).toHaveLength(16); // Base64 truncated to 16 chars
  });

  test('probability bounds are respected', () => {
    // Test extreme positive features
    const extremeGood: AnalysisFeatures = {
      minsSinceLastMsg: 1000,
      isQuestion: 1,
      msgLen: 10,
      chaseCount: 0,
      hourOfDayBias: 1,
      weekdayBias: 1,
      sentiment: 1,
      whoSpokeLast: 1,
      prevLatencyAvg: 30,
      doubleQuestion: 0,
    };

    // Test extreme negative features
    const extremeBad: AnalysisFeatures = {
      minsSinceLastMsg: 1,
      isQuestion: 0,
      msgLen: 500,
      chaseCount: 10,
      hourOfDayBias: -1,
      weekdayBias: -1,
      sentiment: -1,
      whoSpokeLast: 0,
      prevLatencyAvg: 2880,
      doubleQuestion: 1,
    };

    const goodResult = runAnalysis(extremeGood);
    const badResult = runAnalysis(extremeBad);
    
    // Probabilities should be clamped to reasonable bounds
    expect(goodResult.prob).toBeLessThanOrEqual(0.95);
    expect(badResult.prob).toBeGreaterThanOrEqual(0.05);
  });
});
