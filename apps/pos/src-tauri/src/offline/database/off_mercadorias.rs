use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use tauri::State;

use crate::{
    database::{
        categoria::Categoria,
        estoque::Estoque,
        fabricante::Fabricante,
        mercadoria::types::{
            Caracteristicas, Mercadoria, MercadoriaFilter, MercadoriaReportResponse,
            MercadoriaSimple, SimilarMerc,
        },
        ApiListResponse,
    },
    offline::database::{
        get_db_pool,
        off_categorias::{offline_get_categorias, offline_get_single_categoria},
        off_fabricantes::{offline_get_fabricantes, offline_get_single_fabricante},
        off_filters::{build_mercadorias_query, MERCADORIAS_SELECT},
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
    estoque_json: Option<String>,
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
            estoque_json: row.try_get("estoqueJson")?,
            observacoes: row.try_get("observacoes")?,
            preco_custo: row.try_get("precoCusto")?,
            preco_venda: row.try_get("precoVenda")?,
            created_at: row.try_get("createdAt")?,
            updated_at: row.try_get("updatedAt")?,
            caracteristicas_json: row.try_get("caracteristicasJson")?,
        })
    }
}

/// Desserializa uma das colunas JSON produzidas por [`MERCADORIAS_SELECT`].
///
/// `None` significa que a coluna não veio na linha (ex.: consultas que não usam a
/// projeção completa); nesse caso devolvemos `None` e o chamador aplica o
/// fallback `vec![]`, igual ao `[]` que o Sequelize devolve para uma associação
/// sem registros.
fn parse_association_column<T: for<'de> Deserialize<'de>>(
    raw: Option<&str>,
    column: &str,
) -> Result<Option<Vec<T>>, RustApiError> {
    let Some(json) = raw else {
        return Ok(None);
    };

    serde_json::from_str(json).map(Some).map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro interno ao desserializar a coluna {column}: {e}"),
        },
    })
}

impl SQLiteMercadoria {
    pub fn into_mercadoria(
        self,
        fabricantes: &HashMap<i32, Fabricante>,
        categorias: &HashMap<i32, Categoria>,
    ) -> Option<Mercadoria> {
        let caracteristicas = parse_association_column::<Caracteristicas>(
            self.caracteristicas_json.as_deref(),
            "caracteristicasJson",
        )
        .ok()?;

        let estoque =
            parse_association_column::<Estoque>(self.estoque_json.as_deref(), "estoqueJson")
                .ok()?
                .unwrap_or_default();

        Some(Mercadoria {
            id: self.id,
            key: self.key,
            descricao: self.descricao,
            fabricante: fabricantes.get(&self.fabricante_id)?.clone(),
            categoria: categorias.get(&self.categoria_id)?.clone(),
            estoque02: self.estoque02,
            estoque03: self.estoque03,
            estoque04: self.estoque04,
            estoque: estoque,
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

    let mut builder = build_mercadorias_query(&filter, false, false);
    let pool = get_db_pool(&state)?;

    let query = builder.build_query_as::<SQLiteMercadoria>();

    let mercadorias = query.fetch_all(&pool).await.map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao executar a consulta no modo offline: {}", e),
        },
    })?;

    let categorias = offline_get_categorias(&state).await?;
    let fabricantes = offline_get_fabricantes(&state, None).await?;

    let categorias_por_id: HashMap<i32, Categoria> =
        categorias.into_iter().map(|c| (c.id, c)).collect();
    let fabricantes_por_id: HashMap<i32, Fabricante> =
        fabricantes.into_iter().map(|f| (f.id, f)).collect();

    let mercadorias = mercadorias
        .into_iter()
        .filter_map(|m| m.into_mercadoria(&fabricantes_por_id, &categorias_por_id))
        .collect();

