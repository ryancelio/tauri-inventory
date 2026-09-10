use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    database::grupo::{Grupo, GrupoDB},
    offline::database::{get_db_pool, off_categorias::SQLiteCategoria},
    AppState, RustApiError,
};
#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteGrupo {
    pub id: i32,
    pub nome: String,
    pub created_at: String,
    pub updated_at: String,
    // deleted_at: String,
}

pub async fn offline_get_grupos(state: &State<'_, AppState>) -> Result<Vec<Grupo>, RustApiError> {
    let pool = get_db_pool(&state)?;

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

    let categorias: Vec<SQLiteCategoria> =
        match sqlx::query_as("SELECT * FROM categoria WHERE deletedAt IS NULL")
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

    let mut categorias_por_grupo: HashMap<i32, Vec<SQLiteCategoria>> = HashMap::new();

    for categoria in categorias {
        categorias_por_grupo
            .entry(categoria.grupo_id)
            .or_default()
            .push(categoria);
    }

    let grupos: Vec<Grupo> = grupos
        .into_iter()
        .map(|g| Grupo {
            id: g.id,
            nome: g.nome,
            categorias: categorias_por_grupo
                .remove(&g.id)
                .unwrap_or_default()
                .into_iter()
                .map(Into::into)
                .collect(),
            created_at: g.created_at,
            updated_at: g.updated_at,
        })
        .collect();

    Ok(grupos)
}
