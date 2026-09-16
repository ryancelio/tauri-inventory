use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_updater::{Update, UpdaterExt};

use crate::{ApiResponse, AppState, RustApiError};

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

#[derive(Default)]
pub struct UpdateStateStore(Mutex<UpdateState>);

#[derive(Clone, Serialize)]
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

pub async fn check_update_internal(app: &AppHandle) {
    let updater = match app.updater() {
        Ok(u) => u,
        Err(e) => {
            eprintln!("Updater not configured: {e}");
            return;
        }
    };

    match updater.check().await {
        Ok(Some(update)) => {
            let metadata = UpdateMetadata::from_update(&update);
            if let Some(state) = app.try_state::<AppState>() {
                *state.pending_update.lock().unwrap() = Some(update);
            }
            let _ = app.emit("update://available", metadata);
        }
        Ok(None) => {}
        Err(e) => {
            eprintln!("Update check failed: {e}");
            let _ = app.emit("update://check-error", e.to_string());
        }
    }
}

#[tauri::command]
pub async fn check_for_update(app: AppHandle) -> Result<Option<UpdateMetadata>, RustApiError> {
    check_update_internal(&app).await;
    let state = app.state::<AppState>();
    let guard = state.pending_update.lock().unwrap();
    Ok(guard.as_ref().map(UpdateMetadata::from_update))
}

#[tauri::command]
pub fn get_pending_update(state: State<AppState>) -> Option<UpdateMetadata> {
    let guard = state.pending_update.lock().unwrap();
    guard.as_ref().map(UpdateMetadata::from_update)
}

#[tauri::command]
pub fn get_update_state(state: State<UpdateStateStore>) -> UpdateState {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
pub fn start_update(app: AppHandle) -> Result<(), RustApiError> {
    // Stop repeated windows
    if app.get_webview_window("update-progress").is_some() {
        return Err(RustApiError {
            code: 400,
            message: ApiResponse {
                response: "Atualização já em andamento, aguarde..".to_string(),
            },
        });
    }

    let update = {
        let state = app.state::<AppState>();
        let mut guard = state.pending_update.lock().unwrap();
        guard.take()
    }
    .ok_or_else(|| "No update available to install")?;

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
        // Restore the pending update so the user can retry, and do not leave
        // the app in a half-updated state.
        *app.state::<AppState>().pending_update.lock().unwrap() = Some(update);
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