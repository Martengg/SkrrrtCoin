
/// +-------------------------------------------------------------+
/// |  author of the miner in rust -> https://github.com/Janrupf  |
/// +-------------------------------------------------------------+


extern crate md5; // 0.7.0
extern crate reqwest; // 0.11.6, features = ["json"]
extern crate serde; // 1.0.130, features = ["derive"]
extern crate serde_json; // 1.0.69
extern crate thiserror; // 1.0.30
extern crate tokio; // 1.13.0, features = ["full"]

use serde::{Deserialize, Serialize};
use std::fmt::Write;
use thiserror::Error;

const PUBLIC_KEY: &'static str = "193";
const API_ENDPOINT: &'static str = "https://skrt.koaladev.de";

#[derive(Debug, Error)]
enum SkrtCoinError {
    #[error("Failed to format data: {0}")]
    FormatError(#[from] std::fmt::Error),

    #[error("a http error occurred: {0}")]
    Reqwest(#[from] reqwest::Error),

    #[error("a json error occurred: {0}")]
    Json(#[from] serde_json::Error),

    #[error("unable to crack hash of nonce {0}")]
    CouldNotCrack(u32),
}

/// Data received from api/mine/start/skrt.
///
/// This contains the nonce to be cracked and is returned as json:
/// ```json
/// {
///     "nonce": 123456,
///     "uuid": "18b76a27-8b59-40c1-bd2f-9d0caeab3361"
/// }
/// ```
#[derive(Debug, Deserialize)]
struct StartData {
    /// The nonce to be cracked
    nonce: u32,

    /// The request UUID
    uuid: String,
}

/// Data sent to the server after cracking a hash.
#[derive(Debug, Serialize)]
struct SolutionData {
    /// The UUID of the request from which the cracked nonce originated
    uuid: String,

    /// The cracked hash as a hex string
    solution: u32,

    /// The public key of the wallet to add the mined currency to
    #[serde(rename = "walletKey")]
    wallet_key: String,
}

/// Retrieves the start data from the server.
///
/// # Parameters
/// * `http_client` - The http client to use for fetching the data.
async fn fetch_data(http_client: &reqwest::Client) -> Result<StartData, SkrtCoinError> {
    let response = http_client
        .get(format!("{}/api/mine/start/skrt", API_ENDPOINT))
        .send()
        .await?
        .error_for_status()?
        .json()
        .await?;
    Ok(response)
}

/// Cracks a hash based on its nonce.
///
/// # Parameters
/// * `nonce` - The nonce to crack.
fn crack_hash(nonce: u32) -> Result<u32, SkrtCoinError> {
    for i in 0..u32::MAX {
        let to_crack = nonce + i;
        let to_crack = format!("{}", to_crack);

        let digest = md5::compute(to_crack).0;
        let attempt = format_as_hex(digest)?;

        if attempt.starts_with("000000") {
            return Ok(i);
        }
    }

    Err(SkrtCoinError::CouldNotCrack(nonce))
}

/// Formats a slice as hex.
///
/// # Parameters
/// * `slice` - The slice to format.
fn format_as_hex(slice: [u8; 16]) -> Result<String, SkrtCoinError> {
    let mut out = String::new();

    for b in slice {
        write!(&mut out, "{:02x}", b)?;
    }

    Ok(out)
}

/// Posts a solution to the server.
///
/// # Parameters
/// * `http_client` - The http client to use for posting the data.
/// * `cracked` - The cracked hash data.
/// * `uuid` - The uuid of the request to answer.
async fn post_solution(http_client: &reqwest::Client, solution: u32, uuid: String) -> Result<(), SkrtCoinError> {
    let solution = SolutionData {
        uuid,
        solution,
        wallet_key: PUBLIC_KEY.into(),
    };

    http_client
        .post(format!("{}/api/mine/finish/skrt", API_ENDPOINT))
        .json(&solution)
        .send()
        .await?
        .error_for_status()?;

    Ok(())
}

#[tokio::main]
async fn main() {
    let http_client = reqwest::Client::new();

    loop {
        let data = fetch_data(&http_client)
            .await
            .expect("Failed to fetch data from server!");
        
        let cracked = crack_hash(data.nonce).expect("Failed to crack hash!");

        post_solution(&http_client, cracked, data.uuid)
            .await
            .expect("Failed to post solution!");
    }
}
