use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
};
use serde::Serialize;
use tower_http::cors::CorsLayer;
use tracing::{debug, instrument, warn};

use crate::cards::{Card, CardMap, get_card_by_name};
use crate::deck::{DeckResolveResult, resolve_deck_list};

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    version: String,
    cards_loaded: usize,
}

#[instrument(skip(cards))]
pub async fn health_check_handler(
    State(cards): State<CardMap>,
) -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        cards_loaded: cards.len(),
    })
}

#[instrument(skip(cards))]
pub async fn get_card_by_name_handler(
    State(cards): State<CardMap>,
    Path(name): Path<String>,
) -> Result<Json<Card>, StatusCode> {
    debug!("Fetching card");
    match get_card_by_name(&cards, &name) {
        Some(card) => {
            debug!(card_name = %name, "Card found");
            Ok(Json(card.clone()))
        }
        None => {
            warn!(card_name = %name, "Card not found");
            Err(StatusCode::NOT_FOUND)
        }
    }
}

#[instrument(skip_all)]
pub async fn resolve_deck_handler(
    State(cards): State<CardMap>,
    deck_text: String,
) -> Result<Json<DeckResolveResult>, StatusCode> {
    let result = resolve_deck_list(&deck_text, &cards);
    debug!(
        entries_count = result.entries.len(),
        errors_count = result.errors.len(),
        total_cards = result.total_cards,
        "Deck processing completed"
    );
    Ok(Json(result))
}

pub fn create_router(cards: CardMap) -> Router {
    Router::new()
        .route("/health", get(health_check_handler))
        .route("/cards/:name", get(get_card_by_name_handler))
        .route("/deck/resolve", post(resolve_deck_handler))
        .layer(CorsLayer::permissive())
        .with_state(cards)
}
