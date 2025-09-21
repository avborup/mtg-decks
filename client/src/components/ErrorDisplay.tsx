import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ParseError } from '@/types/api';

interface ErrorDisplayProps {
  errors: ParseError[];
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errors }) => {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Parsing Errors</CardTitle>
          <CardDescription>
            Found {errors.length} error{errors.length === 1 ? '' : 's'} while parsing your deck list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertTitle>Line {error.line_number}: {error.error}</AlertTitle>
                <AlertDescription>
                  <code className="bg-muted px-1 py-0.5 rounded text-sm">
                    {error.line}
                  </code>
                </AlertDescription>
              </Alert>
            ))}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Expected Format:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <code>1x Lightning Bolt</code> - Basic format</li>
              <li>• <code>2x Counterspell (lea) 55</code> - With set and collector number</li>
              <li>• <code>1x Forest [Land]</code> - With category tags</li>
              <li>• Empty lines and comments starting with # or // are ignored</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorDisplay;