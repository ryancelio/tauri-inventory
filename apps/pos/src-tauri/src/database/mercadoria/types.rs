use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::{
    database::{
        atributo::AtributoTipo,
        categoria::Categoria,
        fabricante::Fabricante,
        filters::{BaseQuery, DateFilter, JsonFilter, NumberFilter, PrimitiveValue, StringFilter},
    },
    offline::database::off_mercadorias::SQLiteMercadoria,
};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Caracteristicas {
    pub id: i32,
    pub nome: String,
    pub tipo: AtributoTipo,
    pub valor: PrimitiveValue,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
#[derive(sqlx::FromRow)]
pub struct Mercadoria {
    pub id: i32,
    pub key: i32,
    pub descricao: String,
    pub fabricante: Fabricante,
    pub categoria: Categoria,
    pub caracteristicas: Option<Vec<Caracteristicas>>,
    pub estoque02: i32,
    pub estoque03: i32,
    pub estoque04: i32,
    pub observacoes: Option<String>,
    pub preco_custo: String,
    pub preco_venda: String,
    pub created_at: String,
    pub updated_at: String,
}
// impl TryFrom<SQLiteMercadoria> for Mercadoria {
//     type Error = RustApiError;

//     fn try_from(value: SQLiteMercadoria) -> Result<Self, Self::Error> {

//     }
// }

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimilarMerc {
    pub id: i32,
    pub key: i32,
    pub descricao: String,
    pub estoque02: i32,
    pub estoque03: i32,
    pub estoque04: i32,
    pub preco_venda: String,
    pub caracteristicas: Option<Vec<Caracteristicas>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CaracteristicaSend {
    pub key: String,
    pub value: PrimitiveValue,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaDBSent {
    pub id: Option<i32>,
    pub key: Option<i32>,
    pub descricao: String,
    pub fabricante_id: i32,
    pub categoria_id: i32,
    pub estoque02: Option<i32>,
    pub estoque03: Option<i32>,
    pub estoque04: Option<i32>,
    pub caracteristicas: Option<Vec<CaracteristicaSend>>,
    pub observacoes: Option<String>,
    pub preco_custo: f64,
    pub preco_venda: f64,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CaracteristicaCreate {
    pub key: String,   // Atributo ID
    pub value: String, // Caracteristica Value
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaCreate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<Option<i32>>,
    pub descricao: String,
    pub fabricante_id: i32,
    pub categoria_id: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque02: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque03: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque04: Option<Option<i32>>,
    pub caracteristicas: Option<Vec<CaracteristicaCreate>>,
    pub observacoes: Option<String>,
    pub preco_custo: f64,
    pub preco_venda: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaUpdate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub key: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub descricao: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fabricante_id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub categoria_id: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque02: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque03: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque04: Option<Option<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub caracteristicas: Option<Option<Vec<CaracteristicaCreate>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub observacoes: Option<Option<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preco_custo: Option<Option<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preco_venda: Option<Option<f64>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct SimilarMercCreate {
    pub preco_custo: Option<f64>,
    pub preco_venda: Option<f64>,
    pub caracteristicas: Option<Vec<CaracteristicaCreate>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct PartialMercDB {
    pub id: Option<i32>,
    pub key: Option<i32>,
    pub descricao: Option<String>,
    pub fabricante_id: Option<i32>,
    pub categoria_id: Option<i32>,
    pub estoque02: Option<i32>,
    pub estoque03: Option<i32>,
    pub estoque04: Option<i32>,
    pub caracteristicas: Option<Vec<Caracteristicas>>,
    pub observacoes: Option<String>,
    pub preco_custo: Option<f64>,
    pub preco_venda: Option<f64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaInternalFilter {
    pub id: Option<NumberFilter>,
    pub key: Option<NumberFilter>,
    pub descricao: Option<StringFilter>,
    pub fabricante_id: Option<NumberFilter>,
    pub categoria_id: Option<NumberFilter>,
    pub grupo_id: Option<NumberFilter>,
    pub estoque02: Option<NumberFilter>,
    pub estoque03: Option<NumberFilter>,
    pub estoque04: Option<NumberFilter>,
    pub caracteristicas: Option<JsonFilter>,
    pub observacoes: Option<StringFilter>,
    pub preco_custo: Option<NumberFilter>,
    pub preco_venda: Option<NumberFilter>,
    pub created_at: Option<DateFilter>,
    pub updated_at: Option<DateFilter>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSimMercIdPayload {
    pub mercadoria: SimilarMercCreate,
    pub selected_ids: Vec<String>,
}

#[derive(Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct MercadoriaReportResponse {
    pub id: i32,
    pub descricao: String,
    pub estoque02: i32,
    pub estoque03: i32,
    pub estoque04: i32,
    pub preco_custo: String,
    pub preco_venda: String,
    pub fabricante: MercReportFabricante,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MercReportFabricante {
    pub id: i32,
    pub nome: String,
}

pub type MercadoriaFilter = BaseQuery<MercadoriaInternalFilter>;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaKeyListing {
    pub id: i32,
    pub key: i32,
    pub descricao: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default,FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all="camelCase")]
pub struct MercadoriaSimple {
    pub id: i32,
    pub descricao: String,
}
