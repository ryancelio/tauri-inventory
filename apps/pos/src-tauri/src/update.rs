use std::sync::Mutex;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_store::StoreExt;
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::{config::CONFIG_PATH, ApiResponse, RustApiError};

#[derive(Clone, Copy, Serialize, Default, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum UpdateStatus {
    #[default]
    Idle,
    Downloading,
    Finished,
    Error,
}

#[derive(Clone, Serialize, Default)]
pub struct UpdateState {
    status: UpdateStatus,
    downloaded: usize,
    total: Option<u64>,
    message: Option<String>,
}

// In-memory state used only to report download progress to the progress
// window. The update info itself is persisted in config.json.
#[derive(Default)]
pub struct UpdateStateStore(Mutex<UpdateState>);

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateMetadata {
    version: String,
    current_version: String,
    date: Option<String>,
    body: Option<String>,
}

impl UpdateMetadata {
    fn from_update(u: &Update) -> Self {
        Self {
            version: u.version.clone(),
            current_version: u.current_version.clone(),
            date: u.date.map(|d| d.to_string()),
            body: u.body.clone(),
        }
    }
}

/// Returns true when the last check happened on a calendar day before today,
/// i.e. it is time to check again. Does not care about 24h having passed.
fn should_update(string: &str) -> bool {
    match DateTime::parse_from_rfc3339(string) {
        Ok(parsed_value) => parsed_value.date_naive() < Utc::now().date_naive(),
        Err(_) => true,
    }
}

/// Saved update info from config.json. Used **only** so the user can view the
/// available update; downloading always uses a freshly fetched `Update`.
fn get_saved_update(app: &AppHandle) -> Option<UpdateMetadata> {
    let store = app.store(CONFIG_PATH).ok()?;
    let value = store.get("last_update")?;
    serde_json::from_value::<UpdateMetadata>(value).ok()
}

/// Asks GitHub for the latest release, persists the result in config.json and
/// records the date of the check so the automatic flow runs at most once a
/// day. Returns the raw `Update` so callers that want to install it get a
/// fresh object confirming it still exists and is the latest version.
async fn check_update(app: &AppHandle) -> Result<Option<Update>, RustApiError> {
    let updater = app.updater().map_err(|e| {
        eprintln!("Updater not configured: {e}");
        let _ = app.emit("update://check-error", e.to_string());
        RustApiError::from(e.to_string())
    })?;

    let store = app.store(CONFIG_PATH).map_err(|_| "Falha ao abrir store")?;

    let result: Result<Option<Update>, tauri_plugin_updater::Error> = match updater.check().await {
        Ok(Some(update)) => {
            let metadata = UpdateMetadata::from_update(&update);
            store.set("last_update", json!(metadata));
            let _ = app.emit("update://available", metadata);
            Ok(Some(update))
        }
        Ok(None) => {
            // Already up to date: drop any previously saved update info so the
            // UI does not keep offering an obsolete version.
            store.delete("last_update");
            Ok(None)
        }
        Err(e) => {
            eprintln!("Update check failed: {e}");
            let _ = app.emit("update://check-error", e.to_string());
            Err(e)
        }
    };

    // Only one github check per day, no matter the outcome.
    store.set("last_update_date", Utc::now().to_rfc3339());
    let _ = store.save();

    result.map_err(|e| RustApiError::from(e.to_string()))
}

#[tauri::command]
pub async fn automatic_update_check(
    app: AppHandle,
) -> Result<Option<UpdateMetadata>, RustApiError> {
    let store = app.store(CONFIG_PATH).map_err(|_| "Falha ao abrir store")?;

    let last_check = store
        .get("last_update_date")
        .and_then(|value| value.as_str().map(str::to_owned));

    // Skip the github check when one already happened today. With no saved
    // date (first run) we check, otherwise a fresh install would never look.
    if let Some(date) = last_check.as_deref() {
        if !should_update(date) {
            return Ok(get_saved_update(&app));
        }
    }

    let result = check_update(&app).await?;
    Ok(result.as_ref().map(UpdateMetadata::from_update))
}

