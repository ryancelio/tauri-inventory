use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::api_checks::health_check;
use crate::config::api_url::get_api_url;
use crate::{ApiResponse, AppState, RustApiError};

use crate::log::log_to_default;

// #[tauri::command]
// pub async fn form_login(
//     usuario: &str,
//     senha: &str,
//     state: State<'_, AppState>,
//     app: AppHandle,
// ) -> Result<LoggedUser, RustApiError> {
//     let api_url = get_api_url(&app);
//     let payload: LoginPayload<'_> = LoginPayload {
//         usuario: usuario,
//         senha: senha,
//     };

//     // health_check(&state, &app).await;

//     // Se após a checagem constar como offline, envia a resposta de erro ao Front-End sem tentar o POST
//     // if !*state.is_online.lock().unwrap() {
//     //     return Err(RustApiError {
//     //         code: 503, // Service Unavailable
//     //         message: ApiResponse {
//     //             response: "O servidor está offline ou inacessível. Verifique sua conexão."
//     //                 .to_string(),
//     //         },
//     //     });
//     // }

//     let response = match state
//         .http_client
//         .post(format!("{api_url}/login"))
//         .json(&payload)
//         .send()
//         .await
//     {
//         Ok(resp) => resp,

//         // Erro ao conectar à API
//         Err(e) => {
//             // Log Detailed error and ignore if it errors
//             let _ = log_to_default(&format!("Login API connection error: {}", e)).await;

//             return Err(RustApiError {
//                 code: 503,
//                 message: ApiResponse {
//                     response: "Erro de conexão. Verifique seu acesso à internet, ou entre em contato com o administrador".to_string(),
//                 },
//             });
//         }
//     };

//     if response.status().is_success() {
//         let val: LoginResponse = match response.json().await {
//             Ok(val) => val,
//             Err(e) => {
//                 let _ =
//                     log_to_default(&format!("Erro processing response data: {}", e.to_string()))
//                         .await;

//                 return Err(RustApiError {
//                     code: 500,
//                     message: ApiResponse {
//                         response: "Erro Interno. Entre em contato com um administrador".to_string(),
//                     },
//                 });
//             }
//         };

//         let mut token_lock = state.jws_token.lock().unwrap();

//         *token_lock = Some(val.token);

//         let mut user_lock = state.user_data.lock().unwrap();

//         *user_lock = Some(val.user.clone());

//         Ok(val.user)
//     } else {
//         let status = response.status();

//         // Gets the error from the API response, else returns a generic error
//         let error_body = response
//             .json::<ApiResponse>()
//             .await
//             .unwrap_or_else(|_| ApiResponse {
//                 response: "Erro desconhecido".to_string(),
//             });
//         Err(RustApiError {
//             code: status.as_u16(),
//             message: error_body,
//         })
//     }
// }

// #[tauri::command]
// pub fn logout(state: State<'_, AppState>) {
//     let mut token_lock = state.jws_token.lock().unwrap();
//     *token_lock = None;
// }

// #[tauri::command]
// pub fn get_user_data(state: State<'_, AppState>) -> Option<LoggedUser> {
//     let user = state.user_data.lock().unwrap().clone();
//     match user {
//         Some(val) => return Some(val),
//         None => return None,
//     }
// }
