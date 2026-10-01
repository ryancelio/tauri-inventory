use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Loja {
    id: i32,
    nome: String,
    cnpj: String,
    created_at: String,
    updated_at: String,
}
