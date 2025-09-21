import axios from 'axios';
import type { DeckResolveResult, Card, DeckDiffRequest, DeckDiffResult } from '@/types/api';

const API_BASE_URL = 'http://127.0.0.1:5678';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const deckService = {
  async resolveDeck(deckText: string): Promise<DeckResolveResult> {
    const response = await api.post('/deck/resolve', deckText, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
    return response.data;
  },

  async diffDecks(request: DeckDiffRequest): Promise<DeckDiffResult> {
    const response = await api.post('/deck/diff', request);
    return response.data;
  },
};

export const cardService = {
  async getCardByName(name: string): Promise<Card> {
    const response = await api.get(`/cards/${encodeURIComponent(name)}`);
    return response.data;
  },
};

export default api;