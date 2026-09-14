use serde::{de::DeserializeOwned, Deserialize, Serialize};
use tauri::{AppHandle, State};
use tauri_plugin_http::reqwest::{RequestBuilder, Response};

use crate::{api_checks::health_check, log::log_to_default, ApiResponse, AppState, RustApiError};

pub mod atributo;
pub mod audit_logs;
pub mod categoria;
pub mod fabricante;
pub mod filters;
pub mod grupo;
pub mod mercadoria;
pub mod mercadoria_photos;
pub mod usuarios;

#[derive(Deserialize, Serialize)]
pub struct ApiListResponse<T> {
    pub data: Vec<T>,
    pub count: i32,
}

pub fn get_token(state: &State<'_, AppState>) -> Result<String, RustApiError> {
    let token = match state.jws_token.lock().unwrap().clone() {
        Some(val) => val,
        None => {
            return Err(RustApiError {
                code: 403,
                message: ApiResponse {
                    response: "Usuario não autenticado".to_string(),
                },
            })
        }
    };
    Ok(token)
}

// pub async fn get_response<T>(
//     http_client: &Client,
//     token: Option<String>,
//     app: &AppHandle,
//     body: Option<T>,
// ) -> Result<Response, RustApiError> {

// }

pub async fn try_connection(
    request: RequestBuilder,
    identifier: &String,
    state: &State<'_, AppState>,
    app: &AppHandle,
) -> Result<Response, RustApiError> {
    let res = match request.send().await {
        Ok(val) => Ok(val),
        Err(e) => {
            let _ = log_to_default(
                app,
                &format!("[{identifier}]: API connection error: {}", e.to_string()),
            )
            .await;

            health_check(&state, &app).await;

            Err(RustApiError {
                code: 503,
                message: ApiResponse {
                    response: "Erro de conexão. Verifique seu acesso à internet, ou entre em contato com o administrador".to_string(),
                },
            })
        }
    };
    res
}

pub async fn get_body<T: DeserializeOwned>(
    app: &AppHandle,
    response: Response,
    identifier: &String,
) -> Result<T, RustApiError> {
    if response.status().is_success() {
        let val: T = match response.json().await {
            Ok(val) => val,
            Err(e) => {
                let _ = log_to_default(
                    &app,
                    &format!(
                        "[{identifier}]: Erro processing response data: {}.",
                        e.to_string()
                    ),
                )
                .await;

                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro Interno. Entre em contato com um administrador".to_string(),
                    },
                });
            }
        };

        Ok(val)
    } else {
        let status = response.status();

        // Gets the error from the API response, else returns a generic error
        let error_body = match response.json::<ApiResponse>().await {
            Ok(body) => body,
            Err(e) => {
                let _ = log_to_default(
                    &app,
                    &format!(
                        "[{identifier}] Failed to decode error body: {}",
                        e.to_string()
                    ),
                )
                .await;
                ApiResponse {
                    response: "Erro desconhecido".to_string(),
                }
            }
        };

        Err(RustApiError {
            code: status.as_u16(),
            message: error_body,
        })
    }
}
