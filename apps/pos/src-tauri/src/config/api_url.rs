use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};
use tauri_plugin_store::StoreExt;

use crate::{config::CONFIG_PATH, log::log_to_default, ApiResponse, AppState, RustApiError};

// pub const DEFAULT_API_URL: &'static str = "http://localhost:8080";

pub fn get_api_url(app: &AppHandle) -> Result<String, RustApiError> {
    let store = app.store(CONFIG_PATH).map_err(|_| "Falha ao abrir store")?;

    // Já existe
    if let Some(value) = store.get("api_url") {
        if let Some(url) = value.as_str() {
            return Ok(url.to_string());
        }
    }
    Err("URL da API não configurada".into())
}

/// Returns stored api_url value, if no value is stored, returns an empty string
#[tauri::command]
pub async fn command_get_api_url(app: AppHandle) -> Result<String, RustApiError> {
    let store = app.store("config.json").expect("Error opening store");
    if let Some(api_url) = store.get("api_url") {
        if let Some(url) = api_url.as_str() {
            return Ok(url.to_string());
        }
    }

    Ok(String::new())
}

#[tauri::command]
pub async fn change_api_url(new_url: String, app: AppHandle) -> Result<ApiResponse, RustApiError> {
    let store = app.store("config.json").expect("Falha ao abrir store");

    if let Some(value) = store.get("api_url") {
        if let Some(url) = value.as_str() {
            let _ = log_to_default(
                &app,
                &format!("Api Url changed from [{}] to [{}]", url, new_url),
            )
            .await;
        }
    }

    store.set("api_url", serde_json::json!(new_url));

    Ok("Nova api definida com sucesso".into())
}

#[derive(Serialize, Deserialize)]
struct ApiHealthCheck {
    response: String,
    timestamp: String,
}
#[tauri::command]
pub async fn check_api_url(
    url: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<ApiResponse, RustApiError> {
    let response = match state.http_client.get(format!("{url}/health")).send().await {
        Ok(val) => val,
        Err(e) => {
            let _ = log_to_default(&app, &format!("[check_api_url]: Invalid API URL: {e}")).await;
            return Err(RustApiError {
                code: 400,
                message: {
                    ApiResponse {
                        response: "URL Inválida.".to_string(),
                    }
                },
            });
        }
    };

    if response.status().is_success() {
        let body = match response.json::<ApiHealthCheck>().await {
            Ok(val) => val,
            Err(e) => {
                let _ = log_to_default(
                    &app,
                    &format!("[check_api_url]: Error decoding response body: {e}"),
                )
                .await;
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, entre em contato com um administrador".to_string(),
                    },
                });
            }
        };
        let _ = log_to_default(
            &app,
            &format!(
                "[check_api_url]: Check successfull for [{url}] at {}",
                body.timestamp
            ),
        )
        .await;
        Ok(ApiResponse {
            response: "URL Válida!".to_string(),
        })
    } else {
        let status = response.status();

        // Gets the error from the API response, else returns a generic error
        let error_body = response
            .json::<ApiResponse>()
            .await
            .unwrap_or_else(|_| ApiResponse {
                response: "Erro desconhecido".to_string(),
            });
        Err(RustApiError {
            code: status.as_u16(),
            message: error_body,
        })
    }
}

// #[derive(Clone, Serialize, Deserialize)]
// #[serde(rename_all="camelCase")]
// struct HealthCheckPayload {
//     is_online: bool,
// }
