use serde::{Deserialize, Serialize};
use sqlx::prelude::FromRow;

use crate::database::{
    atributo::AtributoTipo,
    categoria::Categoria,
    estoque::Estoque,
    fabricante::Fabricante,
    loja::Loja,
    filters::{
        BaseQuery, DateFilter, EstoqueFilter, JsonFilter, NumberFilter, PrimitiveValue,
        StringFilter,
    },
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
    /// Estoque por loja, desserializado da coluna JSON `estoqueJson` da
    /// projeção `MERCADORIAS_SELECT`. Substitui as antigas colunas
    /// `estoque02/03/04` de `mercadorias`.
    pub estoque: Vec<Estoque>,
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
    /// Estoque por loja. Substitui as antigas colunas `estoque02/03/04`.
    pub estoque: Vec<Estoque>,
    pub preco_venda: String,
    pub caracteristicas: Option<Vec<Caracteristicas>>,
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
    /// Estoque por loja, gravado na tabela `estoques`. Substitui
    /// `estoque02`/`estoque03`/`estoque04`.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque: Option<Vec<EstoqueInput>>,
    pub caracteristicas: Option<Vec<CaracteristicaCreate>>,
    pub observacoes: Option<String>,
    pub preco_custo: f64,
    pub preco_venda: f64,
}

/// Uma linha de `estoques`: o estoque da mercadoria numa loja.
#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EstoqueInput {
    pub loja_id: i32,
    pub estoque: i32,
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
    /// Estoque por loja, gravado na tabela `estoques`. `None` significa "não
    /// mexer no estoque"; lista vazia significa "sem estoque em nenhuma loja".
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estoque: Option<Vec<EstoqueInput>>,
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
    /// Estoque por loja: chave = `lojas.id`, valor = filtro numérico aplicado
    /// a `estoques.estoque` naquela loja.
    ///
    /// Substitui os antigos campos fixos `estoque02`/`estoque03`/`estoque04`.
    /// Lojas são ANDed: `{"1": {gt: 0}, "2": {gt: 0}}` = estoque positivo na
    /// loja 1 **e** na 2.
    pub estoque: Option<EstoqueFilter>,
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
    /// Um item por loja com estoque cadastrado. Substitui `estoque02/03/04`.
    pub estoque: Vec<ReportEstoque>,
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

/// Uma linha de `estoques` no relatório: o estoque da mercadoria numa loja.
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ReportEstoque {
    pub loja: Loja,
    pub estoque: i32,
}

pub type MercadoriaFilter = BaseQuery<MercadoriaInternalFilter>;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MercadoriaKeyListing {
    pub id: i32,
    pub key: i32,
    pub descricao: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, FromRow)]
#[serde(rename_all = "camelCase")]
#[sqlx(rename_all = "camelCase")]
pub struct MercadoriaSimple {
    pub id: i32,
    pub descricao: String,
}
