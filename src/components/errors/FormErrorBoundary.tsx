import React, { ReactNode } from 'react';
import { BaseErrorBoundary } from './BaseErrorBoundary';
import { FileWarning } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface FormErrorBoundaryProps {
  children: ReactNode;
  formName?: string;
}

/**
 * Form-specific Error Boundary
 * 
 * Catches form errors while preserving user input where possible
 * Shows user-friendly validation or submission error messages
 */
export const FormErrorBoundary: React.FC<FormErrorBoundaryProps> = ({ 
  children, 
  formName = 'form' 
}) => {
  return (
    <BaseErrorBoundary
      level="component"
      isolate
      fallback={(error, errorInfo, reset) => (
        <Alert variant="destructive" className="my-4">
          <FileWarning className="h-4 w-4" />
          <AlertTitle>Form Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              There was a problem with the {formName}. Your input has been preserved.
            </p>
            {import.meta.env.DEV && (
              <p className="text-xs font-mono">{error.message}</p>
            )}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={reset}
              className="mt-2"
            >
              Reset Form
            </Button>
          </AlertDescription>
        </Alert>
      )}
      onError={(error, errorInfo) => {
        console.error(`Form "${formName}" error:`, error, errorInfo);
      }}
    >
      {children}
    </BaseErrorBoundary>
  );
};
