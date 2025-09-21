import { useState } from 'react'
import DeckInput from '@/components/DeckInput'
import CardDisplay from '@/components/CardDisplay'
import ErrorDisplay from '@/components/ErrorDisplay'
import DeckStats from '@/components/DeckStats'
import DeckDiff from '@/components/DeckDiff'
import { Button } from '@/components/ui/button'
import type { DeckResolveResult } from '@/types/api'

function App() {
  const [deckResult, setDeckResult] = useState<DeckResolveResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'viewer' | 'diff'>('viewer')

  const handleDeckResolved = (result: DeckResolveResult) => {
    setDeckResult(result)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">MTG Deck Tool</h1>
            <p className="text-xl text-muted-foreground">
              {activeTab === 'viewer'
                ? 'Enter your MTG deck list and see all the cards with images'
                : 'Compare two deck lists to see the differences'
              }
            </p>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant={activeTab === 'viewer' ? 'default' : 'outline'}
                onClick={() => setActiveTab('viewer')}
              >
                Deck Viewer
              </Button>
              <Button
                variant={activeTab === 'diff' ? 'default' : 'outline'}
                onClick={() => setActiveTab('diff')}
              >
                Deck Diff
              </Button>
            </div>
          </header>

          <div className="space-y-8">
            {activeTab === 'viewer' && (
              <>
                <div className="flex justify-center">
                  <DeckInput
                    onDeckResolved={handleDeckResolved}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </div>

                {deckResult && (
                  <div className="space-y-6">
                    <DeckStats result={deckResult} />

                    {deckResult.errors.length > 0 && (
                      <ErrorDisplay errors={deckResult.errors} />
                    )}

                    {deckResult.entries.length > 0 && (
                      <CardDisplay entries={deckResult.entries} />
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'diff' && (
              <div className="flex justify-center">
                <DeckDiff />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
