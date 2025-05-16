// Import React Testing Library utilities
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock global objects if needed
vi.stubGlobal('matchMedia', () => ({
  matches: false,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();
});

// Setup mock for Supabase
vi.mock('../src/db/supabase.client', () => {
  return {
    createSupabaseClient: vi.fn(() => ({
      auth: {
        getSession: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        match: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      })),
    })),
  };
});
