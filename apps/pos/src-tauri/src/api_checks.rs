use std::sync::atomic::Ordering;

use tauri::{AppHandle, Emitter, State};

use crate::{
    config::api_url::get_api_url, log::log_to_default, ApiResponse, AppState, RustApiError,
};

pub async fn health_check(state: &State<'_, AppState>, app: &AppHandle) {
    app.emit("checking-api-connection", true).unwrap();

    let api_url = get_api_url(&app);
    let response = match state
        .http_client
        .get(format!("{api_url}/health"))
        .send()
        .await
    {
        Ok(val) => val,
        Err(e) => {
            println!("No response from API server");
            {
                // let mut on_state = state.is_online.lock().unwrap();
                // *on_state = false;
                state.is_online.store(false, Ordering::Relaxed);
            } // O MutexGuard é liberado aqui, antes do .await

            log_to_default(&app, &format!("Falha ao conectar ao servidor: {}", e.to_string())).await;
            app.emit("checking-api-connection", false).unwrap();
            app.emit("api-online", false).unwrap();

            return;
        }
    };

    println!("Response from api server.");

    if response.status().is_success() {
        println!("Response was OK.");
        {
            // let mut on_state = state.is_online.lock().unwrap();
            // *on_state = true;
            state.is_online.store(true, Ordering::Relaxed);
        } // Liberado antes do .await
        log_to_default(&app, &format!("Conexão ao servidor realizada com sucesso!")).await;
        app.emit("checking-api-connection", false).unwrap();
        app.emit("api-online", true).unwrap();
    } else {
        println!("Response was error");
        {
            // let mut on_state = state.is_online.lock().unwrap();
            // *on_state = false;
            state.is_online.store(false, Ordering::Relaxed);
        } // Liberado antes do .await

        log_to_default(&app, &format!(
            "Conexão ao servidor realizada, porem servidor retornou erro. Considerando como offline."
        ))
        .await;
        app.emit("checking-api-connection", false).unwrap();
        app.emit("api-online", false).unwrap();
        return;
    }
}

#[tauri::command]
pub fn get_api_status(state: State<'_, AppState>) -> bool {
    // let val = *state.is_online.lock().unwrap();
    let val = state.is_online.load(Ordering::Relaxed);
    println!("saved status check: {val}");

    val
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
