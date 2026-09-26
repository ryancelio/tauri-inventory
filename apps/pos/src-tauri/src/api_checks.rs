use serde::Serialize;
use std::sync::atomic::Ordering;

use tauri::{AppHandle, Emitter, State};

use crate::{
    config::api_url::get_api_url, log::log_to_default, ApiResponse, AppState, RustApiError,
};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiStatusInfo {
    pub is_online: bool,
    pub is_checking: bool,
}

pub async fn health_check(state: &State<'_, AppState>, app: &AppHandle) {
    state.is_checking.store(true, Ordering::Relaxed);
    app.emit("API://checking", true).unwrap();

    let api_url = get_api_url(&app).unwrap_or("localhost".to_string());
    let response = match state
        .http_client
        .get(format!("{api_url}/health"))
        .send()
        .await
    {
        Ok(val) => val,
        Err(e) => {
            println!("No response from API server");
            state.is_online.store(false, Ordering::Relaxed);
            state.is_checking.store(false, Ordering::Relaxed);

            log_to_default(
                &app,
                &format!("Falha ao conectar ao servidor: {}", e.to_string()),
            )
            .await;
            app.emit("API://checking", false).unwrap();
            app.emit("API://available", false).unwrap();

            return;
        }
    };

    println!("Response from api server.");

    if response.status().is_success() {
        println!("Response was OK.");
        state.is_online.store(true, Ordering::Relaxed);
        log_to_default(&app, &format!("Conexão ao servidor realizada com sucesso!")).await;
    } else {
        println!("Response was error");
        state.is_online.store(false, Ordering::Relaxed);
        log_to_default(&app, &format!(
            "Conexão ao servidor realizada, porem servidor retornou erro. Considerando como offline."
        ))
        .await;
    }

    state.is_checking.store(false, Ordering::Relaxed);
    app.emit("API://checking", false).unwrap();
    app.emit("API://available", state.is_online.load(Ordering::Relaxed))
        .unwrap();
}

#[tauri::command]
pub fn get_api_status(state: State<'_, AppState>) -> bool {
    // let val = *state.is_online.lock().unwrap();
    let val = state.is_online.load(Ordering::Relaxed);
    println!("saved status check: {val}");

    val
}

#[tauri::command]
pub fn get_api_status_check(state: State<'_, AppState>) -> ApiStatusInfo {
    ApiStatusInfo {
        is_online: state.is_online.load(Ordering::Relaxed),
        is_checking: state.is_checking.load(Ordering::Relaxed),
    }
}

// CHECK NECESSITY OF RETURN VALUE HERE
#[tauri::command]
pub async fn recheck_api_status(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    health_check(&state, &app).await;
    let is_online = state.is_online.load(Ordering::Relaxed);
    if is_online {
        Ok(ApiResponse {
            response: "Conexão Reestabelecida com sucesso".to_string(),
        })
    } else {
        Err(RustApiError {
            code: 400,
            message: ApiResponse {
                response: "Não foi possível estabelecer uma conexão ao servidor.".to_string(),
            },
        })
    }
}
