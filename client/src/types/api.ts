export interface ImageUris {
  normal: string;
}

export interface Card {
  id: string;
  name: string;
  image_status: string;
  image_uris?: ImageUris;
}

export interface DeckEntry {
  quantity: number;
  categories: string[];
  card: Card;
}

export interface ParseError {
  line_number: number;
  line: string;
  error: string;
}

export interface DeckResolveResult {
  entries: DeckEntry[];
  total_cards: number;
  errors: ParseError[];
}