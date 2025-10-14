# E2E Tests with Playwright

This directory contains end-to-end tests for critical application flows.

## Test Coverage

### QR Resolver Tests (`qr-resolver.spec.ts`)
- ✅ Unauthenticated users redirect to login with next parameter
- ✅ Authenticated users land directly on target page
- ✅ Expired QR codes show error message
- ✅ Both batch and blend QR flows tested

### Print Labels Tests (`print-labels.spec.ts`)
- ✅ Labels render in grid layout
- ✅ QR codes rendered as crisp SVG (not raster)
- ✅ Print media styles applied correctly
- ✅ Batch and blend modes supported
- ✅ Loading states handled

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/qr-resolver.spec.ts

# Run with UI
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Generate report
npx playwright show-report
```

## CI Integration

Tests automatically run on:
- Pull requests
- Main branch commits

Failed tests block merge.

## Writing New Tests

1. Create `*.spec.ts` file in `e2e/` directory
2. Import from `@playwright/test`
3. Use descriptive test names
4. Add to CI workflow if needed

## Debugging

```bash
# Debug specific test
npx playwright test --debug e2e/qr-resolver.spec.ts

# Record test actions
npx playwright codegen http://localhost:8080
```

## Screenshots

Screenshots on failure are saved to `test-results/` directory.
Print snapshot baseline is in `e2e/screenshots/`.
