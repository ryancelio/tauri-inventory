use crate::{database::atributo::Atributo, offline::database::get_db_pool, AppState, RustApiError};

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]

pub struct SQLiteAtributo {
    pub id: i32,
    pub nome: String,
    pub tipo: String,
    pub created_at: String,
    pub updated_at: String,
}

pub async fn offline_get_atributos(
    state: tauri::State<'_, AppState>,
) -> Result<Vec<Atributo>, RustApiError> {
    let pool = get_db_pool(&state)?;

    let atributos: Vec<SQLiteAtributo> = match sqlx::query_as("SELECT * FROM atributos")
        .fetch_all(&pool)
        .await
    {
        Ok(val) => val,
        Err(err) => {
            println!("Erro ao listar atributos offline: {err}");
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: format!("Erro ao executar a consulta no modo offline."),
                },
            });
        }
    };

    atributos.into_iter().map(|at| at.try_into()).collect()
}
