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
      <Card className="card-frame">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl fantasy-heading">
            📈 Deck Analysis
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Strategic overview of your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="text-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="text-3xl font-bold text-primary">{result.total_cards}</div>
              <div className="text-sm font-medium text-primary/80">📚 Total Cards</div>
            </div>
            <div className="text-center p-4 bg-secondary/50 border border-border rounded-lg">
              <div className="text-3xl font-bold text-foreground">{totalUniqueCards}</div>
              <div className="text-sm font-medium text-muted-foreground">🎯 Unique Cards</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{resolvedCards}</div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">✅ Found</div>
            </div>
            <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{unresolvedCards}</div>
              <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">❓ Not Found</div>
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
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-lg font-bold fantasy-heading text-center">
                  🏷️ Dominant Archetypes
                </h4>
                <hr className="section-divider" />
              </div>
              <div className="space-y-3">
                {sortedCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                    <span className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-primary/20 text-primary border border-primary/30">
                      {category}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{count} cards</span>
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