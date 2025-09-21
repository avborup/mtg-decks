import { useState } from 'react'
import DeckInput from '@/components/DeckInput'
import CardDisplay from '@/components/CardDisplay'
import ErrorDisplay from '@/components/ErrorDisplay'
import DeckStats from '@/components/DeckStats'
import DeckDiff from '@/components/DeckDiff'
import ThemeToggle from '@/components/ThemeToggle'
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
          <header className="text-center mb-12">
            {/* Theme Toggle */}
            <div className="flex justify-end mb-6">
              <ThemeToggle />
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl font-bold fantasy-heading">
                🃏 Planeswalker's Arsenal
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {activeTab === 'viewer'
                  ? 'Catalog your deck and witness your cards in their full mystical glory'
                  : 'Analyze the evolution of your deck through arcane comparison magic'
                }
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant={activeTab === 'viewer' ? 'default' : 'outline'}
                onClick={() => setActiveTab('viewer')}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                🔍 Deck Viewer
              </Button>
              <Button
                variant={activeTab === 'diff' ? 'default' : 'outline'}
                onClick={() => setActiveTab('diff')}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                ⚔️ Deck Comparison
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
