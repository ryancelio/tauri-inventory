use std::{
    fs,
    time::{SystemTime, UNIX_EPOCH},
};

use chrono::{DateTime, Utc};
use tauri::{AppHandle, State};

use crate::{
    config::{
        api_url::get_api_url,
        local_db_path::{get_last_backup_date, get_local_db_path, set_backup_date},
    },
    database::{get_token, try_connection},
    ApiResponse, AppState, RustApiError,
};

#[tauri::command]
pub async fn get_backup_date(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, RustApiError> {
    // let db_file_path = get_local_db_path(&app);
    // let metadata: fs::Metadata = fs::metadata(db_file_path).map_err(|err| RustApiError {
    //     code: 500,
    //     message: crate::ApiResponse {
    //         response: format!("{err}"),
    //     },
    // })?;

    // if let Ok(created_time) = metadata.created() {
    //     let since: DateTime<Utc> = created_time.into();
    //     Ok(since.to_rfc3339().to_string())
    // } else {
    //     Err(RustApiError {
    //         code: 500,
    //         message: crate::ApiResponse {
    //             response: "Erro ao receber tempo do arquivo".to_string(),
    //         },
    //     })
    // }

    get_last_backup_date(app, state).await
}

#[tauri::command]
pub async fn get_latest_backup(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ApiResponse, RustApiError> {
    let db_file_path = get_local_db_path(&app).await?;
    let api_url = get_api_url(&app);
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

    set_backup_date(app).await?;
    Ok(ApiResponse {
        response: String::from("Backup salvo com sucesso!"),
    })
}
