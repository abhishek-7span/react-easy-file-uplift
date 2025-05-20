
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ValidationErrorProps {
  errors: Record<string, string>;
}

export const ValidationError: React.FC<ValidationErrorProps> = ({ errors }) => {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
          {Object.entries(errors).map(([fileName, error]) => (
            <li key={fileName}>
              <span className="font-medium">{fileName}</span>: {error}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};
