import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeckResolveResult } from '@/types/api';
import { deckService } from '@/services/api';

interface DeckInputProps {
  onDeckResolved: (result: DeckResolveResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const DeckInput: React.FC<DeckInputProps> = ({ onDeckResolved, isLoading, setIsLoading }) => {
  const [deckText, setDeckText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckText.trim()) return;

    setIsLoading(true);
    try {
      const result = await deckService.resolveDeck(deckText);
      onDeckResolved(result);
    } catch (error) {
      console.error('Error resolving deck:', error);
      // You could add error handling here, like showing a toast
    } finally {
      setIsLoading(false);
    }
  };

  const exampleDeck = `1x Lightning Bolt
2x Counterspell (lea) 55 [Control]
1x Forest [Land]
4x Sol Ring [Artifact, Ramp]
1x Blasphemous Act (eoc) 86 [Removal]`;

  const loadExample = () => {
    setDeckText(exampleDeck);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Enter Your Deck List</CardTitle>
        <CardDescription>
          Enter your MTG deck list in the format: quantity + card name + optional set/categories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              value={deckText}
              onChange={(e) => setDeckText(e.target.value)}
              placeholder="1x Lightning Bolt&#10;2x Counterspell (lea) 55 [Control]&#10;1x Forest [Land]"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !deckText.trim()}>
              {isLoading ? 'Processing...' : 'Resolve Deck'}
            </Button>
            <Button type="button" variant="outline" onClick={loadExample}>
              Load Example
            </Button>
          </div>
        </form>
        <div className="mt-4 text-sm text-muted-foreground">
          <p><strong>Format:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>1x Lightning Bolt</code> - Basic format</li>
            <li><code>2x Counterspell (lea) 55</code> - With set code and collector number</li>
            <li><code>1x Forest [Land]</code> - With category tags</li>
            <li><code>1x Sol Ring [Artifact, Ramp]</code> - Multiple categories</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeckInput;