import { generateFeaturesHash, extractFeatures } from '../analysis/features';

describe('Features Hash', () => {
  test('should generate consistent hash for same features', () => {
    const features = {
      minsSinceLastMsg: 30,
      isQuestion: 1,
      msgLen: 50,
      chaseCount: 1,
      hourOfDayBias: 0.5,
      weekdayBias: -0.2,
      sentiment: 0.3,
      whoSpokeLast: 1,
      prevLatencyAvg: 120,
      doubleQuestion: 0,
    };

    const hash1 = generateFeaturesHash(features);
    const hash2 = generateFeaturesHash(features);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(6); // Our simple hash should be base36
  });

  test('should generate different hashes for different features', () => {
    const features1 = {
      minsSinceLastMsg: 30,
      isQuestion: 1,
      msgLen: 50,
      chaseCount: 1,
      hourOfDayBias: 0.5,
      weekdayBias: -0.2,
      sentiment: 0.3,
      whoSpokeLast: 1,
      prevLatencyAvg: 120,
      doubleQuestion: 0,
    };

    const features2 = {
      ...features1,
      msgLen: 100, // Different length
    };

    const hash1 = generateFeaturesHash(features1);
    const hash2 = generateFeaturesHash(features2);

    expect(hash1).not.toBe(hash2);
  });

  test('should work with extracted features from conversation', () => {
    const conversation = {
      messages: [
        {
          author: 'you' as const,
          text: 'Hello there!',
          timestamp: Date.now() - 60000, // 1 minute ago
        },
      ],
    };

    const features = extractFeatures(conversation);
    const hash = generateFeaturesHash(features);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });
});
