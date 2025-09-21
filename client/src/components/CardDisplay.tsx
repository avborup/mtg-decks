import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckEntry } from '@/types/api';
import { sortCardEntries, isCommander, isLand } from '@/lib/cardUtils';

interface CardDisplayProps {
  entries: DeckEntry[];
}

const CardDisplay: React.FC<CardDisplayProps> = ({ entries }) => {
  if (entries.length === 0) {
    return null;
  }

  const sortedEntries = sortCardEntries(entries);

  // Group entries by category for display
  const commanders = sortedEntries.filter(entry => isCommander(entry.categories));
  const lands = sortedEntries.filter(entry => !isCommander(entry.categories) && isLand(entry.categories));
  const others = sortedEntries.filter(entry => !isCommander(entry.categories) && !isLand(entry.categories));

  const renderCardGrid = (cardEntries: DeckEntry[], title?: string) => {
    if (cardEntries.length === 0) return null;

    return (
      <div className="space-y-4">
        {title && (
          <h3 className="text-lg font-semibold text-muted-foreground border-b pb-2">
            {title}
          </h3>
        )}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cardEntries.map((entry, index) => (
            <div key={index} className="text-center">
              {entry.card.image_uris?.normal ? (
                <img
                  src={entry.card.image_uris.normal}
                  alt={entry.card.name}
                  className="w-full max-w-[200px] mx-auto rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full max-w-[200px] mx-auto aspect-[5/7] bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">No Image</span>
                </div>
              )}
              <div className="mt-2 text-sm">
                <div className="font-medium">{entry.card.name}</div>
                <div className="text-muted-foreground">
                  {entry.quantity}x
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Resolved Cards</CardTitle>
          <CardDescription>
            Found {entries.length} card{entries.length === 1 ? '' : 's'} in your deck
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {commanders.length > 0 && renderCardGrid(commanders)}
          {others.length > 0 && renderCardGrid(others)}
          {lands.length > 0 && renderCardGrid(lands, "Lands")}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDisplay;