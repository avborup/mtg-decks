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

export interface DeckDiffEntry {
  card_name: string;
  old_quantity: number;
  new_quantity: number;
  change_type: 'added' | 'removed' | 'modified' | 'unchanged';
  card?: Card;
  categories: string[];
}

export interface DeckDiffRequest {
  deck_list_1: string;
  deck_list_2: string;
}

export interface DeckDiffResult {
  added: DeckDiffEntry[];
  removed: DeckDiffEntry[];
  modified: DeckDiffEntry[];
  unchanged: DeckDiffEntry[];
  errors_deck_1: ParseError[];
  errors_deck_2: ParseError[];
}