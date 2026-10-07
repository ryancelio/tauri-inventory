use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::{
    config::api_url::get_api_url,
    database::{get_body, get_token, try_connection},
    offline::database::off_lojas::offline_get_lojas,
    AppState, RustApiError,
};

#[derive(Debug, Serialize, Deserialize, Clone, Default, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct Loja {
    pub id: i32,
    pub nome: String,
    #[serde(rename = "CNPJ")]
    #[sqlx(rename = "CNPJ")]
    pub cnpj: String,
    pub created_at: String,
    pub updated_at: String,
}

#[tauri::command]
pub async fn get_lojas(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<Vec<Loja>, RustApiError> {
    let is_offline = state.is_offline_mode.load(Ordering::Relaxed);

    if is_offline {
        return offline_get_lojas(&state).await;
    }

    let token = get_token(&state)?;
    let api_url = get_api_url(&app)?;

    let request = state
        .http_client
        .get(format!("{api_url}/lojas"))
        .bearer_auth(token);

    let identifier = String::from("get_lojas");

    let response = try_connection(request, &identifier, &state, &app).await?;

    let body = get_body(&app, response, &identifier).await?;

    Ok(body)
}
