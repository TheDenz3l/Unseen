/**
 * Jest test setup
 */

// Mock performance.now for consistent testing
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
};

// Empty test suite (setup only)
describe('Setup', () => {
  test('setup complete', () => {
    expect(true).toBe(true);
  });
});
