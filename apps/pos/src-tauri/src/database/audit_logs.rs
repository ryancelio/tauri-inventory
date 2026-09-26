use serde::{Deserialize, Serialize};
// use sqlx::{prelude::FromRow, types::JsonRawValue};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, State};

use crate::{
    config::api_url::get_api_url,
    database::{get_body, get_token, try_connection, usuarios::LoggedUser, ApiListResponse},
    offline::database::off_audit_logs::{
        offline_get_all_audit_logs, offline_get_fabricante_logs, offline_get_mercadoria_logs,
        offline_get_usuario_logs,
    },
    AppState, RustApiError,
};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuditLogTargetType {
    Mercadoria,
    Fabricante,
    Categoria,
    Grupo,
    Usuario,
    Atributo,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuditLogAction {
    Create,
    Update,
    Delete,
    Login,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AuditLogLevel {
    Normal,
    Aviso,
    Critico,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: i32,
    #[serde(rename = "Usuario")]
    pub usuario: Option<LoggedUser>,
    pub alvo_tipo: AuditLogTargetType,
    pub alvo_id: Option<i32>,
    pub acao: AuditLogAction,
    pub nivel: AuditLogLevel,
    pub dados: Option<serde_json::Value>,
    pub data: String,
    pub ip: Option<String>,
}

#[tauri::command]
pub async fn get_logs_mercadoria(
    state: State<'_, AppState>,
    app: AppHandle,
    page: &'_ str,
    user_id: Option<i32>,
    merc_id: i32,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_mercadoria_logs(state, page, merc_id, user_id, action, level).await;
        }
    }

    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/logs/mercadoria/{merc_id}?page={page}");

    if let Some(user_id) = user_id {
        url = format!("{url}&userId={user_id}")
    };

    if let Some(action) = action {
        url = format!("{url}&action={action}")
    }

    if let Some(level) = level {
        url = format!("{url}&level={level}")
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_logs_mercadoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_logs_all(
    state: State<'_, AppState>,
    app: AppHandle,
    page: &'_ str,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_all_audit_logs(state, page, user_id, action, level).await;
        }
    }

    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/logs/all/?page={page}");

    if let Some(user_id) = user_id {
        url = format!("{url}&userId={user_id}")
    };

    if let Some(action) = action {
        url = format!("{url}&action={action}")
    }

    if let Some(level) = level {
        url = format!("{url}&level={level}")
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_logs_all");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_logs_usuario(
    state: State<'_, AppState>,
    app: AppHandle,
    page: &'_ str,
    user_id: Option<i32>,
    user_id_target: i32,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_usuario_logs(
                state, page, user_id_target, user_id, action, level,
            )
            .await;
        }
    }

    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/logs/usuario/{user_id_target}?page={page}");

    if let Some(user_id) = user_id {
        url = format!("{url}&userId={user_id}")
    };

    if let Some(action) = action {
        url = format!("{url}&action={action}")
    }

    if let Some(level) = level {
        url = format!("{url}&level={level}")
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_logs_usuario");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_logs_fabricante(
    state: State<'_, AppState>,
    app: AppHandle,
    page: &'_ str,
    fabricante_id: i32,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_fabricante_logs(state, page, fabricante_id, user_id, action, level)
                .await;
        }
    }

    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/logs/fabricante/{fabricante_id}?page={page}");

    if let Some(user_id) = user_id {
        url = format!("{url}&userId={user_id}")
    };

    if let Some(action) = action {
        url = format!("{url}&action={action}")
    }

    if let Some(level) = level {
        url = format!("{url}&level={level}")
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_logs_fabricante");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}
