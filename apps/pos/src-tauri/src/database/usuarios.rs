use std::process::id;
use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::http::request;
use tauri::{AppHandle, State};

use crate::config::api_url::get_api_url;
use crate::database::{get_body, get_token, try_connection};
use crate::offline::database::off_users::{
    offline_get_usuarios, offline_login, SQLiteLoggedUser, SQLiteUsuarioListing,
};
use crate::{log::log_to_default, ApiResponse, AppState, RustApiError};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Funcao {
    Vendedor,
    Gerente,
    Admin,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum Local {
    #[serde(rename = "02")]
    Loja02,
    #[serde(rename = "03")]
    Loja03,
    #[serde(rename = "04")]
    Loja04,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct LoggedUser {
    pub id: i32,
    pub nome: String,
    pub funcao: Funcao,
    pub local: Local,
}
impl TryFrom<SQLiteLoggedUser> for LoggedUser {
    type Error = RustApiError;

    fn try_from(value: SQLiteLoggedUser) -> Result<Self, Self::Error> {
        let funcao = match value.funcao.as_str() {
            "vendedor" => Funcao::Vendedor,
            "gerente" => Funcao::Gerente,
            "admin" => Funcao::Admin,
            _ => {
                println!("Erro ao converter SQLiteLoggedUser para LoggedUser");
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                });
            }
        };
        let local = match value.local.as_str() {
            "02" => Local::Loja02,
            "03" => Local::Loja03,
            "04" => Local::Loja04,
            _ => {
                println!("Erro ao converter SQLiteLoggedUser para LoggedUser");
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                });
            }
        };
        Ok(LoggedUser {
            id: value.id,
            nome: value.nome,
            funcao,
            local,
        })
    }
}
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UsuarioListing {
    pub id: i32,
    pub nome: String,
    pub funcao: Funcao,
    pub local: Local,
    pub usuario: String,
    pub created_at: String,
    pub updated_at: String,
}
impl TryFrom<SQLiteUsuarioListing> for UsuarioListing {
    type Error = RustApiError;

    fn try_from(value: SQLiteUsuarioListing) -> Result<Self, Self::Error> {
        let funcao = match value.funcao.as_str() {
            "vendedor" => Funcao::Vendedor,
            "gerente" => Funcao::Gerente,
            "admin" => Funcao::Admin,
            _ => {
                println!("Erro ao converter SQLiteLoggedUser para LoggedUser");
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                });
            }
        };
        let local = match value.local.as_str() {
            "02" => Local::Loja02,
            "03" => Local::Loja03,
            "04" => Local::Loja04,
            _ => {
                println!("Erro ao converter SQLiteLoggedUser para LoggedUser");
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                });
            }
        };
        Ok(UsuarioListing {
            id: value.id,
            nome: value.nome,
            funcao,
            local,
            usuario: value.usuario,
            created_at: value.created_at,
            updated_at: value.updated_at,
        })
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginPayload {
    pub usuario: String,
    pub senha: String,
}

#[derive(Deserialize, Serialize)]
struct LoginResponse {
    token: String,
    user: LoggedUser,
}

#[tauri::command]
pub async fn get_usuarios(
    state: State<'_, AppState>,
    app: AppHandle,
    get_deleted: Option<bool>,
) -> Result<Vec<UsuarioListing>, RustApiError> {
    if state.is_offline_mode.load(Ordering::Relaxed) {
        return offline_get_usuarios(&state).await;
    }
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/usuarios/");

    if let Some(get_deleted) = get_deleted {
        url = format!("{url}?all={}", get_deleted.to_string())
    }

    let request = state.http_client.get(url).bearer_auth(token);

    let identifier = &String::from("get_usuarios");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[derive(Serialize, Deserialize)]
pub struct CriarUsuarioPayload {
    pub nome: String,
    pub usuario: String,
    pub senha: String,
    pub local: String,
    pub funcao: String,
}

#[tauri::command]
pub async fn criar_usuario(
    payload: CriarUsuarioPayload,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .post(format!("{api_url}/usuarios"))
        .bearer_auth(token)
        .json(&payload);

    let identifier = &String::from("criar_usuario");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

#[tauri::command]
pub async fn deletar_usuario(
    usuario_id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/usuarios/{usuario_id}"))
        .bearer_auth(token);

    let identifier = &String::from("deletar_usuario");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

/*
    #[serde(skip_serializing_if = "Option::is_none")]
    None = undefined
    Some(None) = null
    Some(val) = val
*/
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUsuarioPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nome: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usuario: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub senha: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local: Option<Option<Local>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub funcao: Option<Option<Funcao>>,
}

#[tauri::command]
pub async fn update_usuario(
    usuario: UpdateUsuarioPayload,
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app);
    let token = get_token(&state)?;

    // println!("{:?}", &usuario);

    let request = state
        .http_client
        .put(format!("{api_url}/usuarios/{id}"))
        .bearer_auth(token)
        .json(&usuario);

    let identifier = &String::from("editar_usuario");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    let token_lock = state.user_data.lock().unwrap().clone();
    if let Some(usuario) = token_lock {
        if usuario.id == id {
            logout(state);
        }
    }

    Ok(body)
}

#[tauri::command]
pub async fn login(
    usuario: String,
    senha: String,
    state: tauri::State<'_, AppState>,
    app: AppHandle,
) -> Result<LoggedUser, RustApiError> {
    let is_offline_mode = state.is_offline_mode.load(Ordering::Relaxed);

    if is_offline_mode {
        let user = offline_login(usuario, senha, &state).await?;

        let mut user_lock = state.user_data.lock().unwrap();
        *user_lock = Some(user.clone());

        return Ok(user);
    }

    let api_url = get_api_url(&app);
    let payload = LoginPayload {
        usuario: usuario,
        senha: senha,
    };

    let request = state
        .http_client
        .post(format!("{api_url}/login"))
        .json(&payload);
    let identifier = &String::from("login");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body: LoginResponse = get_body(&app, response, identifier).await?;

    let mut token_lock = state.jws_token.lock().unwrap();
    *token_lock = Some(body.token);

    let mut user_lock = state.user_data.lock().unwrap();
    *user_lock = Some(body.user.clone());

    Ok(body.user)
}

#[tauri::command]
pub fn logout(state: State<'_, AppState>) {
    {
        let mut token_lock = state.jws_token.lock().unwrap();
        *token_lock = None;
    }

    {
        let mut user = state.user_data.lock().unwrap();
        *user = None;
    }
}

#[tauri::command]
pub fn get_user_data(state: State<'_, AppState>) -> Option<LoggedUser> {
    let user = state.user_data.lock().unwrap().clone();
    match user {
        Some(val) => return Some(val),
        None => return None,
    }
}
