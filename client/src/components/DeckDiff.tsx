import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckDiffResult, DeckDiffEntry } from '@/types/api';
import { deckService } from '@/services/api';
import { sortDiffEntries, isCommander, isLand } from '@/lib/cardUtils';

const DeckDiff: React.FC = () => {
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



  const renderDiffEntry = (entry: DeckDiffEntry, index: number) => {
    const getCardColorClass = () => {
      switch (entry.change_type) {
        case 'added':
          return 'card-added';
        case 'removed':
          return 'card-removed';
        default:
          return '';
      }
    };

    return (
      <div key={index} className="group">
        <div className="relative">
          <a
            href={`https://scryfall.com/search?q=${encodeURIComponent(entry.card_name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block cursor-pointer"
          >
            {entry.card?.image_uris?.normal ? (
              <img
                src={entry.card.image_uris.normal}
                alt={entry.card_name}
                className={`w-full max-w-[200px] mx-auto rounded-lg shadow-md border transition-all duration-300 hover:shadow-lg ${getCardColorClass()}`}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className={`w-full max-w-[200px] mx-auto aspect-[5/7] bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border ${getCardColorClass()}`}>
                <div className="text-center">
                  <div className="text-muted-foreground text-sm mb-1">📄</div>
                  <span className="text-xs text-muted-foreground">No Image</span>
                </div>
              </div>
            )}
          </a>
        </div>

        <div className="mt-3 text-center space-y-1">
          <div className="font-semibold text-sm leading-tight group-hover:mana-gold transition-colors">
            {entry.card_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {entry.change_type === 'added' && (
              <span className="text-green-600 dark:text-green-400">
                {entry.old_quantity > 0
                  ? `+${entry.new_quantity - entry.old_quantity} (${entry.new_quantity}x total)`
                  : `+${entry.new_quantity}x`
                }
              </span>
            )}
            {entry.change_type === 'removed' && (
              <span className="text-red-600 dark:text-red-400">
                {entry.new_quantity > 0
                  ? `-${entry.old_quantity - entry.new_quantity} (${entry.new_quantity}x left)`
                  : `-${entry.old_quantity}x`
                }
              </span>
            )}
            {entry.change_type === 'modified' && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {entry.old_quantity}x → {entry.new_quantity}x
              </span>
            )}
            {entry.change_type === 'unchanged' && (
              <span>{entry.old_quantity}x</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDiffSection = (
    title: string,
    entries: DeckDiffEntry[],
    bgColor: string
  ) => {
    if (entries.length === 0) return null;

    const sortedEntries = sortDiffEntries(entries);

    // Group entries by category for display
    const commanders = sortedEntries.filter(entry => isCommander(entry.categories));
    const lands = sortedEntries.filter(entry => !isCommander(entry.categories) && isLand(entry.categories));
    const others = sortedEntries.filter(entry => !isCommander(entry.categories) && !isLand(entry.categories));

    const renderCardGrid = (cardEntries: DeckDiffEntry[], sectionTitle?: string) => {
      if (cardEntries.length === 0) return null;

      return (
        <div className="space-y-6">
          {sectionTitle && (
            <div className="space-y-3">
              <h4 className="text-lg font-bold fantasy-heading">
                {sectionTitle}
              </h4>
              <hr className="section-divider" />
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {cardEntries.map(renderDiffEntry)}
          </div>
        </div>
      );
    };

    return (
      <Card className={`card-frame ${bgColor} border-2`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl fantasy-heading flex items-center justify-center gap-3">
            {title}
            <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-primary/20 text-primary border border-primary/30 mystical-glow">
              {entries.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-10">
          {commanders.length > 0 && renderCardGrid(commanders, "⚔️ Commanders")}
          {others.length > 0 && renderCardGrid(others, "🎯 Spells & Creatures")}
          {lands.length > 0 && renderCardGrid(lands, "🏔️ Lands")}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-8">
      <Card className="card-frame">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl fantasy-heading">
            ⚔️ Deck Comparison Ritual
          </CardTitle>
          <CardDescription className="text-lg">
            Compare two deck configurations to reveal their differences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDiff} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-foreground">
                  📜 Original Deck
                </label>
                <Textarea
                  value={deck1Text}
                  onChange={(e) => setDeck1Text(e.target.value)}
                  placeholder="1x Lightning Bolt&#10;2x Counterspell&#10;1x Forest [Land]"
                  className="min-h-[160px] font-mono text-sm bg-card border-2 border-border focus:border-primary transition-colors"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-muted-foreground">
                  📝 Modified Deck
                </label>
                <Textarea
                  value={deck2Text}
                  onChange={(e) => setDeck2Text(e.target.value)}
                  placeholder="2x Lightning Bolt&#10;2x Counterspell&#10;1x Sol Ring [Artifact]"
                  className="min-h-[160px] font-mono text-sm bg-card border-2 border-border focus:border-primary transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-center gap-4">
              <Button
                type="submit"
                disabled={isLoading || !deck1Text.trim() || !deck2Text.trim()}
                className="px-8 py-3 text-lg mystical-glow"
                size="lg"
              >
                {isLoading ? '🔮 Analyzing...' : '⚡ Compare Decks'}
              </Button>
              <Button type="button" variant="outline" onClick={loadExample} size="lg">
                📚 Load Example
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {diffResult && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="card-frame">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl fantasy-heading">
                📊 Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {diffResult.added.length}
                  </div>
                  <div className="text-sm font-medium text-green-700 dark:text-green-300">✨ Added</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {diffResult.removed.length}
                  </div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">🗑️ Removed</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                    {diffResult.modified.length}
                  </div>
                  <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">🔄 Modified</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {diffResult.unchanged.length}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">✓ Unchanged</div>
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