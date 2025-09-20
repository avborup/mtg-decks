use sonic_rs::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::sync::Arc;
use std::time::Instant;
use tracing::{info, instrument};

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct Card {
    pub id: String,
    pub name: String,
    // pub mana_cost: Option<String>,
    // pub type_line: String,
    // pub oracle_text: Option<String>,
    // pub power: Option<String>,
    // pub toughness: Option<String>,
    // pub colors: Option<Vec<String>>,
    // pub rarity: String,
    pub image_status: String,
    pub image_uris: Option<ImageUris>,
}

#[derive(Debug, Deserialize, Serialize, Clone, PartialEq)]
pub struct ImageUris {
    // pub small: String,
    pub normal: String,
    // pub large: String,
    // pub png: String,
    // pub art_crop: String,
    // pub border_crop: String,
}

pub type CardMap = Arc<HashMap<String, Vec<Card>>>;

#[instrument]
pub fn load_cards() -> Result<CardMap, Box<dyn std::error::Error>> {
    let load_start = Instant::now();

    info!("Loading cards from Scryfall JSON data...");

    let file = File::open("data/oracle-cards-20250919090345.json")?;
    let cards: Vec<Card> = sonic_rs::from_reader(file)?;

    // Group cards by name to preserve duplicates (especially important for tokens and extra cards)
    let mut card_map: HashMap<String, Vec<Card>> = HashMap::new();
    for card in cards {
        card_map.entry(card.name.clone()).or_insert_with(Vec::new).push(card);
    }

    let load_duration = load_start.elapsed();
    let unique_names = card_map.len();
    let total_cards: usize = card_map.values().map(|cards| cards.len()).sum();
    info!(
        unique_names = unique_names,
        total_cards = total_cards,
        load_time_ms = load_duration.as_millis(),
        "Successfully loaded cards"
    );

    Ok(Arc::new(card_map))
}

pub fn get_card_by_name(cards: &CardMap, name: &str) -> Option<Card> {
    cards.get(name).and_then(|card_vec| card_vec.first().cloned())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_card_by_name_returns_none_for_missing_card() {
        let cards = Arc::new(HashMap::new());
        let result = get_card_by_name(&cards, "Nonexistent Card");
        assert!(result.is_none());
    }

    #[test]
    fn test_get_card_by_name_returns_card_when_found() {
        let mut card_map = HashMap::new();
        let test_card = Card {
            id: "test-id".to_string(),
            name: "Lightning Bolt".to_string(),
            image_status: "highres_scan".to_string(),
            image_uris: None,
        };
        card_map.insert("Lightning Bolt".to_string(), vec![test_card.clone()]);
        let cards = Arc::new(card_map);

        let result = get_card_by_name(&cards, "Lightning Bolt");
        assert!(result.is_some());
        let found_card = result.unwrap();
        assert_eq!(found_card.name, "Lightning Bolt");
        assert_eq!(found_card.id, "test-id");
    }

    #[test]
    fn test_card_name_case_sensitivity() {
        let mut card_map = HashMap::new();
        let test_card = Card {
            id: "test-id".to_string(),
            name: "Lightning Bolt".to_string(),
            image_status: "highres_scan".to_string(),
            image_uris: None,
        };
        card_map.insert("Lightning Bolt".to_string(), vec![test_card]);
        let cards = Arc::new(card_map);

        assert!(get_card_by_name(&cards, "Lightning Bolt").is_some());
        assert!(get_card_by_name(&cards, "lightning bolt").is_none());
        assert!(get_card_by_name(&cards, "LIGHTNING BOLT").is_none());
    }
}