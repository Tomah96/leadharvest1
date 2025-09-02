module.exports = {
  testEnvironment: 'node',
  // Only test essential unit tests
  testMatch: [
    '**/leadService.unit.test.js',
    '**/validation.unit.test.js',
    '**/parsers.unit.test.js'
  ],
  // Minimal setup
  setupFiles: ['<rootDir>/src/test-utils/fast-setup.js'],
  // Performance optimizations
  maxWorkers: 1,
  testTimeout: 1000,
  detectOpenHandles: false,
  forceExit: true,
  collectCoverage: false,
  // Don't load heavy modules
  modulePathIgnorePatterns: [
    '<rootDir>/src/utils/supabase.js',
    '<rootDir>/src/routes/',
    '<rootDir>/app.js'
  ],
  // Cache disabled for consistent timing
  cache: false
};