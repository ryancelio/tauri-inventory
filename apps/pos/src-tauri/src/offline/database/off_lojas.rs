use sqlx::Sqlite;
use tauri::State;

use crate::{database::loja::Loja, offline::database::get_db_pool, AppState, RustApiError};

#[derive(serde::Serialize, serde::Deserialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteLoja {
    pub id: i32,
    pub nome: String,
    #[sqlx(rename = "CNPJ")]
    pub cnpj: String,
    pub created_at: String,
    pub updated_at: String,
}
impl Into<Loja> for SQLiteLoja {
    fn into(self) -> Loja {
        Loja {
            id: self.id,
            nome: self.nome,
            cnpj: self.cnpj,
            created_at: self.created_at,
            updated_at: self.updated_at,
        }
    }
}

pub async fn offline_get_lojas(state: &State<'_, AppState>) -> Result<Vec<Loja>, RustApiError> {
    let pool = get_db_pool(state)?;

    let lojas = sqlx::query_as::<Sqlite, SQLiteLoja>("SELECT * FROM lojas WHERE deletedAt IS NULL")
        .fetch_all(&pool)
        .await
        .map_err(|_| "Erro ao receber lojas do banco de dados".into())
        .map(|lojas| lojas.into_iter().map(|loja| loja.into()).collect());

    return lojas;
}
