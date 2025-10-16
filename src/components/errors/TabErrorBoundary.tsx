import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TabErrorBoundaryProps {
  children: ReactNode;
  tabName: string;
  onReset?: () => void;
}

/**
 * Tab-level Error Boundary
 * 
 * Catches errors within a specific tab while keeping other tabs functional
 * Shows tab-specific error message
 */
export const TabErrorBoundary: React.FC<TabErrorBoundaryProps> = ({ 
  children, 
  tabName,
  onReset 
}) => {
  return (
    <BaseErrorBoundary
      level="tab"
      fallback={(error, errorInfo, reset) => (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-warning/10 rounded-full">
                <Layers className="h-10 w-10 text-warning" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">
                Error in {tabName}
              </h3>
              <p className="text-muted-foreground">
                This tab encountered an issue, but other sections of the app should still work.
                You can try reloading this tab or switch to another section.
              </p>
            </div>

            {import.meta.env.DEV && (
              <div className="text-left text-sm p-3 bg-muted rounded">
                <p className="font-semibold mb-1">Error:</p>
                <p className="font-mono text-xs text-destructive">{error.message}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => {
                  reset();
                  onReset?.();
                }}
              >
                Reload {tabName}
              </Button>
            </div>
          </Card>
        </div>
      )}
      onError={(error, errorInfo) => {
        console.error(`Tab "${tabName}" error:`, error, errorInfo);
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
};
