use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::get,
};
use sonic_rs::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::File;
use std::sync::Arc;
use std::time::Instant;
use tracing::{debug, info, instrument, warn};

#[derive(Debug, Deserialize, Serialize, Clone)]
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

#[derive(Debug, Deserialize, Serialize, Clone)]
struct ImageUris {
    // small: String,
    normal: String,
    // large: String,
    // png: String,
    // art_crop: String,
    // border_crop: String,
}

type CardMap = Arc<HashMap<String, Card>>;

#[instrument]
fn load_cards() -> Result<CardMap, Box<dyn std::error::Error>> {
    let load_start = Instant::now();

    info!("Loading cards from Scryfall JSON data...");

    let file = File::open("data/oracle-cards-20250919090345.json")?;
    let cards: Vec<Card> = sonic_rs::from_reader(file)?;

    // This has the gotcha that duplicate names will be overwritten, which is especially the case
    // for tokens and extra cards.
    let card_map = HashMap::from_iter(cards.into_iter().map(|card| (card.name.clone(), card)));

    let load_duration = load_start.elapsed();
    info!(
        card_count = card_map.len(),
        load_time_ms = load_duration.as_millis(),
        "Successfully loaded unique cards"
    );

    Ok(Arc::new(card_map))
}

#[instrument(skip(cards))]
async fn get_card_by_name(
    State(cards): State<CardMap>,
    Path(name): Path<String>,
) -> Result<Json<Card>, StatusCode> {
    debug!("Fetching card");
    match cards.get(&name) {
        Some(card) => Ok(Json(card.clone())),
        None => Err(StatusCode::NOT_FOUND),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let cards = load_cards()?;

    let app = Router::new()
        .route("/cards/:name", get(get_card_by_name))
        .with_state(cards);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await?;
    info!("MTG Card Server listening on http://127.0.0.1:3000");
    info!("Try: curl http://127.0.0.1:3000/cards/Lightning%20Bolt");

    axum::serve(listener, app).await?;

    Ok(())
}
