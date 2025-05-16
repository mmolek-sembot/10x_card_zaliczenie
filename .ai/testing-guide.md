# 10xCard Testing Guide

This document provides comprehensive guidance on testing the 10xCard application.

## Testing Stack

Our testing strategy follows a comprehensive approach with multiple layers:

### Unit Testing
- **Vitest**: Primary test runner and assertion library
- **React Testing Library**: For testing React components
- **Jest DOM**: For DOM-specific assertions
- **JSdom**: Simulates a browser environment for testing

### E2E Testing
- **Playwright**: Main tool for E2E tests across multiple browsers
- Support for cross-browser testing (Chrome, Firefox, Safari)
- Support for mobile device testing

## Directory Structure

```
10x_card_zaliczenie/
├── src/
│   ├── __tests__/              # Unit tests
│   │   ├── components/         # Component tests
│   │   └── ...                 # Other unit tests by domain
├── e2e/                        # E2E tests
├── test/                       # Test setup and helpers
├── vitest.config.ts           # Vitest configuration
└── playwright.config.ts       # Playwright configuration
```

## Running Tests

The following npm scripts are available for testing:

```bash
# Unit Tests
npm run test           # Run all unit tests
npm run test:watch     # Run tests in watch mode for development
npm run test:ui        # Run tests with UI visualization
npm run test:coverage  # Run tests with coverage report

# E2E Tests
npm run test:e2e       # Run all E2E tests
npm run test:e2e:ui    # Run E2E tests with visual UI
```

## Writing Unit Tests

### Component Tests

Component tests should be placed in `src/__tests__/components/` with the naming convention `ComponentName.test.tsx`.

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    const mockFn = vi.fn();
    render(<MyComponent onClick={mockFn} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});
```

### Utility Tests

Utility tests should be placed in `src/__tests__/` with the naming convention `utility.test.ts`.

```typescript
import { describe, it, expect } from 'vitest';
import { myUtility } from '@/lib/utilities';

describe('myUtility', () => {
  it('returns expected output for valid input', () => {
    expect(myUtility('valid input')).toBe('expected output');
  });
  
  it('handles edge cases', () => {
    expect(myUtility('')).toBe('default value');
  });
});
```

### Testing Hooks

Custom React hooks should be tested using `@testing-library/react-hooks`:

```tsx
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '@/components/hooks/useMyHook';

describe('useMyHook', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('default');
  });
  
  it('updates value when action is called', () => {
    const { result } = renderHook(() => useMyHook());
    act(() => {
      result.current.updateValue('new value');
    });
    expect(result.current.value).toBe('new value');
  });
});
```

## Mocking Supabase

The testing environment includes a mock setup for Supabase. The mock is configured in `/test/setup.ts`.

To use the mock in your tests:

```tsx
import { vi } from 'vitest';
import { createSupabaseClient } from '@/db/supabase.client';

// The mock is automatically applied based on the setup
// You can customize the mock implementation for specific tests:
vi.mocked(createSupabaseClient).mockImplementation(() => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } }),
    // Other custom auth methods
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    // Custom query chain implementation
    // ...
  })),
}));
```

## Writing E2E Tests

E2E tests should be placed in the `/e2e` directory with the naming convention `feature.spec.ts`.

```typescript
import { test, expect } from '@playwright/test';

test('user can create a flashcard', async ({ page }) => {
  // Navigate to the create page
  await page.goto('/create');
  
  // Fill out the flashcard form
  await page.fill('[name="title"]', 'Test Flashcard');
  await page.fill('[name="content"]', 'Test Content');
  
  // Submit the form
  await page.click('button[type="submit"]');
  
  // Verify the flashcard was created
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.flashcard-title')).toHaveText('Test Flashcard');
});
```

## Best Practices

### Following Vitest Guidelines

- Use `describe` to group related tests
- Use `vi.fn()` for function mocks
- Use `vi.spyOn()` to monitor existing functions
- Use `vi.mock()` for module mocks
- Reset mocks after each test with `vi.resetAllMocks()`

### Test Isolation

- Each test should be independent and not rely on the state from other tests
- Use `beforeEach` and `afterEach` for setup and teardown
- Use `vi.restoreAllMocks()` to restore original implementations

### Accessibility Testing

- Test for ARIA attributes and semantic HTML
- Verify keyboard navigation works as expected
- Use Playwright's accessibility testing capabilities

## Continuous Integration

Tests are automatically run as part of the CI/CD pipeline configured in GitHub Actions.

## Test Coverage

Run `npm run test:coverage` to generate a coverage report. The report will be available in the `/coverage` directory.

## Resources

- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
