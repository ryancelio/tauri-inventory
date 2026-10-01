use std::fs;

use chrono::{DateTime, Utc};
use tauri::{AppHandle, State};

use crate::{
    config::{
        api_url::get_api_url,
        local_db_path::{get_last_backup_date, get_local_db_path, set_backup_date},
    },
    database::{get_token, try_connection},
    log::log_to_default,
    ApiResponse, AppState, RustApiError,
};

#[tauri::command]
pub async fn get_backup_date(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, RustApiError> {
    get_last_backup_date(&app, &state).await
}

/// Checks if a backup was download today, and downloads if not.
#[tauri::command]
pub async fn automatic_backup_download(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<(), RustApiError> {
    let last_backup_date = get_last_backup_date(&app, &state).await?;

    let should_redownload = match DateTime::parse_from_rfc3339(&last_backup_date) {
        Ok(last_backup) => last_backup.date_naive() < Utc::now().date_naive(),
        Err(_) => true,
    };

    if should_redownload {
        let _ = get_latest_backup(app, state).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_latest_backup(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ApiResponse, RustApiError> {
    let db_file_path = get_local_db_path(&app).await?;
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/backup/download/full"))
        .bearer_auth(token);

    let identifier = &String::from("get_latest_backup");
    let response: tauri_plugin_http::reqwest::Response =
        try_connection(request, identifier, &state, &app).await?;

    let bytes = response.bytes().await.map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao baixar arquivo: {e}"),
        },
    })?;

    fs::write(db_file_path, bytes).map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao baixar arquivo: {e}"),
        },
    })?;

    set_backup_date(&app).await?;

    let _ = log_to_default(&app, &format!("Database backup download sucessful!")).await;
    Ok(ApiResponse {
        response: String::from("Backup salvo com sucesso!"),
    })
}
