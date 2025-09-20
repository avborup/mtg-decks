mod cards;
mod deck;
mod server;

use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::EnvFilter;

use cards::load_cards;
use server::create_router;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::builder()
                .with_default_directive(LevelFilter::INFO.into())
                .from_env_lossy(),
        )
        .init();

    let cards = load_cards()?;
    let app = create_router(cards);

    let address = "127.0.0.1:5678";
    let listener = tokio::net::TcpListener::bind(address).await?;

    info!("Server listening on http://{address}");
    info!("Available endpoints:");
    info!("  GET  /cards/:name      - Get card by name");
    info!("  POST /deck/resolve     - Parse and resolve deck list with full card data");
    info!("Try: curl http://{address}/cards/Rashmi%20and%20Ragavan");

    axum::serve(listener, app).await?;

    Ok(())
}
