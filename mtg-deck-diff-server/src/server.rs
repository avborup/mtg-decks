use axum::{
    Router,
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
};
use tower_http::cors::CorsLayer;
use tracing::{debug, instrument, warn};

use crate::cards::{Card, CardMap, get_card_by_name};
use crate::deck::{DeckResolveResult, resolve_deck_list};

#[instrument(skip(cards))]
pub async fn get_card_by_name_handler(
    State(cards): State<CardMap>,
    Path(name): Path<String>,
) -> Result<Json<Card>, StatusCode> {
    debug!("Fetching card");
    match get_card_by_name(&cards, &name) {
        Some(card) => {
            debug!(card_name = %name, "Card found");
            Ok(Json(card))
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
        .route("/cards/:name", get(get_card_by_name_handler))
        .route("/deck/resolve", post(resolve_deck_handler))
        .layer(CorsLayer::permissive())
        .with_state(cards)
}
