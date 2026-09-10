use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::config::api_url::{self, get_api_url};
use crate::database::grupo::{Grupo, GrupoDB};
use crate::database::{get_body, get_token, try_connection};
use crate::log::log_to_default;
use crate::offline::database::off_categorias::{offline_get_categorias, SQLiteCategoria};
use crate::{ApiResponse, AppState, RustApiError};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Categoria {
    pub id: i32,
    pub nome: String,
    pub grupo: GrupoDB,
    pub created_at: String,
    pub updated_at: String,
}
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CategoriaDB {
    pub id: i32,
    pub nome: String,
    pub grupo_id: i32,
    pub updated_at: String,
    pub created_at: String,
}
impl From<SQLiteCategoria> for CategoriaDB {
    fn from(value: SQLiteCategoria) -> Self {
        Self {
            id: value.id,
            nome: value.nome,
            grupo_id: value.grupo_id,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

/*
    #[serde(skip_serializing_if = "Option::is_none")]
    None = undefined
    Some(None) = null
    Some(val) = val
*/
#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CategoriaDBSent {
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    nome: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    grupo_id: Option<Option<i32>>,
}

#[tauri::command]
pub async fn create_categoria(
    categoria: CategoriaDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/categorias"))
        .json(&categoria)
        .bearer_auth(token);

    let identifier = &String::from("get_categorias");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_categorias(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<Categoria>, RustApiError> {
    let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);

    if is_offline_mode {
        return offline_get_categorias(&state).await;
    }

    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/categorias"))
        .bearer_auth(token);

    let identifier = &String::from("get_categorias");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn update_categoria(
    id: i32,
    categoria: CategoriaDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .put(format!("{api_url}/categorias/{id}"))
        .json(&categoria)
        .bearer_auth(token);

    let identifier = &String::from("update_categoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn delete_categoria(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/categorias/{id}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_categoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn reassign_categoria(
    state: State<'_, AppState>,
    app: AppHandle,
    old_cat_id: i32,
    new_cat_id: i32,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!(
            "{api_url}/categorias/{old_cat_id}/reassign/{new_cat_id}"
        ))
        .bearer_auth(token);

    let identifier = &String::from("reassign_categoria");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn get_categoria_merc_count(
    cat_id: i32,
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<i32, RustApiError> {
    let api_url = get_api_url(&app);

    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/categorias/{cat_id}/mercadorias/count"))
        .bearer_auth(token);

    let identifier = &String::from("get_categoria_merc_count");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}
