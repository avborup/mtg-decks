use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::cards::{Card, CardMap, get_card_by_name};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DeckEntry {
    pub categories: Vec<String>,
    pub quantity: u32,
    pub card: Card,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParseError {
    pub line_number: usize,
    pub line: String,
    pub error: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckResolveResult {
    pub entries: Vec<DeckEntry>,
    pub total_cards: u32,
    pub errors: Vec<ParseError>,
}

pub fn resolve_deck_list(input: &str, cards: &CardMap) -> DeckResolveResult {
    let re =
        Regex::new(r"^(\d+)x\s+(.+?)(?:\s+\(([^)]+)\)\s+(\S+))?(?:\s+\[([^\]]+)\])?$").unwrap();

    let mut entries = Vec::new();
    let mut errors = Vec::new();
    let mut total_cards = 0;

    for (line_number, line) in input.lines().enumerate() {
        let line = line.trim();

        // Skip empty lines and comments
        if line.is_empty() || line.starts_with('#') || line.starts_with("//") {
            continue;
        }

        match re.captures(line) {
            Some(caps) => {
                let quantity = caps.get(1).unwrap().as_str().parse::<u32>().unwrap_or(0);
                let name = caps.get(2).unwrap().as_str().trim().to_string();
                let categories = caps
                    .get(5)
                    .map(|m| {
                        m.as_str()
                            .split(',')
                            .map(|c| c.trim().to_string())
                            .collect()
                    })
                    .unwrap_or_else(Vec::new);

                if quantity == 0 {
                    errors.push(ParseError {
                        line_number: line_number + 1,
                        line: line.to_string(),
                        error: "Invalid quantity".to_string(),
                    });
                    continue;
                }

                if name.is_empty() {
                    errors.push(ParseError {
                        line_number: line_number + 1,
                        line: line.to_string(),
                        error: "Empty card name".to_string(),
                    });
                    continue;
                }

                let Some(card) = get_card_by_name(cards, &name).cloned() else {
                    errors.push(ParseError {
                        line_number: line_number + 1,
                        line: line.to_string(),
                        error: format!("Card not found: {}", name),
                    });
                    continue;
                };

                total_cards += quantity;
                entries.push(DeckEntry {
                    categories,
                    card,
                    quantity,
                });
            }
            None => {
                errors.push(ParseError {
                    line_number: line_number + 1,
                    line: line.to_string(),
                    error: "Failed to parse deck entry format".to_string(),
                });
            }
        }
    }

    DeckResolveResult {
        entries,
        total_cards,
        errors,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckDiffEntry {
    pub card_name: String,
    pub old_quantity: u32,
    pub new_quantity: u32,
    pub change_type: String, // "added", "removed", "modified", "unchanged"
    pub card: Option<Card>,
    pub categories: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckDiffRequest {
    pub deck_list_1: String,
    pub deck_list_2: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeckDiffResult {
    pub added: Vec<DeckDiffEntry>,
    pub removed: Vec<DeckDiffEntry>,
    pub modified: Vec<DeckDiffEntry>,
    pub unchanged: Vec<DeckDiffEntry>,
    pub errors_deck_1: Vec<ParseError>,
    pub errors_deck_2: Vec<ParseError>,
}

pub fn diff_decks(deck1_input: &str, deck2_input: &str, cards: &CardMap) -> DeckDiffResult {
    let deck1_result = resolve_deck_list(deck1_input, cards);
    let deck2_result = resolve_deck_list(deck2_input, cards);

    // Create maps for easier comparison
    let mut deck1_map = std::collections::HashMap::new();
    for entry in &deck1_result.entries {
        deck1_map.insert(entry.card.name.clone(), entry);
    }

    let mut deck2_map = std::collections::HashMap::new();
    for entry in &deck2_result.entries {
        deck2_map.insert(entry.card.name.clone(), entry);
    }

    let mut added = Vec::new();
    let mut removed = Vec::new();
    let mut modified = Vec::new();
    let mut unchanged = Vec::new();

    // Find all unique card names
    let all_cards: std::collections::HashSet<String> = deck1_map
        .keys()
        .chain(deck2_map.keys())
        .cloned()
        .collect();

    for card_name in all_cards {
        let deck1_entry = deck1_map.get(&card_name);
        let deck2_entry = deck2_map.get(&card_name);

        match (deck1_entry, deck2_entry) {
            (None, Some(entry2)) => {
                // Card added in deck 2
                added.push(DeckDiffEntry {
                    card_name: card_name.clone(),
                    old_quantity: 0,
                    new_quantity: entry2.quantity,
                    change_type: "added".to_string(),
                    card: Some(entry2.card.clone()),
                    categories: entry2.categories.clone(),
                });
            }
            (Some(entry1), None) => {
                // Card removed from deck 2
                removed.push(DeckDiffEntry {
                    card_name: card_name.clone(),
                    old_quantity: entry1.quantity,
                    new_quantity: 0,
                    change_type: "removed".to_string(),
                    card: Some(entry1.card.clone()),
                    categories: entry1.categories.clone(),
                });
            }
            (Some(entry1), Some(entry2)) => {
                if entry1.quantity != entry2.quantity {
                    // Quantity changed
                    modified.push(DeckDiffEntry {
                        card_name: card_name.clone(),
                        old_quantity: entry1.quantity,
                        new_quantity: entry2.quantity,
                        change_type: "modified".to_string(),
                        card: Some(entry2.card.clone()),
                        categories: entry2.categories.clone(),
                    });
                } else {
                    // No change
                    unchanged.push(DeckDiffEntry {
                        card_name: card_name.clone(),
                        old_quantity: entry1.quantity,
                        new_quantity: entry2.quantity,
                        change_type: "unchanged".to_string(),
                        card: Some(entry1.card.clone()),
                        categories: entry1.categories.clone(),
                    });
                }
            }
            (None, None) => {
                // This shouldn't happen given our logic above
            }
        }
    }

    // Sort entries by card name for consistent output
    added.sort_by(|a, b| a.card_name.cmp(&b.card_name));
    removed.sort_by(|a, b| a.card_name.cmp(&b.card_name));
    modified.sort_by(|a, b| a.card_name.cmp(&b.card_name));
    unchanged.sort_by(|a, b| a.card_name.cmp(&b.card_name));

    DeckDiffResult {
        added,
        removed,
        modified,
        unchanged,
        errors_deck_1: deck1_result.errors,
        errors_deck_2: deck2_result.errors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cards::{Card, ImageUris};
    use std::{collections::HashMap, sync::Arc};

    fn create_test_card(name: &str) -> Card {
        Card {
            id: format!("test-{}", name.replace(' ', "-").to_lowercase()),
            name: name.to_string(),
            image_status: "highres_scan".to_string(),
            image_uris: Some(ImageUris {
                normal: "test-url".to_string(),
            }),
        }
    }

    #[test]
    fn test_resolve_basic_deck_entry() {
        let cards = Arc::new(HashMap::new());
        let input = "1x Lightning Bolt";
        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.total_cards, 1);

        let entry = &result.entries[0];
        assert_eq!(entry.quantity, 1);
        assert_eq!(entry.name, "Lightning Bolt");
        assert_eq!(entry.set_code, None);
        assert_eq!(entry.collector_number, None);
        assert_eq!(entry.categories, Vec::<String>::new());
        assert_eq!(entry.card, None); // Card not found
    }

    #[test]
    fn test_resolve_full_deck_entry() {
        let cards = Arc::new(HashMap::new());
        let input = "2x Blasphemous Act (eoc) 86 [Removal]";
        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.entries.len(), 1);
        assert_eq!(result.total_cards, 2);

        let entry = &result.entries[0];
        assert_eq!(entry.quantity, 2);
        assert_eq!(entry.name, "Blasphemous Act");
        assert_eq!(entry.set_code, Some("eoc".to_string()));
        assert_eq!(entry.collector_number, Some("86".to_string()));
        assert_eq!(entry.categories, vec!["Removal".to_string()]);
        assert_eq!(entry.card, None); // Card not found
    }

    #[test]
    fn test_resolve_multiple_entries() {
        let cards = Arc::new(HashMap::new());
        let input = r#"
1x Lightning Bolt
2x Counterspell (lea) 55 [Control]
1x Forest [Land]
        "#;
        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.entries.len(), 3);
        assert_eq!(result.total_cards, 4);
    }

    #[test]
    fn test_resolve_with_comments_and_empty_lines() {
        let cards = Arc::new(HashMap::new());
        let input = r#"
# This is a comment
1x Lightning Bolt

// Another comment
2x Counterspell
        "#;
        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.entries.len(), 2);
    }

    #[test]
    fn test_resolve_invalid_entries() {
        let cards = Arc::new(HashMap::new());
        let input = r#"
0x Invalid Quantity
xInvalid Format
1x
        "#;
        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.errors.len(), 3);
        assert_eq!(result.entries.len(), 0);
    }

    #[test]
    fn test_resolve_with_card_resolution() {
        let mut card_map = HashMap::new();
        let bolt_card = create_test_card("Lightning Bolt");
        card_map.insert("Lightning Bolt".to_string(), vec![bolt_card.clone()]);
        let cards = Arc::new(card_map);

        let input = r#"
1x Lightning Bolt
1x Nonexistent Card
        "#;

        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.entries.len(), 2);
        assert_eq!(result.errors.len(), 0);

        // First entry should have card resolved
        assert!(result.entries[0].card.is_some());
        assert_eq!(
            result.entries[0].card.as_ref().unwrap().name,
            "Lightning Bolt"
        );
        assert_eq!(result.entries[0].name, "Lightning Bolt");

        // Second entry should not have card resolved
        assert!(result.entries[1].card.is_none());
        assert_eq!(result.entries[1].name, "Nonexistent Card");
    }

    #[test]
    fn test_resolve_multiple_categories() {
        let mut card_map = HashMap::new();
        card_map.insert(
            "Lightning Bolt".to_string(),
            vec![create_test_card("Lightning Bolt")],
        );
        card_map.insert("Forest".to_string(), vec![create_test_card("Forest")]);
        let cards = Arc::new(card_map);

        let input = r#"
1x Lightning Bolt [Removal, Burn, Instant]
1x Forest [Land]
1x Sol Ring [Artifact, Ramp]
        "#;

        let result = resolve_deck_list(input, &cards);

        assert_eq!(result.entries.len(), 3);
        assert_eq!(result.errors.len(), 0);
        assert_eq!(result.total_cards, 3);

        // Check multiple categories for Lightning Bolt
        assert_eq!(result.entries[0].categories.len(), 3);
        assert_eq!(result.entries[0].categories[0], "Removal");
        assert_eq!(result.entries[0].categories[1], "Burn");
        assert_eq!(result.entries[0].categories[2], "Instant");
        assert!(result.entries[0].card.is_some()); // Lightning Bolt found

        // Check single category for Forest
        assert_eq!(result.entries[1].categories.len(), 1);
        assert_eq!(result.entries[1].categories[0], "Land");
        assert!(result.entries[1].card.is_some()); // Forest found

        // Check multiple categories for Sol Ring (card not found)
        assert_eq!(result.entries[2].categories.len(), 2);
        assert_eq!(result.entries[2].categories[0], "Artifact");
        assert_eq!(result.entries[2].categories[1], "Ramp");
        assert!(result.entries[2].card.is_none()); // Sol Ring not found
    }
}
