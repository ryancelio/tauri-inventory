use serde::{Deserialize, Serialize};

use crate::database::loja::Loja;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Estoque {
    pub id: i32,
    pub estoque: i32,
    pub loja: Loja,
    pub created_at: String,
    pub updated_at: String,
}
