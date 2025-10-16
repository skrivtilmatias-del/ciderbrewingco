# Error Boundary System

Comprehensive error handling for CiderTracker with specialized boundaries for different parts of the application.

## Components

### BaseErrorBoundary
The foundation error boundary component that catches React errors at any level.

**Features:**
- Development mode shows full error details with stack traces
- Production mode shows user-friendly messages
- Error logging to console and monitoring services
- Unique error IDs for support tracking
- Reset and report functionality
- Customizable fallback UI

**Usage:**
```tsx
import { BaseErrorBoundary } from '@/components/errors';

<BaseErrorBoundary 
  level="root|tab|component"
  onError={(error, errorInfo) => {
    // Custom error handler
  }}
>
  <YourComponent />
</BaseErrorBoundary>
```

### TabErrorBoundary
Specialized boundary for tab-level errors. Catches errors within a tab while keeping other tabs functional.

**Usage:**
```tsx
import { TabErrorBoundary } from '@/components/errors';

<TabErrorBoundary 
  tabName="Production"
  onReset={() => {
    // Optional: Custom reset logic
  }}
>
  <ProductionTab />
</TabErrorBoundary>
```

### QueryErrorBoundary
Integrates with React Query for data fetching errors. Shows retry UI and resets query state.

**Usage:**
```tsx
import { QueryErrorBoundary } from '@/components/errors';

<QueryErrorBoundary>
  <DataComponent />
</QueryErrorBoundary>
```

### FormErrorBoundary
Specialized for form errors. Attempts to preserve user input and shows inline error messages.

**Usage:**
```tsx
import { FormErrorBoundary } from '@/components/errors';

<FormErrorBoundary formName="New Batch">
  <BatchForm />
</FormErrorBoundary>
```

## Error Boundary Hierarchy

The app uses a three-level error boundary system:

1. **Root Level** - Wraps the entire app
   - Catches catastrophic errors
   - Shows full-page error UI
   - Offers page reload

2. **Tab Level** - Wraps each tab
   - Isolates tab errors
   - Other tabs remain functional
   - Tab-specific error messages

3. **Component Level** - Wraps critical components
   - Fine-grained error handling
   - Minimal UI disruption
   - Component-specific recovery

## Integration with Monitoring

To integrate with error monitoring services (Sentry, LogRocket, etc.):

```tsx
// In BaseErrorBoundary.tsx
logToMonitoringService = (error, errorInfo, errorId) => {
  if (window.Sentry) {
    window.Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          errorId,
        },
      },
    });
  }
};
```

## Best Practices

1. **Use appropriate boundary levels**
   - Root: App-wide critical components
   - Tab: Individual tab content
   - Component: Isolated features

2. **Provide meaningful error context**
   - Include component names
   - Add user context when available
   - Include relevant state information

3. **Test error boundaries**
   - Throw test errors in development
   - Verify error UI renders correctly
   - Test reset functionality

4. **Don't overuse**
   - Not every component needs a boundary
   - Group related components
   - Balance between isolation and complexity

## Development vs Production

**Development Mode:**
- Shows full error stack traces
- Component stacks visible
- Detailed error information
- Console warnings enabled

**Production Mode:**
- User-friendly error messages
- Error details hidden
- Silent fallbacks
- Error tracking enabled

## Future Enhancements

- [ ] Automatic error recovery attempts
- [ ] Error analytics dashboard
- [ ] User feedback integration
- [ ] A/B testing error UIs
- [ ] Smart error categorization
- [ ] Automatic error reporting
