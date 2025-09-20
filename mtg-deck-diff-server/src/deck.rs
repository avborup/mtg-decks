use regex::Regex;
use serde::{Deserialize, Serialize};
use tracing::debug;

use crate::cards::{Card, CardMap, get_card_by_name};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DeckEntry {
    pub quantity: u32,
    pub name: String,
    pub set_code: Option<String>,
    pub collector_number: Option<String>,
    pub categories: Vec<String>,
    pub card: Option<Card>,
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
                let set_code = caps.get(3).map(|m| m.as_str().to_string());
                let collector_number = caps.get(4).map(|m| m.as_str().to_string());
                let categories = caps.get(5)
                    .map(|m| m.as_str().split(',').map(|c| c.trim().to_string()).collect())
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

                // Resolve card immediately during parsing
                let card = get_card_by_name(cards, &name);
                if card.is_none() {
                    debug!("Card not found: {}", name);
                }

                total_cards += quantity;
                entries.push(DeckEntry {
                    quantity,
                    name,
                    set_code,
                    collector_number,
                    categories,
                    card,
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
        card_map.insert("Lightning Bolt".to_string(), vec![create_test_card("Lightning Bolt")]);
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
