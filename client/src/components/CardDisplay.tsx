import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckEntry } from '@/types/api';

interface CardDisplayProps {
  entries: DeckEntry[];
}

const CardDisplay: React.FC<CardDisplayProps> = ({ entries }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Resolved Cards</CardTitle>
          <CardDescription>
            Found {entries.length} card{entries.length === 1 ? '' : 's'} in your deck
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{entry.card.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {entry.quantity}
                    </p>
                  </div>
                  {entry.card.image_uris?.normal && (
                    <img
                      src={entry.card.image_uris.normal}
                      alt={entry.card.name}
                      className="w-16 h-22 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>


                {entry.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {entry.categories.map((category, catIndex) => (
                      <span
                        key={catIndex}
                        className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Found
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.card.image_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDisplay;