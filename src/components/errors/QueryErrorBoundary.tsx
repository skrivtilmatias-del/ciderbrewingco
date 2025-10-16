import React, { ReactNode } from 'react';
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QueryErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Query-specific Error Boundary
 * 
 * Integrates with React Query's error reset functionality
 * Shows retry UI for failed queries
 */
export const QueryErrorBoundary: React.FC<QueryErrorBoundaryProps> = ({ children }) => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <BaseErrorBoundary
          level="component"
          fallback={(error, errorInfo, resetBoundary) => (
            <div className="min-h-[300px] flex items-center justify-center p-4">
              <Card className="max-w-md w-full p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 bg-destructive/10 rounded-full">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Failed to Load Data
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    There was a problem fetching the data. This might be a temporary network issue.
                  </p>
                </div>

                {import.meta.env.DEV && (
                  <div className="text-left text-xs p-2 bg-muted rounded font-mono">
                    {error.message}
                  </div>
                )}

                <Button 
                  onClick={() => {
                    reset();
                    resetBoundary();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </Card>
            </div>
          )}
          onError={(error, errorInfo) => {
            console.error('Query error:', error, errorInfo);
          }}
        >
          {children}
        </BaseErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};
