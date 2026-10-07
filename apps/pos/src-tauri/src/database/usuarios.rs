use std::sync::atomic::Ordering;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::config::api_url::get_api_url;
use crate::database::loja::Loja;
use crate::database::{get_body, get_token, try_connection};
use crate::offline::database::off_users::{
    offline_get_usuarios, offline_login, SQLiteLoggedUser, SQLiteUsuarioListing,
};
use crate::{ApiResponse, AppState, RustApiError};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "lowercase")]
pub enum Funcao {
    Vendedor,
    Gerente,
    Admin,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct LoggedUser {
    pub id: i32,
    pub nome: String,
    pub funcao: Funcao,
    pub local: Loja,
}
impl TryFrom<&str> for Funcao {
    type Error = RustApiError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        match value {
            "vendedor" => Ok(Funcao::Vendedor),
            "gerente" => Ok(Funcao::Gerente),
            "admin" => Ok(Funcao::Admin),
            _ => {
                println!("Erro ao converter a funcao do usuario: {value}");
                Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: "Erro interno, contate um administrador!".to_string(),
                    },
                })
            }
        }
    }
}

impl TryFrom<SQLiteLoggedUser> for LoggedUser {
    type Error = RustApiError;

    fn try_from(value: SQLiteLoggedUser) -> Result<Self, Self::Error> {
        // `funcao`/`local` são resolvidos antes de mover `nome`/`usuario`, para
        // não usar `value` depois de um move parcial.
        let funcao = value.parse_funcao()?;
        let local = value.local();

        Ok(LoggedUser {
            id: value.id,
            nome: value.nome,
            funcao,
            local,
        })
    }
}
#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UsuarioListing {
    pub id: i32,
    pub nome: String,
    pub funcao: Funcao,
    pub local: Loja,
    pub usuario: String,
    pub ativo: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}
impl TryFrom<SQLiteUsuarioListing> for UsuarioListing {
    type Error = RustApiError;

    fn try_from(value: SQLiteUsuarioListing) -> Result<Self, Self::Error> {
        let funcao = value.parse_funcao()?;
        let local = value.local();

        Ok(UsuarioListing {
            id: value.id,
            nome: value.nome,
            funcao,
            local,
            ativo: value.ativo,
            usuario: value.usuario,
            created_at: value.created_at,
            updated_at: value.updated_at,
            deleted_at: value.deleted_at,
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

/// Filtros de `get_usuarios`.
///
/// `local_id` substitui o antigo `local: Option<String>` ("02"/"03"/"04"): a
/// coluna agora é `usuarios.lojaId` e a loja é uma entidade, não um código.
/// `ativo` substitui `active`, que nunca existiu no model.
#[derive(Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct UsuarioListFilter {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ativo: Option<bool>,
}

#[tauri::command]
pub async fn get_usuarios(
    state: State<'_, AppState>,
    app: AppHandle,
    get_deleted: Option<bool>,
    filter: Option<UsuarioListFilter>,
) -> Result<Vec<UsuarioListing>, RustApiError> {
    if state.is_offline_mode.load(Ordering::Relaxed) {
        return offline_get_usuarios(&state, get_deleted, filter).await;
    }
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let mut url = format!("{api_url}/usuarios/");

    if let Some(get_deleted) = get_deleted {
        url = format!("{url}?all={}", get_deleted.to_string())
    }

    println!("Filtro: {:#?}", &filter);

    let mut request = state.http_client.get(url).bearer_auth(token);

    if let Some(fltr) = filter {
        request = request.json(&fltr);
    }

    let identifier = &String::from("get_usuarios");

    let response = try_connection(request, identifier, &state, &app).await?;

    let body = get_body(&app, response, identifier).await?;

    Ok(body)
}

/// Payload de criação enviado para a API.
///
/// `lojaId` substitui a antiga string `local` ("02"/"03"/"04"): a loja é uma
/// entidade (`ILoja`) e a coluna é `usuarios.lojaId`. É o mesmo nome que
/// `createUsuarioSchema` em `packages/types/database/Usuario.ts` exige — se
/// divergir, o `safeParse` do servidor responde 400 antes do `Usuario.create`.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CriarUsuarioPayload {
    pub nome: String,
    pub usuario: String,
    pub senha: String,
    pub loja_id: i32,
    pub funcao: String,
}

#[tauri::command]
pub async fn criar_usuario(
    payload: CriarUsuarioPayload,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
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
pub async fn desativar_usuario(
    usuario_id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
    let token = get_token(&state)?;

    let request = state
        .http_client
        .delete(format!("{api_url}/usuarios/{usuario_id}"))
        .bearer_auth(token);

    let identifier = &String::from("desativar_usuariou");

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
    pub loja_id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub funcao: Option<Option<Funcao>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ativo: Option<Option<bool>>,
}

#[tauri::command]
pub async fn update_usuario(
    usuario: UpdateUsuarioPayload,
    id: i32,
    state: State<'_, AppState>,
    app: AppHandle,
) -> Result<ApiResponse, RustApiError> {
    let api_url = get_api_url(&app)?;
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

    let api_url = get_api_url(&app)?;
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
