use bcrypt::verify;
use tauri::AppHandle;

use crate::{
    database::usuarios::{LoggedUser, LoginPayload, UsuarioListing},
    offline::database::get_db_pool,
    AppState, RustApiError,
};

#[derive(Debug, serde::Deserialize, serde::Serialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteLoggedUser {
    pub id: i32,
    pub nome: String,
    pub funcao: String,
    pub local: String,
}

#[derive(Debug, serde::Deserialize, serde::Serialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteUsuarioListing {
    pub id: i32,
    pub nome: String,
    pub funcao: String,
    pub local: String,
    pub usuario: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn offline_login(
    usuario: String,
    senha: String,
    state: &tauri::State<'_, AppState>,
) -> Result<LoggedUser, RustApiError> {
    let pool = get_db_pool(state)?;

    let user_response: (String, String) =
        match sqlx::query_as("SELECT usuario, senhaHash FROM usuarios WHERE usuario = ?")
            .bind(usuario)
            .fetch_optional(&pool)
            .await
        {
            Ok(val) => match val {
                Some(val) => val,
                None => {
                    return Err(RustApiError {
                        code: 400,
                        message: crate::ApiResponse {
                            response: "Usuario/Senha Inválidos".to_string(),
                        },
                    })
                }
            },
            Err(e) => {
                println!("Erro ao ler usuarios para login: {e}");
                return Err(RustApiError {
                    code: 500,
                    message: crate::ApiResponse {
                        response: "Erro interno ao conectar ao banco de dados local.".to_string(),
                    },
                });
            }
        };
    let hash = user_response.1.clone();
    let valid_pass = match tokio::task::spawn_blocking(move || verify(senha, &hash)).await {
        Ok(Ok(val)) => val,
        _ => {
            // println!("Erro BCRYPT: {}", err.to_string());
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: "Erro interno ao conectar ao banco de dados local.".to_string(),
                },
            });
        }
    };

    if valid_pass {
        let logged_user: SQLiteLoggedUser =
            match sqlx::query_as("SELECT id, nome, funcao, local FROM usuarios WHERE usuario = ?")
                .bind(user_response.0)
                .fetch_one(&pool)
                .await
            {
                Ok(val) => val,
                Err(e) => {
                    println!("Error getting user_data for response: {e}");
                    return Err(RustApiError {
                        code: 500,
                        message: crate::ApiResponse {
                            response: "Erro interno ao conectar ao banco de dados local."
                                .to_string(),
                        },
                    });
                }
            };
        logged_user.try_into()
    } else {
        Err(RustApiError {
            code: 400,
            message: crate::ApiResponse {
                response: "Usuario/Senha inválidos.".to_string(),
            },
        })
    }
}

pub async fn offline_get_usuarios(
    state: &tauri::State<'_, AppState>,
) -> Result<Vec<UsuarioListing>, RustApiError> {
    let db = get_db_pool(state)?;
    let users: Vec<SQLiteUsuarioListing> = match sqlx::query_as(
        "SELECT id,nome, funcao,usuario, local, createdAt,updatedAt FROM usuarios",
    )
    .fetch_all(&db)
    .await
    {
        Ok(val) => val,
        Err(err) => {
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: "Erro interno ao receber mercadorias".to_string(),
                },
            })
        }
    };

    users.into_iter().map(|u| u.try_into()).collect()
}
