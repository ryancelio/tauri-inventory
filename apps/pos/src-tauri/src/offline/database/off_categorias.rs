use std::collections::HashMap;

use tauri::State;

use crate::{
    database::{
        categoria::Categoria,
        grupo::{Grupo, GrupoDB},
    },
    offline::database::{get_db_pool, off_grupos::SQLiteGrupo},
    AppState, RustApiError,
};

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteCategoria {
    pub id: i32,
    pub nome: String,
    pub grupo_id: i32,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn offline_get_categorias(
    state: &State<'_, AppState>,
) -> Result<Vec<Categoria>, RustApiError> {
    let pool = get_db_pool(&state)?;

    let categorias: Vec<SQLiteCategoria> =
        match sqlx::query_as("SELECT * FROM categoria WHERE deletedAt IS null")
            .fetch_all(&pool)
            .await
        {
            Ok(val) => val,
            Err(e) => {
                return Err(RustApiError {
                    code: 500,
                    message: crate::ApiResponse {
                        response: format!("Erro ao executar a consulta no modo offline: {}", e),
                    },
                })
            }
        };

    let grupos: Vec<SQLiteGrupo> =
        match sqlx::query_as("SELECT * FROM grupos WHERE deletedAt IS NULL")
            .fetch_all(&pool)
            .await
        {
            Ok(val) => val,
            Err(e) => {
                return Err(RustApiError {
                    code: 500,
                    message: crate::ApiResponse {
                        response: format!("Erro ao executar a consulta no modo offline: {}", e),
                    },
                })
            }
        };

    let grupos_por_id: HashMap<i32, GrupoDB> =
        grupos.into_iter().map(|g| (g.id, g.into())).collect();

    let response = categorias
        .into_iter()
        .filter_map(|c| {
            let grupo = grupos_por_id.get(&c.grupo_id)?.clone();

            Some(Categoria {
                id: c.id,
                nome: c.nome,
                grupo: grupo,
                created_at: c.created_at,
                updated_at: c.updated_at,
            })
        })
        .collect();

    Ok(response)
}

pub async fn offline_get_single_categoria(
    id: i32,
    state: &State<'_, AppState>,
) -> Result<Categoria, RustApiError> {
    let pool = get_db_pool(state)?;

    let categoria: SQLiteCategoria = match sqlx::query_as("SELECT * FROM categoria WHERE id = ?")
        .bind(id)
        .fetch_one(&pool)
        .await
    {
        Ok(val) => val,
        Err(err) => {
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: format!("Erro ao executar a consulta no modo offline: {}", err),
                },
            })
        }
    };

    let grupo: SQLiteGrupo = match sqlx::query_as("SELECT * FROM grupos WHERE id = ?")
        .bind(categoria.grupo_id)
        .fetch_one(&pool)
        .await
    {
        Ok(val) => val,
        Err(err) => {
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: format!("Erro ao executar a consulta no modo offline: {}", err),
                },
            })
        }
    };

    Ok(Categoria {
        id: categoria.id,
        nome: categoria.nome,
        grupo: grupo.into(),
        created_at: categoria.created_at,
        updated_at: categoria.updated_at,
    })
}
