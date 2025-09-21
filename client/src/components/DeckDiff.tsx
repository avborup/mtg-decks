import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckDiffResult, DeckDiffEntry } from '@/types/api';
import { deckService } from '@/services/api';

interface DeckDiffProps {}

const DeckDiff: React.FC<DeckDiffProps> = () => {
  const [deck1Text, setDeck1Text] = useState('');
  const [deck2Text, setDeck2Text] = useState('');
  const [diffResult, setDiffResult] = useState<DeckDiffResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDiff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck1Text.trim() || !deck2Text.trim()) return;

    setIsLoading(true);
    try {
      const result = await deckService.diffDecks({
        deck_list_1: deck1Text,
        deck_list_2: deck2Text,
      });
      setDiffResult(result);
    } catch (error) {
      console.error('Error diffing decks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExample = () => {
    setDeck1Text(`4x Lightning Bolt
2x Counterspell
1x Forest
1x Mountain`);
    setDeck2Text(`2x Lightning Bolt
2x Counterspell
1x Forest
1x Mountain
3x Sol Ring [Artifact, Ramp]
1x Blasphemous Act [Removal]`);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return '+';
      case 'removed':
        return '-';
      case 'modified':
        return '~';
      default:
        return '=';
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'removed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'modified':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const renderDiffEntry = (entry: DeckDiffEntry, index: number) => (
    <div key={index} className="border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center justify-center w-6 h-6 text-sm font-bold rounded-full ${getChangeColor(
                entry.change_type
              )}`}
            >
              {getChangeIcon(entry.change_type)}
            </span>
            <h3 className="font-semibold text-lg">{entry.card_name}</h3>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {entry.change_type === 'added' && (
              <p>
                {entry.old_quantity > 0
                  ? `Increased by: ${entry.new_quantity}x (was ${entry.old_quantity}x)`
                  : `Added: ${entry.new_quantity}x`
                }
              </p>
            )}
            {entry.change_type === 'removed' && (
              <p>
                {entry.new_quantity > 0
                  ? `Decreased by: ${entry.old_quantity}x (now ${entry.new_quantity}x)`
                  : `Removed: ${entry.old_quantity}x`
                }
              </p>
            )}
            {entry.change_type === 'modified' && (
              <p>
                Changed: {entry.old_quantity}x → {entry.new_quantity}x
              </p>
            )}
            {entry.change_type === 'unchanged' && (
              <p>Unchanged: {entry.old_quantity}x</p>
            )}
          </div>
        </div>
        {entry.card?.image_uris?.normal && (
          <img
            src={entry.card.image_uris.normal}
            alt={entry.card_name}
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
    </div>
  );

  const renderDiffSection = (
    title: string,
    entries: DeckDiffEntry[],
    bgColor: string
  ) => {
    if (entries.length === 0) return null;

    return (
      <Card className={`${bgColor} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-background border border-border">
              {entries.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {entries.map(renderDiffEntry)}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deck Diff - Compare Two Decks</CardTitle>
          <CardDescription>
            Compare two deck lists to see additions, removals, and quantity changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDiff} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Deck 1 (Original)
                </label>
                <Textarea
                  value={deck1Text}
                  onChange={(e) => setDeck1Text(e.target.value)}
                  placeholder="1x Lightning Bolt&#10;2x Counterspell"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Deck 2 (Modified)
                </label>
                <Textarea
                  value={deck2Text}
                  onChange={(e) => setDeck2Text(e.target.value)}
                  placeholder="2x Lightning Bolt&#10;2x Counterspell&#10;1x Sol Ring"
                  className="min-h-[150px] font-mono text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isLoading || !deck1Text.trim() || !deck2Text.trim()}
              >
                {isLoading ? 'Comparing...' : 'Compare Decks'}
              </Button>
              <Button type="button" variant="outline" onClick={loadExample}>
                Load Example
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {diffResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Diff Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {diffResult.added.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Added</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {diffResult.removed.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Removed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {diffResult.modified.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Modified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {diffResult.unchanged.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Unchanged</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors */}
          {(diffResult.errors_deck_1.length > 0 || diffResult.errors_deck_2.length > 0) && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-200">
                  Parsing Errors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {diffResult.errors_deck_1.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Deck 1 Errors:
                    </h4>
                    <ul className="space-y-1">
                      {diffResult.errors_deck_1.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-300">
                          Line {error.line_number}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {diffResult.errors_deck_2.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                      Deck 2 Errors:
                    </h4>
                    <ul className="space-y-1">
                      {diffResult.errors_deck_2.map((error, index) => (
                        <li key={index} className="text-sm text-red-700 dark:text-red-300">
                          Line {error.line_number}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Diff Sections */}
          {renderDiffSection(
            'Added Cards',
            diffResult.added,
            'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          )}

          {renderDiffSection(
            'Removed Cards',
            diffResult.removed,
            'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
          )}

          {renderDiffSection(
            'Modified Cards',
            diffResult.modified,
            'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950'
          )}

          {renderDiffSection(
            'Unchanged Cards',
            diffResult.unchanged,
            'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'
          )}
        </div>
      )}
    </div>
  );
};

export default DeckDiff;