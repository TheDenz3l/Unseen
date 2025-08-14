/**
 * Integration tests for the full analysis pipeline
 */

import { useAnalysisStore } from '../state/useAnalysisStore_minimal';

describe('Analysis Pipeline Integration', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAnalysisStore.setState({
      currentAnalysis: null,
      currentSuggestions: [],
      currentFeatures: null,
      analysisHistory: [],
      lastAnalysisTime: 0,
    });
  });

  test('analyzes simple message successfully', async () => {
    const testMessage = "Hey, want to grab dinner tonight?";
    
    await useAnalysisStore.getState().analyzeConversation(testMessage);
    
    // Get fresh state after analysis
    const { currentAnalysis, currentSuggestions } = useAnalysisStore.getState();
    
    expect(currentAnalysis).toBeTruthy();
    expect(currentAnalysis?.bucket).toMatch(/^(Likely|Uncertain|Unlikely)$/);
    expect(currentAnalysis?.prob).toBeGreaterThanOrEqual(0);
    expect(currentAnalysis?.prob).toBeLessThanOrEqual(1);
    expect(currentAnalysis?.recommendation).toMatch(/^(send|wait)$/);
    expect(currentAnalysis?.reasons).toHaveLength(3);
    
    expect(currentSuggestions).toHaveLength(3);
    expect(currentSuggestions[0].tone).toBe('Short & Playful');
    expect(currentSuggestions[1].tone).toBe('Direct & Concise');
    expect(currentSuggestions[2].tone).toBe('Warm & Curious');
  });

  test('handles multi-line conversation', async () => {
    const testConversation = `them: Thanks for tonight!
me: Had such a great time
me: We should do it again soon`;
    
    await useAnalysisStore.getState().analyzeConversation(testConversation);
    
    const { currentAnalysis } = useAnalysisStore.getState();
    
    expect(currentAnalysis).toBeTruthy();
    // Should mention multiple messages - look for the actual reason text
    expect(currentAnalysis?.reasons.some(reason => reason.includes('message'))).toBeTruthy();
  });

  test('stores analysis in history', async () => {
    const testMessage = "Test message for history";
    
    await useAnalysisStore.getState().analyzeConversation(testMessage);
    
    const history = useAnalysisStore.getState().getHistory();
    
    expect(history).toHaveLength(1);
    expect(history[0].originalText).toBe(testMessage);
    expect(history[0].analysis).toBeTruthy();
    expect(history[0].suggestions).toHaveLength(3);
    expect(history[0].timestamp).toBeCloseTo(Date.now(), -3); // Within 1 second
  });

  test('performance is under 700ms', async () => {
    const testMessage = "This is a reasonably long message to test performance with some complexity and multiple sentences that might slow things down.";
    
    const startTime = performance.now();
    await useAnalysisStore.getState().analyzeConversation(testMessage);
    const endTime = performance.now();
    
    const analysisTime = endTime - startTime;
    const { lastAnalysisTime } = useAnalysisStore.getState();
    
    expect(analysisTime).toBeLessThan(700); // PRD requirement
    expect(lastAnalysisTime).toBeLessThan(700);
  });

  test('handles edge cases gracefully', async () => {
    // Test empty string
    await expect(useAnalysisStore.getState().analyzeConversation("")).rejects.toThrow();
    
    // Test very long message
    const longMessage = "a".repeat(1000);
    await expect(useAnalysisStore.getState().analyzeConversation(longMessage)).resolves.not.toThrow();
    
    // Test special characters
    const specialMessage = "Hey! 😊 What's up??? 🤔";
    await expect(useAnalysisStore.getState().analyzeConversation(specialMessage)).resolves.not.toThrow();
  });

  test('clearing analysis works', async () => {
    await useAnalysisStore.getState().analyzeConversation("Test message");
    
    let { currentAnalysis } = useAnalysisStore.getState();
    expect(currentAnalysis).toBeTruthy();
    
    useAnalysisStore.getState().clearCurrentAnalysis();
    
    const clearedState = useAnalysisStore.getState();
    expect(clearedState.currentAnalysis).toBeNull();
    expect(clearedState.currentSuggestions).toHaveLength(0);
    expect(clearedState.currentFeatures).toBeNull();
  });
});
