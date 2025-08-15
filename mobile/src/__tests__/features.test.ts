/**
 * Tests for the analysis feature extraction
 */

import { extractFeatures, Conversation, Message } from '../analysis/features';

describe('Feature Extraction', () => {
  const mockNow = 1692123456789; // Fixed timestamp for consistent tests
  
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('extracts features from single message conversation', () => {
    const conversation: Conversation = {
      messages: [{
        author: 'you',
        text: 'Hey, how are you?',
        timestamp: mockNow - (2 * 60 * 60 * 1000), // 2 hours ago
      }]
    };

    const features = extractFeatures(conversation);
    
    expect(features.minsSinceLastMsg).toBe(120); // 2 hours in minutes
    expect(features.isQuestion).toBe(1); // Contains '?'
    expect(features.msgLen).toBe(17); // Length of "Hey, how are you?"
    expect(features.chaseCount).toBe(1); // You spoke last
    expect(features.whoSpokeLast).toBe(0); // You spoke last (0)
    expect(features.doubleQuestion).toBe(0); // Only one question mark
  });

  test('extracts features showing chase behavior', () => {
    const conversation: Conversation = {
      messages: [
        {
          author: 'them',
          text: 'Thanks for dinner!',
          timestamp: mockNow - (24 * 60 * 60 * 1000), // 24 hours ago
        },
        {
          author: 'you',
          text: 'Had a great time',
          timestamp: mockNow - (6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
          author: 'you',
          text: 'Want to do it again?',
          timestamp: mockNow - (2 * 60 * 60 * 1000), // 2 hours ago
        }
      ]
    };

    const features = extractFeatures(conversation);
    
    expect(features.chaseCount).toBe(2); // Two consecutive messages from you
    expect(features.whoSpokeLast).toBe(0); // You spoke last
    expect(features.minsSinceLastMsg).toBe(120); // 2 hours since last message
    expect(features.isQuestion).toBe(1); // Last message has question
  });

  test('detects double questions', () => {
    const conversation: Conversation = {
      messages: [{
        author: 'you',
        text: 'Are you free tonight? What time works??',
        timestamp: mockNow - (30 * 60 * 1000), // 30 minutes ago
      }]
    };

    const features = extractFeatures(conversation);
    
    expect(features.doubleQuestion).toBe(1); // Multiple question marks
    expect(features.isQuestion).toBe(1);
  });

  test('calculates sentiment correctly', () => {
    const positiveConversation: Conversation = {
      messages: [{
        author: 'you',
        text: 'That sounds great! I love that idea!',
        timestamp: mockNow - (60 * 1000),
      }]
    };

    const negativeConversation: Conversation = {
      messages: [{
        author: 'you',
        text: 'I hate when that happens...',
        timestamp: mockNow - (60 * 1000),
      }]
    };

    const positiveFeatures = extractFeatures(positiveConversation);
    const negativeFeatures = extractFeatures(negativeConversation);
    
    expect(positiveFeatures.sentiment).toBeGreaterThan(0);
    expect(negativeFeatures.sentiment).toBeLessThan(0);
  });

  test('handles empty conversation gracefully', () => {
    const emptyConversation: Conversation = { messages: [] };
    
    const features = extractFeatures(emptyConversation);
    
    expect(features.minsSinceLastMsg).toBe(0);
    expect(features.chaseCount).toBe(1); // Default assumption
    expect(features.msgLen).toBe(0);
  });

  test('calculates hour and weekday bias', () => {
    // Mock a specific date/time for consistent testing
    const specificTime = new Date('2024-01-15T20:00:00'); // Monday 8PM
    jest.spyOn(global.Date, 'now').mockReturnValue(specificTime.getTime());

    const conversation: Conversation = {
      messages: [{
        author: 'you',
        text: 'Test message',
        timestamp: specificTime.getTime() - 60000,
      }]
    };

    const features = extractFeatures(conversation);
    
    // 8PM should have positive hour bias (good texting time)
    expect(features.hourOfDayBias).toBeGreaterThan(0);
    // Monday should have slight negative weekday bias
    expect(features.weekdayBias).toBeLessThanOrEqual(0);
  });
});
