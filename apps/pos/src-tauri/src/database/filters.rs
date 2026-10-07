use std::collections::HashMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(deny_unknown_fields)]
pub struct StringFilter {
    pub contains: Option<String>,
    pub eq: Option<String>,
    #[serde(rename = "in")]
    pub in_values: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct NumberFilter {
    pub eq: Option<f64>,
    pub gt: Option<f64>,
    pub lt: Option<f64>,
    pub gte: Option<f64>,
    pub lte: Option<f64>,
    #[serde(rename = "in")]
    pub in_values: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(deny_unknown_fields)]
pub struct DateFilter {
    pub eq: Option<String>,
    pub gt: Option<String>,
    pub lt: Option<String>,
    pub gte: Option<String>,
    pub lte: Option<String>,
}

// #[derive(Debug, Serialize, Deserialize, Clone, Default)]
// #[serde(deny_unknown_fields)]
// pub struct ArrayFilter<T> {
//     #[serde(rename = "in")] // Traduz `in_val` do Rust para `in` no JSON
//     pub in_val: Option<Vec<T>>,
// }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(deny_unknown_fields)]
pub struct EnumFilter<T> {
    pub eq: Option<T>,
    #[serde(rename = "in")]
    pub in_val: Option<T>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PrimitiveValue {
    String(String),
    Number(f64), // f64 é o equivalente mais seguro para o 'number' do JS/TS
    Boolean(bool),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FilterNode {
    String(StringFilter),
    Number(NumberFilter),
    Enum(EnumFilter<PrimitiveValue>),
}

pub type JsonFilter = HashMap<String, FilterNode>;

/// Filtro de estoque por loja.
///
/// Espelha o `EstoqueFilter` de `packages/types/database/Mercadoria/Read.ts`: a
/// chave é o id da loja (`lojas.id`) e o valor é um `NumberFilter` aplicado ao
/// estoque daquela loja.
///
/// Reaproveita [`JsonFilter`] porque o formato é idêntico ao de
/// `caracteristicas` (mapa de condições). O alias existe para o contrato ficar
/// explícito no ponto de uso e para não exigir `NumberFilter` importado nos
/// módulos que só precisam do tipo do filtro de estoque.
///
/// Ex.: `{"1": {"gt": 0}}` → estoque positivo na loja 1.
pub type EstoqueFilter = HashMap<String, FilterNode>;

/// Resolve a chave do filtro de estoque para uma chave válida de loja.
///
/// A chave vem do corpo JSON e é interpolada no SQL (não há binding possível
/// aqui, porque a chave é o que define a subquery), então precisa ser
/// validada: só inteiros positivos passam.
pub fn loja_id_do_filtro_de_estoque(loja_id: &str) -> Option<i32> {
    if loja_id.is_empty() || !loja_id.chars().all(|c| c.is_ascii_digit()) {
        return None;
    }
    loja_id.parse().ok()
}

// pub type JsonFilter = HashMap<String, serde_json::Value>;

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct BaseQuery<T> {
    pub page: Option<i32>,
    pub limit: Option<i32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub include: Option<Vec<String>>,
    pub filter: Option<T>,
}
