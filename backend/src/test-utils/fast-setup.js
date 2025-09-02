// Minimal test setup for fast unit tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Silence console completely
global.console = {
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
  debug: () => {}
};

// Mock all external dependencies
jest.mock('@supabase/supabase-js', () => ({}));
jest.mock('express', () => ({}));
jest.mock('jsonwebtoken', () => ({}));
jest.mock('bcrypt', () => ({}));

// Mock specific modules that cause issues
jest.mock('../utils/supabase', () => ({
  supabase: {},
  testConnection: () => Promise.resolve(true)
}));

// Fast timeout
jest.setTimeout(1000);