use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use sqlx::Execute;
use tauri::State;

use crate::{
    database::{
        categoria::Categoria,
        fabricante::Fabricante,
        mercadoria::types::{Mercadoria, MercadoriaFilter, MercadoriaReportResponse, SimilarMerc},
        ApiListResponse,
    },
    offline::database::{
        get_db_pool,
        off_categorias::{offline_get_categorias, offline_get_single_categoria},
        off_fabricantes::{offline_get_fabricantes, offline_get_single_fabricante},
        off_filters::build_mercadorias_query,
    },
    ApiResponse, AppState, RustApiError,
};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SQLiteMercadoria {
    id: i32,
    key: i32,
    descricao: String,
    fabricante_id: i32,
    categoria_id: i32,
    estoque02: i32,
    estoque03: i32,
    estoque04: i32,
    // caracteristicas: Option<Caracteristicas>,
    caracteristicas_json: Option<String>,
    observacoes: Option<String>,
    preco_custo: f64,
    preco_venda: f64,
    created_at: String,
    updated_at: String,
}

impl<'r> sqlx::FromRow<'r, sqlx::sqlite::SqliteRow> for SQLiteMercadoria {
    fn from_row(row: &'r sqlx::sqlite::SqliteRow) -> sqlx::Result<Self> {
        use sqlx::Row;
        Ok(Self {
            id: row.try_get("id")?,
            key: row.try_get("key")?,
            descricao: row.try_get("descricao")?,
            fabricante_id: row.try_get("fabricanteId")?,
            categoria_id: row.try_get("categoriaId")?,
            estoque02: row.try_get("estoque02")?,
            estoque03: row.try_get("estoque03")?,
            estoque04: row.try_get("estoque04")?,
            observacoes: row.try_get("observacoes")?,
            preco_custo: row.try_get("precoCusto")?,
            preco_venda: row.try_get("precoVenda")?,
            created_at: row.try_get("createdAt")?,
            updated_at: row.try_get("updatedAt")?,
            caracteristicas_json: row.try_get("caracteristicasJson")?,
        })
    }
}

impl SQLiteMercadoria {
    pub fn into_mercadoria(
        self,
        fabricantes: &HashMap<i32, Fabricante>,
        categorias: &HashMap<i32, Categoria>,
    ) -> Option<Mercadoria> {
        let caracteristicas = self
            .caracteristicas_json
            .as_deref()
            .map(serde_json::from_str)
            .transpose()
            .ok()?;

        Some(Mercadoria {
            id: self.id,
            key: self.key,
            descricao: self.descricao,
            fabricante: fabricantes.get(&self.fabricante_id)?.clone(),
            categoria: categorias.get(&self.categoria_id)?.clone(),
            estoque02: self.estoque02,
            estoque03: self.estoque03,
            estoque04: self.estoque04,
            observacoes: self.observacoes,
            preco_custo: format!("{:.2}", self.preco_custo),
            preco_venda: format!("{:.2}", self.preco_venda),
            created_at: self.created_at,
            updated_at: self.updated_at,
            caracteristicas,
        })
    }
    pub fn into_report(
        self,
        fabricantes: &HashMap<i32, Fabricante>,
    ) -> Option<MercadoriaReportResponse> {
        Some(MercadoriaReportResponse {
            id: self.id,
            descricao: self.descricao,
            estoque02: self.estoque02,
            estoque03: self.estoque03,
            estoque04: self.estoque04,
            preco_custo: self.preco_custo.to_string(),
            preco_venda: self.preco_venda.to_string(),
            fabricante: fabricantes.get(&self.fabricante_id)?.clone().into(),
        })
    }
}

#[tauri::command]
pub async fn offline_get_mercadorias(
    filter: MercadoriaFilter,
    state: State<'_, AppState>,
) -> Result<ApiListResponse<Mercadoria>, RustApiError> {
    println!("{:?}", &filter);

    let mut builder = build_mercadorias_query(&filter, false);
    let pool = get_db_pool(&state)?;

    let query = builder.build_query_as::<SQLiteMercadoria>();

    let mercadorias = query.fetch_all(&pool).await.map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao executar a consulta no modo offline: {}", e),
        },
    })?;

    let categorias = offline_get_categorias(&state).await?;
    let fabricantes = offline_get_fabricantes(&state).await?;

    let categorias_por_id: HashMap<i32, Categoria> =
        categorias.into_iter().map(|c| (c.id, c)).collect();
    let fabricantes_por_id: HashMap<i32, Fabricante> =
        fabricantes.into_iter().map(|f| (f.id, f)).collect();

    let mercadorias = mercadorias
        .into_iter()
        .filter_map(|m| m.into_mercadoria(&fabricantes_por_id, &categorias_por_id))
        .collect();

    let count: i32 = match build_mercadorias_query(&filter, true)
        .build_query_scalar()
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

    Ok(ApiListResponse {
        data: mercadorias,
        count: count,
    })
}

