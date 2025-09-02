module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  testMatch: [
    '**/__tests__/**/*.unit.test.js',
    '**/*.unit.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.js'],
  moduleDirectories: ['node_modules', 'src'],
  clearMocks: true,
  restoreMocks: true,
  // Performance optimizations
  maxWorkers: 1, // Use single worker for faster startup
  testTimeout: 2000, // 2 second timeout
  detectOpenHandles: false,
  forceExit: true,
  // Disable coverage for faster tests
  collectCoverage: false,
  // Skip slower integration tests by default
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.test\\.js$'
  ]
};