use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::config::api_url::get_api_url;
use crate::database::{get_body, get_token, try_connection};
use crate::offline::database::off_categorias::SQLiteCategoria;
use crate::offline::database::off_grupos::{offline_get_grupos, SQLiteGrupo};
use crate::{ApiResponse, AppState, RustApiError};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CategoriaResumo {
    pub id: i32,
    pub nome: String,
    pub updated_at: String,
    pub created_at: String,
}
impl From<SQLiteCategoria> for CategoriaResumo {
    fn from(value: SQLiteCategoria) -> Self {
        Self {
            id: value.id,
            nome: value.nome,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Grupo {
    pub id: i32,
    pub nome: String,
    pub categorias: Vec<CategoriaResumo>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GrupoDB {
    pub id: i32,
    pub nome: String,
    pub created_at: String,
    pub updated_at: String,
}
impl From<SQLiteGrupo> for GrupoDB {
    fn from(value: SQLiteGrupo) -> Self {
        Self {
            id: value.id,
            nome: value.nome,
            created_at: value.created_at,
            updated_at: value.updated_at,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct GrupoDBSent {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Option<i32>>,
    pub nome: String,
}

#[tauri::command]
pub async fn get_grupos(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<Grupo>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);

        if is_offline_mode {
            return offline_get_grupos(&state).await;
        }
    }
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/grupos"))
        .bearer_auth(token);

    let identifier = &String::from("get_grupos");

    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body::<Vec<Grupo>>(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn create_grupo(
    grupo: GrupoDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;

    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/grupos"))
        .bearer_auth(token)
        .json(&grupo);

    let identifier = &String::from("create_grupo");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn update_grupo(
    id: i32,
    grupo: GrupoDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;

    let token = get_token(&state)?;

    let request = state
        .http_client
        .put(format!("{api_url}/grupos/{id}"))
        .bearer_auth(token)
        .json(&grupo);

    let identifier = &String::from("update_grupo");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn delete_grupo(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;

    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/grupos/{id}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_grupo");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}
