use std::path::PathBuf;

use chrono::Utc;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_store::StoreExt;

use crate::{
    log::log_to_default, offline::backups::get_latest_backup, ApiResponse, AppState, RustApiError,
};

pub const DEFAULT_LOCAL_DB_PATH: &'static str = "sqlchipher.db";

pub async fn get_local_db_path(app: &AppHandle) -> Result<PathBuf, RustApiError> {
    let file_path = app.path().app_local_data_dir();

    return match file_path {
        Ok(val) => Ok(val.join(DEFAULT_LOCAL_DB_PATH)),
        Err(error) => {
            {
                log_to_default(
                    app,
                    &format!("Erro ao acessar localDataDir: {}", error.to_string()),
                )
                .await;
            }
            Err(RustApiError {
                code: 400,
                message: ApiResponse {
                    response: String::from("Erro ao acessar arquivo de logs"),
                },
            })
        }
    };
}

pub async fn get_last_backup_date(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, RustApiError> {
    let store = match app.store("config.json") {
        Ok(val) => val,
        Err(e) => {
            println!("[get_last_backup_date]: {e}");
            return Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Erro interno ao receber caminho do banco de dados local."
                        .to_string(),
                },
            });
        }
    };

    // Data salva - Há backup em disco
    if let Some(val) = store.get("last_backup_date") {
        return Ok(val.to_string());
    }
    // ---- Sem data salva - não há backup em disco ----

    // Usuario Fazendo Request de data apos logado
    if state.user_data.lock().unwrap().is_some() {
        get_latest_backup(app.clone(), state.clone()).await?;
        match store.get("last_backup_date") {
            Some(val) => Ok(val.to_string()),
            None => Err(RustApiError {
                code: 401,
                message: ApiResponse {
                    response: "Data de backup não encontrada mesmo após tentar atualizar."
                        .to_string(),
                },
            }),
        }
    // Usuario fazendo request de data sem estar logado e sem backup em disco.
    // Nao há como logar em modo offline sem backup em disco
    } else {
        return Err(RustApiError {
            code: 400,
            message: ApiResponse {
                response: "Backup necessario para entrar em modo offline".to_string(),
            },
        });
    }
}

pub async fn set_backup_date(app: AppHandle) -> Result<ApiResponse, RustApiError> {
    let store = match app.store("config.json") {
        Ok(val) => val,
        Err(e) => {
            println!("[set_db_path]: {e}");
            return Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Erro interno ao receber caminho do banco de dados local."
                        .to_string(),
                },
            });
        }
    };

    let now = Utc::now().to_rfc3339();

    store.set("last_backup_date", now.to_string());

    Ok(ApiResponse {
        response: format!("Data atualizada com sucesso!"),
    })
}
