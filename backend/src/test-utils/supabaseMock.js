// Mock Supabase client for testing
const createMockSupabaseClient = () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis()
  };

  const mockSupabase = {
    from: jest.fn(() => mockQuery),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  };

  // Reset all query methods to return mockQuery for chaining
  Object.keys(mockQuery).forEach(method => {
    if (method !== 'from') {
      mockQuery[method].mockReturnValue(mockQuery);
    }
  });

  return { mockSupabase, mockQuery };
};

module.exports = { createMockSupabaseClient };