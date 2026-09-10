use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::utils::acl::identifier;
use tauri::{AppHandle, State};

use crate::config::api_url::get_api_url;
use crate::database::mercadoria::types::MercReportFabricante;
use crate::database::{fabricante, get_body, get_token, try_connection};
use crate::offline::database::off_fabricantes::{offline_get_fabricantes, SQLiteFabricante};
use crate::{log::log_to_default, ApiResponse, AppState, RustApiError};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Fabricante {
    pub id: i32,
    pub nome: String,
    pub created_at: String,
    pub updated_at: String,
}
impl From<SQLiteFabricante> for Fabricante {
    fn from(value: SQLiteFabricante) -> Self {
        Self {
            id: value.id,
            nome: value.nome,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}
impl Into<MercReportFabricante> for Fabricante {
    fn into(self) -> MercReportFabricante {
        MercReportFabricante {
            id: self.id,
            nome: self.nome,
        }
    }
}

#[tauri::command]
pub async fn get_fabricantes(
    state: State<'_, AppState>,
    app: AppHandle,
    get_deleted: Option<bool>,
) -> Result<Vec<Fabricante>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_fabricantes(&state).await;
        }
    }
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/fabricantes");

    if let Some(get_deleted) = get_deleted {
        url = format!("{url}?all={get_deleted}")
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_fabricantes");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_fabricante_mercadoria_count(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<i32, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return Ok(0);
            // return offline_get_fabricantes(&state).await;
        }
    }

    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/fabricantes/{id}/mercadorias/count"))
        .bearer_auth(token);

    let identifier = &String::from("get_fabricante_mercadoria_count");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FabricantePayload {
    pub nome: String,
}

#[tauri::command]
pub async fn criar_fabricante(
    state: State<'_, AppState>,
    fabricante: FabricantePayload,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/fabricantes"))
        .bearer_auth(token)
        .json(&fabricante);

    let identifier = &String::from("criar_fabricante");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[derive(Serialize, Deserialize)]
pub struct FabricanteDB {
    pub id: i32,
    pub nome: String,
}

#[tauri::command]
pub async fn editar_fabricante(
    id: i32,
    fabricante: FabricanteDB,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .put(format!("{api_url}/fabricantes/{id}"))
        .bearer_auth(token)
        .json(&fabricante);

    let identifier = &String::from("editar_fabricante");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn deletar_fabricante(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/fabricantes/{id}"))
        .bearer_auth(token);

    let identifier = &String::from("deletar_fabricante");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn reassign_fabricante(
    old_fab_id: i32,
    new_fab_id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!(
            "{api_url}/fabricantes/{old_fab_id}/reassign/{new_fab_id}"
        ))
        .bearer_auth(token);

    let identifier = &String::from("reassign_fabricante");

    let response = try_connection(request, identifier, &state, &app).await?;
    let body: ApiResponse = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn cascade_delete_fab(
    fab_id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/fabricantes/{fab_id}/cascade"))
        .bearer_auth(token);

    let identifier = &String::from("reassign_fabricante");

    let response = try_connection(request, identifier, &state, &app).await?;
    let body: ApiResponse = get_body(&app, response, identifier).await?;

    Ok(body)
}
