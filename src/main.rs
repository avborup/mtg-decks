use sonic_rs::{Deserialize, Serialize};
use std::fs::File;
use std::time::Instant;

#[derive(Debug, Deserialize, Serialize)]
struct Card {
    id: String,
    name: String,
    // mana_cost: Option<String>,
    // type_line: String,
    // oracle_text: Option<String>,
    // power: Option<String>,
    // toughness: Option<String>,
    // colors: Option<Vec<String>>,
    // rarity: String,
    image_status: String,
    image_uris: Option<ImageUris>,
}

#[derive(Debug, Deserialize, Serialize)]
struct ImageUris {
    // small: String,
    normal: String,
    // large: String,
    // png: String,
    // art_crop: String,
    // border_crop: String,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let total_start = Instant::now();

    let file_start = Instant::now();
    let file = File::open("data/oracle-cards-20250919090345.json")?;
    let file_duration = file_start.elapsed();

    let parse_start = Instant::now();
    let cards: Vec<Card> = sonic_rs::from_reader(file)?;
    let parse_duration = parse_start.elapsed();

    println!("Loaded {} cards from oracle data", cards.len());
    println!("\nFirst few entries:");

    let display_start = Instant::now();
    dbg!(&cards[..20.min(cards.len())]);
    let display_duration = display_start.elapsed();

    let total_duration = total_start.elapsed();

    println!("\n--- Timing Results ---");
    println!("File opening: {:?}", file_duration);
    println!("JSON parsing: {:?}", parse_duration);
    println!("Display output: {:?}", display_duration);
    println!("Total time: {:?}", total_duration);

    Ok(())
}
