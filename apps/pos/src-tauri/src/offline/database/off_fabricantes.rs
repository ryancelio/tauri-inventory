use crate::{
    database::fabricante::Fabricante, offline::database::get_db_pool, ApiResponse, RustApiError,
};

#[derive(Debug, serde::Deserialize, serde::Serialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteFabricante {
    pub id: i32,
    pub nome: String,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: String,
}

pub async fn offline_get_fabricantes(
    state: &tauri::State<'_, crate::AppState>,
) -> Result<Vec<Fabricante>, RustApiError> {
    let pool = get_db_pool(&state)?;

    let fabricantes: Vec<SQLiteFabricante> =
        match sqlx::query_as("SELECT * FROM fabricantes WHERE deletedAt IS NULL")
            .fetch_all(&pool)
            .await
        {
            Ok(val) => val,
            Err(e) => {
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: format!("Erro ao executar a consulta no modo offline: {}", e),
                    },
                })
            }
        };

    Ok(fabricantes.into_iter().map(Into::into).collect())
}

pub async fn offline_get_single_fabricante(
    id: i32,
    state: &tauri::State<'_, crate::AppState>,
) -> Result<Fabricante, RustApiError> {
    let pool = get_db_pool(state)?;

    let fabricante: SQLiteFabricante =
        match sqlx::query_as("SELECT * FROM fabricantes WHERE id = ?")
            .bind(id)
            .fetch_one(&pool)
            .await
        {
            Ok(val) => val,
            Err(err) => {
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: format!("Erro ao executar a consulta no modo offline: {}", err),
                    },
                })
            }
        };

    Ok(fabricante.into())
}
