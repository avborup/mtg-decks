import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckResolveResult } from '@/types/api';

interface DeckStatsProps {
  result: DeckResolveResult;
}

const DeckStats: React.FC<DeckStatsProps> = ({ result }) => {
  const resolvedCards = result.entries.filter(entry => entry.card).length;
  const unresolvedCards = result.entries.filter(entry => !entry.card).length;
  const totalUniqueCards = result.entries.length;

  // Count categories
  const categoryCount = result.entries.reduce((acc, entry) => {
    entry.categories.forEach(category => {
      acc[category] = (acc[category] || 0) + entry.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Show top 5 categories

  const resolvedPercentage = totalUniqueCards > 0
    ? Math.round((resolvedCards / totalUniqueCards) * 100)
    : 0;

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Deck Statistics</CardTitle>
          <CardDescription>
            Summary of your deck analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{result.total_cards}</div>
              <div className="text-sm text-muted-foreground">Total Cards</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalUniqueCards}</div>
              <div className="text-sm text-muted-foreground">Unique Cards</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">{resolvedCards}</div>
              <div className="text-sm text-muted-foreground">Found</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{unresolvedCards}</div>
              <div className="text-sm text-muted-foreground">Not Found</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mb-6">
              <div className="text-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="text-2xl font-bold text-destructive">{result.errors.length}</div>
                <div className="text-sm text-muted-foreground">Parse Errors</div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Resolution Rate</span>
              <span className="text-sm text-muted-foreground">{resolvedPercentage}%</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${resolvedPercentage}%` }}
              />
            </div>
          </div>

          {sortedCategories.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Top Categories</h4>
              <div className="space-y-2">
                {sortedCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground">
                      {category}
                    </span>
                    <span className="text-sm text-muted-foreground">{count} cards</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeckStats;