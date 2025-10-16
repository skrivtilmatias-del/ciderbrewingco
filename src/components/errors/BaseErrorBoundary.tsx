import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  isolate?: boolean;
  level?: 'root' | 'tab' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * Base Error Boundary Component
 * 
 * Catches React errors and provides graceful fallback UI
 * Features:
 * - Development mode shows full error details
 * - Production mode shows user-friendly message
 * - Error logging to console/monitoring service
 * - Reset functionality
 * - Error reporting
 */
export class BaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Log error details
    console.error(`[ErrorBoundary ${level}] Error caught:`, {
      errorId,
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // TODO: Send to error monitoring service (Sentry, LogRocket, etc.)
    // this.logToMonitoringService(error, errorInfo, errorId);

    this.setState({ errorInfo });
  }

  logToMonitoringService = (error: Error, errorInfo: ErrorInfo, errorId: string | null) => {
    // Example integration with error monitoring
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: {
    //       react: {
    //         componentStack: errorInfo.componentStack,
    //         errorId,
    //       },
    //     },
    //   });
    // }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Prepare error details for reporting
    const errorDetails = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // TODO: Open feedback form or send to support
    console.log('Report issue:', errorDetails);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => alert('Error details copied to clipboard. Please paste in your bug report.'))
      .catch(() => alert('Failed to copy error details'));
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback, isolate, level = 'component' } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo!, this.handleReset);
      }

      const isDevelopment = import.meta.env.DEV;

      // Default error UI
      return (
        <div className={isolate ? '' : 'min-h-[400px] flex items-center justify-center p-4'}>
          <Card className="max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-destructive/10 rounded-full flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold">Oops! Something went wrong</h3>
                <p className="text-muted-foreground">
                  {level === 'root' 
                    ? 'The application encountered an error. Please try refreshing the page.'
                    : level === 'tab'
                    ? 'This section encountered an error. Other parts of the app should still work.'
                    : 'This component encountered an error. You can try again or continue using other features.'}
                </p>
              </div>
            </div>

            {/* Error ID for support */}
            {errorId && (
              <div className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                Error ID: {errorId}
              </div>
            )}

            {/* Development mode: Show error details */}
            {isDevelopment && (
              <Alert variant="destructive">
                <AlertTitle className="font-mono text-sm">
                  {error.name}: {error.message}
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold mb-2">
                      Error Stack
                    </summary>
                    <pre className="overflow-auto max-h-48 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                  {errorInfo?.componentStack && (
                    <details className="text-xs mt-2">
                      <summary className="cursor-pointer font-semibold mb-2">
                        Component Stack
                      </summary>
                      <pre className="overflow-auto max-h-48 whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReportIssue} className="gap-2">
                <Bug className="h-4 w-4" />
                Report Issue
              </Button>
              {level === 'root' && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return children;
  }
}
