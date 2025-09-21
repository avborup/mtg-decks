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
      <div className="space-y-6">
        {title && (
          <div className="space-y-3">
            <h3 className="text-xl font-bold fantasy-heading">
              {title}
            </h3>
            <hr className="section-divider" />
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cardEntries.map((entry, index) => (
            <div key={index} className="group">
              <div className="relative">
                <a
                  href={`https://scryfall.com/search?q=${encodeURIComponent(entry.card.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block cursor-pointer"
                >
                  {entry.card.image_uris?.normal ? (
                    <img
                      src={entry.card.image_uris.normal}
                      alt={entry.card.name}
                      className="w-full max-w-[200px] mx-auto rounded-lg shadow-md border transition-all duration-300 hover:shadow-lg hover:border-primary/50"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full max-w-[200px] mx-auto aspect-[5/7] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                      <div className="text-center">
                        <div className="text-muted-foreground text-sm mb-1">📄</div>
                        <span className="text-xs text-muted-foreground">No Image</span>
                      </div>
                    </div>
                  )}
                </a>

                {/* Quantity badge */}
                {entry.quantity > 1 && (
                  <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mystical-glow">
                    {entry.quantity}
                  </div>
                )}
              </div>

              <div className="mt-3 text-center space-y-1">
                <div className="font-semibold text-sm leading-tight group-hover:mana-gold transition-colors">
                  {entry.card.name}
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
      <Card className="card-frame">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl fantasy-heading">
            Card Collection
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Discovered {entries.length} unique card{entries.length === 1 ? '' : 's'} in your arsenal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-10">
          {commanders.length > 0 && renderCardGrid(commanders, "⚔️ Commanders")}
          {others.length > 0 && renderCardGrid(others, "🎯 Spells & Creatures")}
          {lands.length > 0 && renderCardGrid(lands, "🏔️ Lands")}
        </CardContent>
      </Card>
    </div>
  );
};

export default CardDisplay;