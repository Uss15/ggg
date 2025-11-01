# Testing Guide

## Overview

The SFEP project includes automated testing using Vitest, a fast unit test framework for Vite projects.

## Running Tests

### Prerequisites

All testing dependencies are already installed:
- `vitest` - Test runner
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Custom matchers
- `jsdom` - Browser environment simulation
- `@vitest/ui` - Visual test UI

### Test Commands

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

Then run:

```bash
# Run tests in watch mode
npm run test

# Run tests with visual UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests

Located in `src/**/__tests__/` directories:

- **StatusBadge.test.tsx** - Tests evidence status badge rendering
- **validation.test.ts** - Tests coordinate, file type, and filename validation
- **file-hash.test.ts** - Tests SHA-256 file hashing functionality

### Test Setup

The test environment is configured in:
- `vitest.config.ts` - Test configuration
- `src/test/setup.ts` - Global test setup and mocks

## Writing Tests

### Example Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { container } = render(<MyComponent />);
    expect(container.textContent).toContain('Expected Text');
  });
});
```

### Example Utility Test

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myFunction', () => {
  it('returns expected result', () => {
    expect(myFunction('input')).toBe('expected output');
  });

  it('throws on invalid input', () => {
    expect(() => myFunction(null)).toThrow('Invalid input');
  });
});
```

## Test Coverage

Current test coverage includes:
- ✅ StatusBadge component rendering
- ✅ GPS coordinate validation
- ✅ File type validation
- ✅ Filename sanitization
- ✅ File hash generation

### Areas for Additional Testing

Consider adding tests for:
- Chain of custody operations
- Evidence bag CRUD operations
- Case management workflows
- Authentication flows
- PDF report generation
- QR code generation

## Mocked Dependencies

The following are mocked in `src/test/setup.ts`:
- Supabase client
- `window.matchMedia` (for responsive tests)

## CI Integration

Tests are run automatically in the GitHub Actions CI pipeline:
- On push to `main` and `develop` branches
- On pull requests
- Before Docker build

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how
2. **Keep tests isolated** - Each test should be independent
3. **Use descriptive names** - Test names should clearly describe what is being tested
4. **Mock external dependencies** - Supabase, APIs, etc. should be mocked
5. **Test edge cases** - Include tests for error conditions and boundary values
6. **Maintain coverage** - Aim for >70% code coverage on critical modules

## Troubleshooting

### Tests not running
- Ensure all dependencies are installed: `npm install`
- Check that vitest is installed: `npm list vitest`

### Import errors
- Verify path aliases in `vitest.config.ts` match `tsconfig.json`
- Check that test files use correct import paths

### Mocking issues
- Review `src/test/setup.ts` for mock configuration
- Ensure mocks match the actual API interfaces

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