    let count: i32 = match build_mercadorias_query(&filter, true, false)
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
    get_all: Option<bool>,
) -> Result<Mercadoria, RustApiError> {
    let pool = get_db_pool(&state)?;

    // Por padrão esconde as mercadorias deletadas (espelhando o `paranoid: true`
    // do modelo). `get_all = true` é usado pelos filtros de auditoria, que
    // precisam acessar registros deletados.
    let deleted_clause = if get_all.unwrap_or(false) {
        ""
    } else {
        " AND deletedAt IS NULL"
    };

    let mercadoria: SQLiteMercadoria = match sqlx::query_as(&format!(
        "{MERCADORIAS_SELECT}WHERE id = ?{deleted_clause}"
    ))
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

    let caracteristicas = parse_association_column::<Caracteristicas>(
        mercadoria.caracteristicas_json.as_deref(),
        "caracteristicasJson",
    )?;

    let estoque =
        parse_association_column::<Estoque>(mercadoria.estoque_json.as_deref(), "estoqueJson")?
            .unwrap_or_default();

    Ok(Mercadoria {
        id,
        key: mercadoria.key,
        descricao: mercadoria.descricao,
        fabricante,
        categoria,
        estoque02: mercadoria.estoque02,
        estoque03: mercadoria.estoque03,
        estoque04: mercadoria.estoque04,
        estoque: estoque,
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
    let mut builder = build_mercadorias_query(&filter, false, false);
    let pool = get_db_pool(&state)?;

    let query = builder.build_query_as::<SQLiteMercadoria>();

    let mercadorias = query.fetch_all(&pool).await.map_err(|e| RustApiError {
        code: 500,
        message: ApiResponse {
            response: format!("Erro ao executar a consulta no modo offline: {}", e),
        },
    })?;

    let fabricantes = offline_get_fabricantes(&state, None).await?;

    let fabricantes_por_id: HashMap<i32, Fabricante> =
        fabricantes.into_iter().map(|f| (f.id, f)).collect();

    let mercadorias = mercadorias
        .into_iter()
        .filter_map(|m| m.into_report(&fabricantes_por_id))
        .collect();

    let count: i32 = match build_mercadorias_query(&filter, true, false)
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

pub async fn offline_get_simple_merc(
    search: &'_ str,
    state: &State<'_, AppState>,
) -> Result<Vec<MercadoriaSimple>, RustApiError> {
    let pool = get_db_pool(&state)?;

    let simple_mercs: Result<Vec<MercadoriaSimple>, sqlx::Error> =
        sqlx::query_as("SELECT id,descricao FROM mercadorias WHERE descricao LIKE ? ORDER BY descricao ASC LIMIT 100")
            .bind(format!("%{}%", search.to_ascii_lowercase()))
            .fetch_all(&pool)
            .await;

    match simple_mercs {
        Ok(simp) => return Ok(simp),
        Err(e) => {
            println!("{}", e.to_string());
            return Err("Erro interno ao listar mercadorias.".into());
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Value};

    use super::*;
    use crate::database::{categoria::Categoria, grupo::GrupoDB, loja::Loja};

    /// Cria o schema offline mínimo (mesmo DDL de
    /// `apps/api/src/helpers/SqliteTablesStrings.ts`) com uma mercadoria que
    /// possui duas lojas em estoque e duas mercadorias extras para exercitar
    /// paginação/ordenação.
    async fn seed_pool() -> sqlx::SqlitePool {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:")
            .await
            .expect("falha ao abrir o banco em memória");

        let schema = r#"
        CREATE TABLE mercadorias (
            id INTEGER PRIMARY KEY,
            key INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            precoCusto REAL NOT NULL DEFAULT 0.00,
            precoVenda REAL NOT NULL DEFAULT 0.00,
            estoque02 INTEGER NOT NULL DEFAULT 0,
            estoque03 INTEGER NOT NULL DEFAULT 0,
            estoque04 INTEGER NOT NULL DEFAULT 0,
            observacoes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            fabricanteId INTEGER,
            categoriaId INTEGER,
            deletedAt TEXT
        );
        CREATE TABLE atributos (
            id INTEGER PRIMARY KEY,
            tipo TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            nome TEXT NOT NULL,
            deletedAt TEXT
        );
        CREATE TABLE Mercadoria_Atributos (
            valor TEXT NOT NULL,
            mercadoriaId INTEGER NOT NULL,
            atributoId INTEGER NOT NULL,
            PRIMARY KEY (mercadoriaId, atributoId)
        );
        CREATE TABLE lojas (
            id INTEGER NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            CNPJ TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT DEFAULT NULL
        );
        CREATE TABLE estoques (
            id INTEGER NOT NULL PRIMARY KEY,
            mercadoriaId INTEGER NOT NULL,
            lojaId INTEGER NOT NULL,
            estoque INTEGER NOT NULL DEFAULT 0,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT DEFAULT NULL
        );
        CREATE INDEX idx_estoques_mercadoriaId ON estoques (mercadoriaId);

        INSERT INTO mercadorias VALUES
            (1, 10, 'CAMISETA PRETA', 25.5, 59.9, 5, 0, 0, NULL,
                '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', 1, 1, NULL),
            (2, 11, 'CAMISETA BRANCA', 30, 70, 0, 0, 0, NULL,
                '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z', 1, 1, NULL);

        INSERT INTO atributos VALUES
            (1, 'text', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', 'cor', NULL);
        INSERT INTO Mercadoria_Atributos VALUES ('preto', 1, 1);

        INSERT INTO lojas VALUES
            (1, 'Loja 02', '12.345.678/0001-99', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (2, 'Loja 03', '98.765.432/0001-11', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (3, 'LOJA APAGADA', '00.000.000/0001-00', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z');

        INSERT INTO estoques VALUES
            (1, 1, 1, 5, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (2, 1, 2, 7, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            -- soft-deleted: espelhando `paranoid: true`, não pode aparecer no payload
            (3, 1, 3, 99, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z');
        "#;

        sqlx::raw_sql(schema).execute(&pool).await.expect("falha ao semear");
        pool
    }

    fn lookup_maps() -> (
        HashMap<i32, Fabricante>,
        HashMap<i32, Categoria>,
    ) {
        let fabricantes = HashMap::from([(
            1,
            Fabricante {
                id: 1,
                nome: "Nike".to_string(),
                created_at: "2024-01-01T00:00:00.000Z".to_string(),
                updated_at: "2024-01-01T00:00:00.000Z".to_string(),
            },
        )]);

        let categorias = HashMap::from([(
            1,
            Categoria {
                id: 1,
                nome: "Roupas".to_string(),
                grupo: GrupoDB {
                    id: 1,
                    nome: "Vestuario".to_string(),
                    created_at: "2024-01-01T00:00:00.000Z".to_string(),
                    updated_at: "2024-01-01T00:00:00.000Z".to_string(),
                },
                created_at: "2024-01-01T00:00:00.000Z".to_string(),
                updated_at: "2024-01-01T00:00:00.000Z".to_string(),
            },
        )]);

        (fabricantes, categorias)
    }

    /// Executa a projeção crua (sem passar por `into_mercadoria`) e devolve as
    /// linhas como `serde_json::Value`, para inspecionar as colunas aliases.
    async fn fetch_raw_rows(pool: &sqlx::SqlitePool) -> Vec<Value> {
        // Só as duas colunas-aliase interessam: queremos conferir que elas existem
        // na projeção e que não vazam para o payload final.
        #[derive(sqlx::FromRow)]
        #[sqlx(rename_all = "camelCase")]
        struct Aliases {
            caracteristicas_json: Option<String>,
            estoque_json: Option<String>,
        }

        let rows: Vec<Aliases> = sqlx::query_as(&format!(
            "{MERCADORIAS_SELECT}WHERE deletedAt IS NULL"
        ))
        .fetch_all(pool)
        .await
        .expect("a projeção deve ser executável");

        let _ = rows[0].caracteristicas_json.as_ref();

        rows.iter()
            .map(|row| {
                json!({
                    "caracteristicasJson": row.caracteristicas_json,
                    "estoqueJson": row.estoque_json,
                })
            })
            .collect()
    }

    async fn fetch_mercadorias(pool: &sqlx::SqlitePool) -> Vec<Mercadoria> {
        let filter = MercadoriaFilter::default();
        let rows: Vec<SQLiteMercadoria> =
            build_mercadorias_query(&filter, false, false)
                .build_query_as()
                .fetch_all(pool)
                .await
                .expect("falha ao executar MERCADORIAS_SELECT");

        let (fabricantes, categorias) = lookup_maps();
        rows.into_iter()
            .filter_map(|m| m.into_mercadoria(&fabricantes, &categorias))
            .collect()
    }

    #[tokio::test]
    async fn estoque_json_produz_o_mesmo_objeto_da_api_online() {
        let pool = seed_pool().await;
        let mercadorias = fetch_mercadorias(&pool).await;
        let camiseta_preta = mercadorias
            .iter()
            .find(|m| m.id == 1)
            .expect("mercadoria 1 não retornada");

        assert_eq!(
            serde_json::to_value(&camiseta_preta.estoque).unwrap(),
            json!([
                {
                    "id": 1,
                    "estoque": 5,
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z",
                    "loja": {
                        "id": 1,
                        "nome": "Loja 02",
                        "CNPJ": "12.345.678/0001-99",
                        "createdAt": "2024-01-01T00:00:00.000Z",
                        "updatedAt": "2024-01-01T00:00:00.000Z",
                    },
                },
                {
                    "id": 2,
                    "estoque": 7,
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z",
                    "loja": {
                        "id": 2,
                        "nome": "Loja 03",
                        "CNPJ": "98.765.432/0001-11",
                        "createdAt": "2024-01-01T00:00:00.000Z",
                        "updatedAt": "2024-01-01T00:00:00.000Z",
                    },
                },
            ]),
            "o array `estoque` deve bater com a interface `Estoque` de packages/types"
        );
    }

    #[tokio::test]
    async fn estoque_apagado_e_loja_apagada_nao_sao_retornados() {
        let pool = seed_pool().await;
        let mercadorias = fetch_mercadorias(&pool).await;
        let camiseta_preta = mercadorias.iter().find(|m| m.id == 1).unwrap();

        // A loja 3 está soft-deleted e o estoque 3 também; nenhum dos dois pode
        // aparecer no payload, igual ao que o Sequelize faria com `paranoid: true`.
        assert_eq!(
            camiseta_preta.estoque.len(),
            2,
            "linhas soft-deleted devem ser filtradas"
        );
        assert!(
            camiseta_preta.estoque.iter().all(|e| e.loja.id != 3),
            "loja soft-deleted não pode ser associada"
        );
    }

    #[tokio::test]
    async fn mercadoria_sem_estoque_retorna_array_vazio() {
        let pool = seed_pool().await;
        let mercadorias = fetch_mercadorias(&pool).await;
        let camiseta_branca = mercadorias.iter().find(|m| m.id == 2).unwrap();

        assert!(
            camiseta_branca.estoque.is_empty(),
            "sem registros o Sequelize devolve `[]`, nunca `null`"
        );
        assert_eq!(
            serde_json::to_value(&camiseta_branca.estoque).unwrap(),
            json!([]),
        );
    }

    #[tokio::test]
    async fn mercadoria_serializada_mantem_o_formato_do_frontend() {
        let pool = seed_pool().await;
        let mercadorias = fetch_mercadorias(&pool).await;
        let camiseta_preta = mercadorias.iter().find(|m| m.id == 1).unwrap();
        let payload = serde_json::to_value(camiseta_preta).unwrap();

        // `IMercadoria` de packages/types/database/Mercadoria/Read.ts
        let expected_keys = [
            "id",
            "key",
            "descricao",
            "fabricante",
            "categoria",
            "caracteristicas",
            "estoque02",
            "estoque03",
            "estoque04",
            "estoque",
            "observacoes",
            "precoCusto",
            "precoVenda",
            "createdAt",
            "updatedAt",
        ];

        let mut actual_keys: Vec<&String> = payload.as_object().unwrap().keys().collect();
        actual_keys.sort();
        let mut sorted_expected = expected_keys.to_vec();
        sorted_expected.sort();

        assert_eq!(
            actual_keys, sorted_expected,
            "o payload offline deve ter exatamente as chaves de `IMercadoria`"
        );
    }

    #[tokio::test]
    async fn coluna_estoque_json_e_omitida_do_payload() {
        let pool = seed_pool().await;
        let raw = fetch_raw_rows(&pool).await;

        // `caracteristicasJson` / `estoqueJson` são colunas auxiliares do SQLite:
        // precisam virar `caracteristicas` / `estoque`, nunca vazar para o front-end.
        for row in raw {
            assert!(row.get("estoqueJson").is_some());
            assert!(row.get("estoque").is_none());
            assert!(row.get("caracteristicasJson").is_some());
            assert!(row.get("caracteristicas").is_none());
        }
    }

    #[tokio::test]
    async fn loja_serializa_cnpj_em_caixa_alta() {
        // A API entrega `CNPJ` ( maiúsculo ) — `packages/types/database/Loja.ts`.
        let loja = Loja {
            id: 1,
            nome: "Loja 02".to_string(),
            cnpj: "12.345.678/0001-99".to_string(),
            created_at: "2024-01-01T00:00:00.000Z".to_string(),
            updated_at: "2024-01-01T00:00:00.000Z".to_string(),
        };

        assert_eq!(
            serde_json::to_value(&loja).unwrap(),
            json!({
                "id": 1,
                "nome": "Loja 02",
                "CNPJ": "12.345.678/0001-99",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z",
            }),
        );
    }

    #[test]
    fn coluna_ausente_resulta_em_vazio() {
        assert!(
            parse_association_column::<Estoque>(None, "estoqueJson")
                .unwrap()
                .is_none(),
            "sem a coluna, o chamador aplica o fallback `vec![]`"
        );
        assert!(
            parse_association_column::<Caracteristicas>(None, "caracteristicasJson")
                .unwrap()
                .is_none()
        );
    }

    #[test]
    fn json_invalido_resulta_em_erro_e_nao_em_panic() {
        let err = parse_association_column::<Estoque>(Some("{nao é json"), "estoqueJson")
            .expect_err("deve reportar erro em vez de panicar");
        assert_eq!(err.code, 500);
        assert!(
            err.message.response.contains("estoqueJson"),
            "a mensagem deve citar a coluna problemática"
        );
    }

    #[test]
    fn json_vazio_deserializa_como_array_vazio() {
        // `json_group_array` devolve a string `'[]'` quando a subquery não encontra
        // linhas; isso precisa virar `Some(vec![])`, não `None`.
        let estoque =
            parse_association_column::<Estoque>(Some("[]"), "estoqueJson").unwrap();
        assert!(estoque.unwrap().is_empty());
    }
}
