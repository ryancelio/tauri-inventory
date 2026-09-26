use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use std::sync::atomic::AtomicBool;
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_http::reqwest::Client;

mod api_checks;
mod auth;
mod config;
mod database;
mod log;
mod offline;
mod printers;
mod update;

pub struct AppState {
    // Secure token recieved from API, will be null before logging in
    pub jws_token: Mutex<Option<String>>,
    // Shared client for connections
    pub http_client: Client,
    // Logged user info, will be null before logging in
    // Decoded from token
    pub user_data: Mutex<Option<database::usuarios::LoggedUser>>,

    // Check for API access
    pub is_online: AtomicBool,
    // Whether a health check is currently in progress
    pub is_checking: AtomicBool,
    // Offline access

    // Connection to local DB, for offline access
    pub db: Mutex<Option<Pool<Sqlite>>>,
    pub is_offline_mode: AtomicBool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ApiResponse {
    pub response: String,
}
#[derive(Serialize, Deserialize)]
pub struct RustApiError {
    pub code: u16,
    pub message: ApiResponse,
}
impl From<String> for RustApiError {
    fn from(value: String) -> Self {
        RustApiError {
            code: 500,
            message: ApiResponse { response: value },
        }
    }
}
impl From<&str> for RustApiError {
    fn from(value: &str) -> Self {
        RustApiError {
            code: 500,
            message: ApiResponse {
                response: value.to_string(),
            },
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .expect("Failed to create request client");

    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let handle = app.handle().clone();

            handle.manage(AppState {
                jws_token: Mutex::new(None),
                http_client: client,
                user_data: Mutex::new(None),
                db: Mutex::new(None),
                is_online: AtomicBool::new(false),
                is_checking: AtomicBool::new(false),
                is_offline_mode: AtomicBool::new(false),
            });

            handle.manage(update::UpdateStateStore::default());

            let async_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                let state = async_handle.state::<AppState>();
                tokio::join!(api_checks::health_check(&state, &async_handle));
            });
            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            database::mercadoria::get_mercadorias,
            database::mercadoria::get_single_mercadoria,
            database::mercadoria::get_similar_mercs,
            database::mercadoria::update_similar_by_id,
            database::mercadoria::get_mercadoria_report,
            database::mercadoria::update_mercadoria,
            database::mercadoria::create_mercadoria,
            database::mercadoria::delete_mercadoria,
            database::mercadoria::get_mercadoria_key_listing,
            database::mercadoria::get_mercadorias_simple,
            database::mercadoria::get_mercadorias_simple_log,
            database::categoria::get_categorias,
            database::categoria::create_categoria,
            database::categoria::update_categoria,
            database::categoria::delete_categoria,
            database::categoria::reassign_categoria,
            database::categoria::get_categoria_merc_count,
            database::fabricante::get_fabricantes,
            database::fabricante::criar_fabricante,
            database::fabricante::editar_fabricante,
            database::fabricante::deletar_fabricante,
            database::fabricante::get_fabricante_mercadoria_count,
            database::fabricante::reassign_fabricante,
            database::fabricante::cascade_delete_fab,
            database::grupo::get_grupos,
            database::grupo::create_grupo,
            database::grupo::update_grupo,
            database::grupo::delete_grupo,
            database::usuarios::login,
            database::usuarios::get_user_data,
            database::usuarios::logout,
            database::usuarios::get_usuarios,
            database::usuarios::criar_usuario,
            database::usuarios::update_usuario,
            database::usuarios::deletar_usuario,
            database::atributo::get_atributos,
            database::atributo::create_atributo,
            database::atributo::update_atributo,
            database::atributo::delete_atributo,
            database::mercadoria_photos::upload_merc_photo,
            database::mercadoria_photos::get_merc_photos,
            database::mercadoria_photos::delete_merc_photo,
            database::mercadoria_photos::upload_key_photo,
            database::mercadoria_photos::get_key_photos,
            database::mercadoria_photos::delete_key_photo,
            database::audit_logs::get_logs_all,
            database::audit_logs::get_logs_mercadoria,
            database::audit_logs::get_logs_usuario,
            database::audit_logs::get_logs_fabricante,
            config::api_url::command_get_api_url,
            config::api_url::change_api_url,
            config::api_url::check_api_url,
            // config::local_db_path::command_get_db_path,
            // config::local_db_path::set_db_path,
            api_checks::get_api_status,
            api_checks::get_api_status_check,
            api_checks::recheck_api_status,
            offline::database::off_mercadorias::offline_get_mercadorias,
            offline::database::set_db_pass,
            offline::get_offline_mode,
            offline::set_offline_mode,
            offline::check_db_exists,
            offline::backups::get_backup_date,
            offline::backups::get_latest_backup,
            printers::get_printers,
            printers::print_pdf,
            update::start_update,
            update::automatic_update_check,
            update::command_get_pending_update,
            update::get_update_state,
            update::force_check_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