#[tauri::command]
pub async fn force_check_update(app: AppHandle) -> Result<Option<UpdateMetadata>, RustApiError> {
    let result = check_update(&app).await?;
    Ok(result.as_ref().map(UpdateMetadata::from_update))
}

#[tauri::command]
pub fn command_get_pending_update(app: AppHandle) -> Option<UpdateMetadata> {
    get_saved_update(&app)
}

#[tauri::command]
pub fn get_update_state(state: State<UpdateStateStore>) -> UpdateState {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub async fn start_update(app: AppHandle) -> Result<(), RustApiError> {
    // Stop repeated windows
    if app.get_webview_window("update-progress").is_some() {
        return Err(RustApiError {
            code: 400,
            message: ApiResponse {
                response: "Atualização já em andamento, aguarde..".to_string(),
            },
        });
    }

    // Ask github again before downloading to confirm the update still exists
    // and is the latest version available.
    let update = match check_update(&app).await {
        Ok(Some(update)) => update,
        Ok(None) => {
            return Err(RustApiError {
                code: 400,
                message: ApiResponse {
                    response: "Nenhuma atualização disponível no momento.".to_string(),
                },
            })
        }
        Err(e) => return Err(e),
    };

    if let Err(err) = WebviewWindowBuilder::new(
        &app,
        "update-progress",
        WebviewUrl::App("index.html#/update-progress".into()),
    )
    .title("Atualizando..")
    .inner_size(360.0, 230.0)
    .resizable(false)
    .center()
    .closable(false)
    .build()
    {
        eprintln!("Failed to open update window: {err}");
        return Err(RustApiError {
            code: 500,
            message: ApiResponse {
                response: "Erro interno ao abrir janela para atualizar".to_string(),
            },
        });
    }

    // Ideal UX: close the main window while the update is applied. If the
    // update fails, the installed version is untouched and the user simply
    // reopens the app to keep using it in its safe state.
    if let Some(main_win) = app.get_webview_window("main") {
        if let Err(e) = main_win.close() {
            eprintln!("Failed to close main window: {e}");
        }
    }

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Err(e) = run_update(app_handle.clone(), update).await {
            update_state_and_emit(
                &app_handle,
                UpdateState {
                    status: UpdateStatus::Error,
                    downloaded: 0,
                    total: None,
                    message: Some(e.message.response),
                },
            );
        }
    });
    Ok(())
}

fn update_state_and_emit(app: &AppHandle, new_state: UpdateState) {
    if let Some(store) = app.try_state::<UpdateStateStore>() {
        *store.0.lock().unwrap() = new_state.clone();
    }
    let _ = app.emit_to("update-progress", "update://progress", new_state);
}

pub async fn run_update(app: AppHandle, update: Update) -> Result<(), RustApiError> {
    update_state_and_emit(
        &app,
        UpdateState {
            status: UpdateStatus::Downloading,
            downloaded: 0,
            total: None,
            message: None,
        },
    );

    let downloaded = Mutex::new(0usize);
    let app_progress = app.clone();

    update
        .download_and_install(
            move |chunk_length, content_length| {
                let mut d = downloaded.lock().unwrap();
                *d += chunk_length;
                update_state_and_emit(
                    &app_progress,
                    UpdateState {
                        status: UpdateStatus::Downloading,
                        downloaded: *d,
                        total: content_length,
                        message: None,
                    },
                );
            },
            || {},
        )
        .await
        .map_err(|e| format!("Atualização falhou: {e}"))?;

    update_state_and_emit(
        &app,
        UpdateState {
            status: UpdateStatus::Finished,
            downloaded: 0,
            total: None,
            message: None,
        },
    );

    tokio::time::sleep(std::time::Duration::from_millis(600)).await;

    app.restart(); // never returns
}