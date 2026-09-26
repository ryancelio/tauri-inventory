use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::config::api_url::get_api_url;
use crate::database::{get_body, get_token, try_connection};
use crate::offline::database::off_atributos::{offline_get_atributos, SQLiteAtributo};
use crate::{ApiResponse, AppState, RustApiError};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]

pub enum AtributoTipo {
    Text,
    Number,
    Boolean,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Atributo {
    pub id: i32,
    pub nome: String,
    pub tipo: AtributoTipo,
    pub created_at: String,
    pub updated_at: String,
}
impl TryFrom<SQLiteAtributo> for Atributo {
    type Error = RustApiError;
    fn try_from(value: SQLiteAtributo) -> Result<Self, Self::Error> {
        let tipo = match value.tipo.as_str() {
            "text" => AtributoTipo::Text,
            "number" => AtributoTipo::Number,
            "boolean" => AtributoTipo::Boolean,
            _ => {
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                })
            }
        };

        Ok(Self {
            id: value.id,
            nome: value.nome,
            tipo: tipo,
            created_at: value.created_at,
            updated_at: value.updated_at,
        })
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]

pub struct AtributoDBSent {
    id: Option<i32>,
    nome: String,
    tipo: String,
}

#[tauri::command]
pub async fn get_atributos(
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<Vec<Atributo>, RustApiError> {
    {
        let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);
        if is_offline_mode {
            return offline_get_atributos(state).await;
        }
    }

    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .get(format!("{api_url}/atributos"))
        .bearer_auth(token);

    let identifier = &String::from("get_atributos");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn create_atributo(
    atributo: AtributoDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/atributos"))
        .json(&atributo)
        .bearer_auth(token);

    let identifier = &String::from("create_atributos");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn update_atributo(
    id: i32,
    atributo: AtributoDBSent,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .put(format!("{api_url}/atributos/{id}"))
        .json(&atributo)
        .bearer_auth(token);

    let identifier = &String::from("update_atributos");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn delete_atributo(
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/atributos/{id}"))
        .bearer_auth(token);

    let identifier = &String::from("delete_atributos");
    let response = try_connection(request, identifier, &state, &app).await?;
    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}
