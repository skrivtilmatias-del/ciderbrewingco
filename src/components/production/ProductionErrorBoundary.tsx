import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from '@/components/errors';
import { Activity, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ProductionErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Production-specific Error Boundary
 * 
 * Specialized error handling for production features
 * Provides context-aware error messages for batch operations
 */
export const ProductionErrorBoundary: React.FC<ProductionErrorBoundaryProps> = ({ children }) => {
  return (
    <BaseErrorBoundary
      level="component"
      fallback={(error, errorInfo, reset) => (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <Activity className="h-6 w-6 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Production Error</h3>
                <p className="text-sm text-muted-foreground">
                  There was a problem loading production data
                </p>
              </div>
            </div>

            {import.meta.env.DEV && (
              <div className="p-3 bg-muted rounded text-xs font-mono">
                {error.message}
              </div>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Possible causes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Network connection issue</li>
                <li>Invalid batch data</li>
                <li>Temporary server problem</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </Card>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error('[Production] Error:', error, errorInfo);
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
};