pub async fn offline_get_single_mercadoria(
    id: i32,
    state: &State<'_, AppState>,
) -> Result<Mercadoria, RustApiError> {
    let pool = get_db_pool(&state)?;

    let mercadoria: SQLiteMercadoria = match sqlx::query_as(
        "SELECT mercadorias.*, \
        (SELECT json_group_array(
            json_object('id', a.id, 'nome', a.nome, 'tipo', a.tipo, 'valor', ma.valor)
        )
        FROM mercadoria_atributos ma
        JOIN atributos a ON a.id = ma.atributoId
        WHERE ma.mercadoriaId = mercadorias.id) AS caracteristicasJson
        FROM mercadorias
        WHERE id = ?",
    )
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

    let fabricante = offline_get_single_fabricante(mercadoria.fabricante_id, state).await?;
    let categoria = offline_get_single_categoria(mercadoria.categoria_id, state).await?;

    let caracteristicas = mercadoria
        .caracteristicas_json
        .as_deref()
        .map(serde_json::from_str)
        .transpose()
        .map_err(|_| RustApiError {
            code: 500,
            message: ApiResponse {
                response: "Erro interno caracteristicas_json".to_string(),
            },
        })?;

    Ok(Mercadoria {
        id,
        key: mercadoria.key,
        descricao: mercadoria.descricao,
        fabricante,
        categoria,
        estoque02: mercadoria.estoque02,
        estoque03: mercadoria.estoque03,
        estoque04: mercadoria.estoque04,
        observacoes: mercadoria.observacoes,
        preco_custo: format!("{:.2}", mercadoria.preco_custo),
        preco_venda: format!("{:.2}", mercadoria.preco_venda),
        created_at: mercadoria.created_at,
        updated_at: mercadoria.updated_at,
        caracteristicas,
    })
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteSimilarMerc {
    pub id: i32,
    pub key: i32,
    pub descricao: String,
    pub estoque02: i32,
    pub estoque03: i32,
    pub estoque04: i32,
    caracteristicas_json: Option<String>,
    pub preco_venda: f64,
}
impl SQLiteSimilarMerc {
    pub fn into_mercadoria(self) -> Option<SimilarMerc> {
        let caracteristicas = self
            .caracteristicas_json
            .as_deref()
            .map(serde_json::from_str)
            .transpose()
            .ok()?;

        Some(SimilarMerc {
            id: self.id,
            key: self.key,
            descricao: self.descricao,

            estoque02: self.estoque02,
            estoque03: self.estoque03,
            estoque04: self.estoque04,

            caracteristicas: caracteristicas,

            preco_venda: format!("{:.2}", self.preco_venda),
        })
    }
}

pub async fn offline_get_similar_mercs(
    key: i32,
    state: State<'_, AppState>,
) -> Result<Vec<SimilarMerc>, RustApiError> {
    let pool = get_db_pool(&state)?;

    let sim_mercs: Vec<SQLiteSimilarMerc> = match sqlx::query_as(
        r#"SELECT
    mercadorias.id,
    mercadorias.key,
    mercadorias.descricao,
    mercadorias.estoque02,
    mercadorias.estoque03,
    mercadorias.estoque04,
    mercadorias.precoVenda,
    (
        SELECT json_group_array(
            json_object(
                'id', a.id,
                'nome', a.nome,
                'tipo', a.tipo,
                'valor', ma.valor
            )
        )
        FROM Mercadoria_Atributos ma
        JOIN atributos a ON a.id = ma.atributoId
        WHERE ma.mercadoriaId = mercadorias.id
    ) AS caracteristicasJson
FROM mercadorias
WHERE key = ?"#,
    )
    .bind(key)
    .fetch_all(&pool)
    .await
    {
        Ok(val) => val,
        Err(err) => {
            println!("Erro em offline_get_similar_mercs: {err}");
            return Err(RustApiError {
                code: 500,
                message: ApiResponse {
                    response: "Erro ao listar em modo offline.".to_string(),
                },
            });
        }
    };

    Ok(sim_mercs
        .into_iter()
        .filter_map(|m| m.into_mercadoria())
        .collect())
}

pub async fn offline_get_mercadoria_report(
    mut filter: MercadoriaFilter,
    state: &State<'_, AppState>,
) -> Result<ApiListResponse<MercadoriaReportResponse>, RustApiError> {
    filter.limit = Some(-1); // No Limit
    let mut builder = build_mercadorias_query(&filter, false);
    let pool = get_db_pool(&state)?;

    let query = builder.build_query_as::<SQLiteMercadoria>();

    let mercadorias = query.fetch_all(&pool).await.map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao executar a consulta no modo offline: {}", e),
        },
    })?;

    let fabricantes = offline_get_fabricantes(&state).await?;

    let fabricantes_por_id: HashMap<i32, Fabricante> =
        fabricantes.into_iter().map(|f| (f.id, f)).collect();

    let mercadorias = mercadorias
        .into_iter()
        .filter_map(|m| m.into_report(&fabricantes_por_id))
        .collect();

    let count: i32 = match build_mercadorias_query(&filter, true)
        .build_query_scalar()
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

    Ok(ApiListResponse {
        data: mercadorias,
        count: count,
    })
}
