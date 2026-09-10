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

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(deny_unknown_fields)]
pub struct ArrayFilter<T> {
    #[serde(rename = "in")] // Traduz `in_val` do Rust para `in` no JSON
    pub in_val: Option<Vec<T>>,
}

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
