use serde::{Deserialize, Serialize};

use crate::database::loja::Loja;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Estoque {
    id: i32,
    estoque: i32,
    loja: Loja,
    created_at: String,
    updated_at: String,
}
