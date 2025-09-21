import type { DeckEntry, DeckDiffEntry } from '@/types/api';

export const isCommander = (categories: string[]): boolean => {
  return categories.some(category =>
    category.toLowerCase().includes('commander')
  );
};

export const isLand = (categories: string[]): boolean => {
  return categories.some(category =>
    category.toLowerCase().includes('land')
  );
};

export const sortCardEntries = (entries: DeckEntry[]): DeckEntry[] => {
  return [...entries].sort((a, b) => {
    const aIsCommander = isCommander(a.categories);
    const bIsCommander = isCommander(b.categories);
    const aIsLand = isLand(a.categories);
    const bIsLand = isLand(b.categories);

    // Commanders first
    if (aIsCommander && !bIsCommander) return -1;
    if (!aIsCommander && bIsCommander) return 1;

    // If both or neither are commanders, check for lands
    if (aIsLand && !bIsLand) return 1;
    if (!aIsLand && bIsLand) return -1;

    // If same category type, sort alphabetically by card name
    return a.card.name.localeCompare(b.card.name);
  });
};

export const sortDiffEntries = (entries: DeckDiffEntry[]): DeckDiffEntry[] => {
  return [...entries].sort((a, b) => {
    const aIsCommander = isCommander(a.categories);
    const bIsCommander = isCommander(b.categories);
    const aIsLand = isLand(a.categories);
    const bIsLand = isLand(b.categories);

    // Commanders first
    if (aIsCommander && !bIsCommander) return -1;
    if (!aIsCommander && bIsCommander) return 1;

    // If both or neither are commanders, check for lands
    if (aIsLand && !bIsLand) return 1;
    if (!aIsLand && bIsLand) return -1;

    // If same category type, sort alphabetically by card name
    return a.card_name.localeCompare(b.card_name);
  });
};