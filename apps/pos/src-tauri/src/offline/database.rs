use keyring::Entry;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Pool, Sqlite,
};
use tauri::AppHandle;

use crate::{config::local_db_path::get_local_db_path, ApiResponse, AppState, RustApiError};

pub mod off_atributos;
pub mod off_categorias;
pub mod off_fabricantes;
pub mod off_filters;
pub mod off_grupos;
pub mod off_mercadorias;
pub mod off_users;
pub mod off_audit_logs;

pub fn get_db_pool(
    state: &tauri::State<'_, AppState>,
) -> Result<sqlx::Pool<sqlx::Sqlite>, RustApiError> {
    match state.db.lock().unwrap().clone() {
        Some(val) => return Ok(val),
        None => {
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: "Banco de dados local indisponível no momento.".to_string(),
                },
            })
        }
    }
}

pub async fn create_db_connection(app: &AppHandle) -> Result<Pool<Sqlite>, RustApiError> {
    // let db_pass = "password4312";
    let db_pass = get_db_pass()?;

    let db_path = get_local_db_path(&app).await?;
    println!("{}",db_path.clone().to_string_lossy());

    // println!("{:?}", db_path);

    let options = SqliteConnectOptions::new()
        .filename(db_path)
        .pragma("key", db_pass);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await
        .map_err(|e| RustApiError {
            code: 400,
            message: ApiResponse {
                response: "Banco de dados nao disponivel. Não é possivel entrar em modo offline"
                    .to_string(),
            },
        });
    pool
}

const APP_SERVICE: &str = "EstoqueCelioMoveis";
const DB_ACCOUNT: &str = "CelioMoveis";

pub fn get_db_pass() -> Result<String, RustApiError> {
    let entry = Entry::new(APP_SERVICE, DB_ACCOUNT).map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao obter senha no banco de dados: {e}"),
        },
    })?;

    entry.get_password().map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao obter senha no banco de dados: {e}"),
        },
    })
}

#[tauri::command]
pub async fn set_db_pass(pass: String) -> Result<ApiResponse, RustApiError> {
    let entry = Entry::new(APP_SERVICE, DB_ACCOUNT).map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao salvar senha no banco de dados: {e}"),
        },
    })?;

    entry.set_password(&pass).map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao salvar senha no banco de dados: {e}"),
        },
    })?;

    Ok(ApiResponse {
        response: String::from("Senha salva com sucesso!"),
    })
}
