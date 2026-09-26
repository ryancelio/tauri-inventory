use std::{fs, sync::atomic::Ordering};

use tauri::{AppHandle, State};

use crate::{
    config::local_db_path::get_local_db_path, offline::database::create_db_connection, ApiResponse,
    AppState, RustApiError,
};

pub mod backups;
pub mod database;

#[tauri::command]
pub async fn set_offline_mode(
    val: bool,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let pool;
    if val == true {
        pool = Some(create_db_connection(&app).await?);
    } else {
        pool = None;
    }

    let mut db = state.db.lock().unwrap();
    *db = pool;

    {
        println!("offline_mod set to {:?}", val);
        state.is_offline_mode.store(val, Ordering::Relaxed);
    }

    Ok(ApiResponse {
        response: "Modo offline ativo com sucesso".to_string(),
    })
}

#[tauri::command]
pub fn get_offline_mode(state: State<'_, AppState>) -> bool {
    // let is_offline_mode = state.is_offline_mode.lock().unwrap();
    // println!("offline_mode returned: {:?}", *is_offline_mode);
    state.is_offline_mode.load(Ordering::Relaxed)
}

#[tauri::command]
pub async fn check_db_exists(app: AppHandle) -> Result<bool, RustApiError> {
    let db_path = get_local_db_path(&app).await?;
    match fs::exists(db_path) {
        Ok(val) => return Ok(val),
        Err(_) => {
            return Err(RustApiError {
                code: 404,
                message: ApiResponse {
                    response: "Banco de dados inexistente".to_string(),
                },
            })
        }
    }
}
