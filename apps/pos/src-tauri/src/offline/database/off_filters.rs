use sqlx::{QueryBuilder, Sqlite};

use crate::database::{
    filters::{loja_id_do_filtro_de_estoque, DateFilter, NumberFilter, StringFilter},
    mercadoria::types::MercadoriaFilter,
};

/// Projeção usada por todas as consultas de mercadoria.
///
/// Espelha os `include` do Sequelize em
/// `apps/api/src/controllers/Mercadoria.ts` (`caracteristicas`, `estoque` +
/// `loja`), serializando as associações em colunas JSON para que cada linha
/// continue sendo um único registro de `mercadorias` (o Rust então desserializa
/// em `Vec<Caracteristicas>` / `Vec<Estoque>`).
///
/// * `caracteristicasJson`: `[{ id, nome, tipo, valor }]`
/// * `estoqueJson`: `[{ id, estoque, createdAt, updatedAt, loja: {...} }]`, onde
///   `loja` é `{ id, nome, CNPJ, createdAt, updatedAt }`
///
/// Os `deletedAt IS NULL` reproduzem o `paranoid: true` dos models `Estoque` e
/// `Lojas`, que faz o Sequelize descartar as linhas apagadas nos `include`.
pub const MERCADORIAS_SELECT: &str = "SELECT mercadorias.*, \
    (SELECT json_group_array(
        json_object('id', a.id, 'nome', a.nome, 'tipo', a.tipo, 'valor', ma.valor)
    )
    FROM Mercadoria_Atributos ma
    JOIN atributos a ON a.id = ma.atributoId
    WHERE ma.mercadoriaId = mercadorias.id) AS caracteristicasJson, \
    (SELECT json_group_array(
        json_object(
            'id', e.id,
            'estoque', e.estoque,
            'createdAt', e.createdAt,
            'updatedAt', e.updatedAt,
            'loja', json_object(
                'id', l.id,
                'nome', l.nome,
                'CNPJ', l.CNPJ,
                'createdAt', l.createdAt,
                'updatedAt', l.updatedAt
            )
        )
    )
    FROM estoques e
    JOIN lojas l ON l.id = e.lojaId
    WHERE e.mercadoriaId = mercadorias.id
        AND e.deletedAt IS NULL
        AND l.deletedAt IS NULL) AS estoqueJson \
    FROM mercadorias ";

pub struct ConditionBuilder<'a, 'args> {
    builder: &'a mut QueryBuilder<'args, Sqlite>,
    has_conditions: bool,
}

impl<'a, 'args> ConditionBuilder<'a, 'args> {
    /// `has_conditions` indica se a query já possui um `WHERE` (ex.: quando o
    /// filtro de `deletedAt IS NULL` já foi aplicado antes dos filtros do usuário).
    pub fn new(builder: &'a mut QueryBuilder<'args, Sqlite>, has_conditions: bool) -> Self {
        Self {
            builder,
            has_conditions,
        }
    }

    fn and(&mut self) -> &mut QueryBuilder<'args, Sqlite> {
        if self.has_conditions {
            self.builder.push(" AND ");
        } else {
            self.builder.push(" WHERE ");
            self.has_conditions = true;
        }
        self.builder
    }

    /// Helper genérico para aplicar a cláusula IN (?, ?, ?)
    /// Equivalente ao `Op.in` da API em Node
    pub fn apply_in<T>(&mut self, col: &str, values: &'args [T])
    where
        T: sqlx::Encode<'args, Sqlite> + sqlx::Type<Sqlite> + Send + 'args,
    {
        if values.is_empty() {
            // Previne erro de sintaxe 'IN ()', forçando um resultado nulo
            self.and().push(col).push(" IN (NULL)");
            return;
        }

        self.and().push(col).push(" IN (");
        let mut separated = self.builder.separated(", ");
        for val in values {
            separated.push_bind(val);
        }
        separated.push_unseparated(")");
    }

    pub fn apply_string(&mut self, col: &str, f: &'args StringFilter) {
        if let Some(ref eq) = f.eq {
            self.and().push(col).push(" = ").push_bind(eq);
        }
        if let Some(ref contains) = f.contains {
            self.and()
                .push(col)
                .push(" LIKE ")
                // Espelha o comportamento do Node.js: `(value as string).toLowerCase()`
                .push_bind(format!("%{}%", contains.to_lowercase()));
        }
        if let Some(ref in_values) = f.in_values {
            self.apply_in(col, in_values);
        }
    }

    pub fn apply_number(&mut self, col: &str, f: &'args NumberFilter) {
        if let Some(eq) = f.eq {
            self.and().push(col).push(" = ").push_bind(eq);
        }
        if let Some(gt) = f.gt {
            self.and().push(col).push(" > ").push_bind(gt);
        }
        if let Some(gte) = f.gte {
            self.and().push(col).push(" >= ").push_bind(gte);
        }
        if let Some(lt) = f.lt {
            self.and().push(col).push(" < ").push_bind(lt);
        }
        if let Some(lte) = f.lte {
            self.and().push(col).push(" <= ").push_bind(lte);
        }
        if let Some(ref in_values) = f.in_values {
            self.apply_in(col, in_values);
        }
    }

    pub fn apply_date(&mut self, col: &str, f: &'args DateFilter) {
        if let Some(ref eq) = f.eq {
            self.and().push(col).push(" = ").push_bind(eq);
        }
        if let Some(ref gt) = f.gt {
            self.and().push(col).push(" > ").push_bind(gt);
        }
        if let Some(ref gte) = f.gte {
            self.and().push(col).push(" >= ").push_bind(gte);
        }
        if let Some(ref lt) = f.lt {
            self.and().push(col).push(" < ").push_bind(lt);
        }
        if let Some(ref lte) = f.lte {
            self.and().push(col).push(" <= ").push_bind(lte);
        }
    }
    pub fn apply_string_exists(&mut self, base_query: &str, col: &str, f: &'args StringFilter) {
        let has_cond = f.eq.is_some() || f.contains.is_some() || f.in_values.is_some();
        if !has_cond {
            return;
        }

        self.and().push("EXISTS (").push(base_query);

        if let Some(ref eq) = f.eq {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" = ")
                .push_bind(eq);
        }
        if let Some(ref contains) = f.contains {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" LIKE ")
                .push_bind(format!("%{}%", contains.to_lowercase()));
        }
        if let Some(ref in_values) = f.in_values {
            if in_values.is_empty() {
                self.builder.push(" AND ").push(col).push(" IN (NULL)");
            } else {
                self.builder.push(" AND ").push(col).push(" IN (");
                let mut sep = self.builder.separated(", ");
                for val in in_values {
                    sep.push_bind(val);
                }
                sep.push_unseparated(")");
            }
        }

        self.builder.push(")"); // Fecha o parênteses do EXISTS
    }

    /// Aplica um filtro numérico usando EXISTS
    pub fn apply_number_exists(&mut self, base_query: &str, col: &str, f: &'args NumberFilter) {
        let has_cond = f.eq.is_some()
            || f.gt.is_some()
            || f.gte.is_some()
            || f.lt.is_some()
            || f.lte.is_some()
            || f.in_values.is_some();
        if !has_cond {
            return;
        }

        self.and().push("EXISTS (").push(base_query);

        if let Some(eq) = f.eq {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" = ")
                .push_bind(eq);
        }
        if let Some(gt) = f.gt {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" > ")
                .push_bind(gt);
        }
        if let Some(gte) = f.gte {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" >= ")
                .push_bind(gte);
        }
        if let Some(lt) = f.lt {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" < ")
                .push_bind(lt);
        }
        if let Some(lte) = f.lte {
            self.builder
                .push(" AND ")
                .push(col)
                .push(" <= ")
                .push_bind(lte);
        }
        if let Some(ref in_values) = f.in_values {
            if in_values.is_empty() {
                self.builder.push(" AND ").push(col).push(" IN (NULL)");
            } else {
                self.builder.push(" AND ").push(col).push(" IN (");
                let mut sep = self.builder.separated(", ");
                for val in in_values {
                    sep.push_bind(val);
                }
                sep.push_unseparated(")");
            }
        }

        self.builder.push(")"); // Fecha o parênteses do EXISTS
    }
}

pub fn build_mercadorias_query<'args>(
    filter: &'args MercadoriaFilter,
    is_count: bool,
    include_deleted: bool,
) -> QueryBuilder<'args, Sqlite> {
    let mut builder;
    if is_count {
        builder = QueryBuilder::new("SELECT COUNT(id) FROM mercadorias");
    } else {
        // Reaproveita a projeção compartilhada com `offline_get_single_mercadoria`
        // para que ambas devolvam exatamente o mesmo objeto.
        builder = QueryBuilder::new(MERCADORIAS_SELECT);
    }

    // Por padrão o servidor trabalha com soft delete (model `paranoid: true`),
    // então a listagem offline deve esconder as linhas deletadas — a menos que
    // `include_deleted` seja true (ex.: filtros de auditoria).
    let has_deleted_filter = !include_deleted;
    if has_deleted_filter {
        builder.push(" WHERE deletedAt IS NULL");
    }

    if let Some(ref internal_filter) = filter.filter {
        let mut conditions = ConditionBuilder::new(&mut builder, has_deleted_filter);

        if let Some(ref f) = internal_filter.id {
            conditions.apply_number("id", f);
        }
        if let Some(ref f) = internal_filter.key {
            conditions.apply_number("key", f);
        }
        if let Some(ref f) = internal_filter.descricao {
            conditions.apply_string("descricao", f);
        }
        if let Some(ref f) = internal_filter.fabricante_id {
            conditions.apply_number("fabricanteId", f);
        }
        if let Some(ref f) = internal_filter.categoria_id {
            conditions.apply_number("categoriaId", f);
        }
        if let Some(ref f) = internal_filter.grupo_id {
            let base_query = "SELECT 1 FROM categoria WHERE id = mercadorias.categoriaId";
            conditions.apply_number_exists(base_query, "grupoId", f);
        }
        // Estoque por loja. Não existe mais coluna de estoque em `mercadorias`: o
        // estoque vive em `estoques`, uma linha por (mercadoria, loja). Cada loja
        // marcada vira um `EXISTS` independente, e o `and()` os combina com AND
        // — o mesmo comportamento do antigo `estoque02 > 0 AND estoque03 > 0`.
        if let Some(ref f) = internal_filter.estoque {
            for (loja_id, val) in f {
                let Some(loja) = loja_id_do_filtro_de_estoque(loja_id) else {
                    println!("Chave de loja inválida no filtro de estoque: {loja_id}");
                    continue;
                };

                // Os `deletedAt IS NULL` espelham o `paranoid: true` dos models
                // `Estoque`/`Lojas` usado na projeção `MERCADORIAS_SELECT`:
                // estoque de loja apagada não conta como "tem estoque".
                let base_query = format!(
                    "SELECT 1 FROM estoques e \
                     JOIN lojas l ON l.id = e.lojaId \
                     WHERE e.mercadoriaId = mercadorias.id \
                     AND e.lojaId = {loja} \
                     AND e.deletedAt IS NULL \
                     AND l.deletedAt IS NULL"
                );

                match val {
                    crate::database::filters::FilterNode::Number(n) => {
                        conditions.apply_number_exists(&base_query, "e.estoque", n);
                    }
                    crate::database::filters::FilterNode::String(_)
                    | crate::database::filters::FilterNode::Enum(_) => {}
                }
            }
        }
        if let Some(ref f) = internal_filter.observacoes {
            conditions.apply_string("observacoes", f);
        }
        if let Some(ref f) = internal_filter.preco_custo {
            conditions.apply_number("precoCusto", f);
        }
        if let Some(ref f) = internal_filter.preco_venda {
            conditions.apply_number("precoVenda", f);
        }
        if let Some(ref f) = internal_filter.created_at {
            conditions.apply_date("createdAt", f);
        }
        if let Some(ref f) = internal_filter.updated_at {
            conditions.apply_date("updatedAt", f);
        }

        // Filtra por atributos via tabela de junção (mercadoria_atributos + atributos),
        // em vez de json_extract sobre uma coluna JSON.
        if let Some(ref f) = internal_filter.caracteristicas {
            for (key, val) in f {
                let is_numeric_id = key.chars().all(|c| c.is_ascii_digit());

                // Preparamos a subquery de base e identificamos a coluna que será comparada
                let (base_query, column) = if is_numeric_id {
                    (
                        format!(
                            "SELECT 1 FROM Mercadoria_Atributos ma \
                             WHERE ma.mercadoriaId = mercadorias.id \
                             AND ma.atributoId = {}",
                            key
                        ),
                        "ma.valor",
                    )
                } else {
                    let safe_key: String = key
                        .chars()
                        .filter(|c| c.is_alphanumeric() || *c == '_' || *c == ' ')
                        .collect();
                    if safe_key.is_empty() {
                        continue;
                    }

                    (
                        format!(
                            "SELECT 1 FROM Mercadoria_Atributos ma \
                             JOIN atributos a ON a.id = ma.atributoId \
                             WHERE ma.mercadoriaId = mercadorias.id \
                             AND a.nome = '{}'",
                            safe_key
                        ),
                        "ma.valor",
                    )
                };

                // Despacha para os novos métodos do ConditionBuilder
                match val {
                    crate::database::filters::FilterNode::String(s) => {
                        conditions.apply_string_exists(&base_query, column, s);
                    }
                    crate::database::filters::FilterNode::Number(n) => {
                        let cast_column = format!("CAST({} AS REAL)", column);
                        conditions.apply_number_exists(&base_query, &cast_column, n);
                    }
                    crate::database::filters::FilterNode::Enum(_e) => {}
                }
            }
        }
    }

    if !is_count {
        if let Some(ref sort_by) = filter.sort_by {
            let safe_sort_by: String = sort_by
                .chars()
                .filter(|c| c.is_alphanumeric() || *c == '_')
                .collect();
            if !safe_sort_by.is_empty() {
                builder.push(" ORDER BY ");
                builder.push(safe_sort_by);

                if let Some(ref sort_order) = filter.sort_order {
                    if sort_order.eq_ignore_ascii_case("DESC") {
                        builder.push(" DESC");
                    } else {
                        builder.push(" ASC");
                    }
                } else {
                    builder.push(" ASC");
                }
            }
        }

        let limit = filter.limit.unwrap_or(10);
        builder.push(" LIMIT ").push_bind(limit);

        let page = filter.page.unwrap_or(1);
        let offset = (page.saturating_sub(1)) * limit;
        builder.push(" OFFSET ").push_bind(offset);
    }

    builder
}

#[cfg(test)]
mod tests {
    use crate::database::mercadoria::types::MercadoriaFilter;

    use super::*;

    /// Mesmo schema de `off_mercadorias::tests`, que por sua vez espelha o DDL
    /// de `apps/api/src/helpers/SqliteTablesStrings.ts`.
    ///
    /// * mercadoria 1: estoque 5 na loja 1, 7 na loja 2, e uma linha
    ///   soft-deleted na loja 3
    /// * mercadoria 2: sem nenhum registro em `estoques`
    async fn seed_pool() -> sqlx::SqlitePool {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:")
            .await
            .expect("falha ao abrir o banco em memória");

        sqlx::raw_sql(
            r#"
        CREATE TABLE mercadorias (
            id INTEGER PRIMARY KEY,
            key INTEGER NOT NULL,
            descricao TEXT NOT NULL,
            precoCusto REAL NOT NULL DEFAULT 0.00,
            precoVenda REAL NOT NULL DEFAULT 0.00,
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

        INSERT INTO mercadorias VALUES
            (1, 10, 'CAMISETA PRETA', 25.5, 59.9, NULL,
                '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', 1, 1, NULL),
            (2, 11, 'CAMISETA BRANCA', 30, 70, NULL,
                '2024-01-02T00:00:00.000Z', '2024-01-02T00:00:00.000Z', 1, 1, NULL);

        INSERT INTO lojas VALUES
            (1, 'Timoteo', '12.345.678/0001-99', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (2, 'Coronel Fabriciano', '98.765.432/0001-11', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (3, 'Loja Apagada', '00.000.000/0001-00', '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z');

        INSERT INTO estoques VALUES
            (1, 1, 1, 5, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            (2, 1, 2, 7, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', NULL),
            -- linha soft-deleted: `paranoid: true` a esconde do filtro também
            (3, 1, 3, 99, '2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z', '2024-06-01T00:00:00.000Z');
        "#,
        )
        .execute(&pool)
        .await
        .expect("falha ao semear");

        pool
    }

    /// Monta o filtro a partir do JSON que o frontend realmente envia, para que
    /// a desserialização também seja exercitada.
    fn filter_from_json(json: serde_json::Value) -> MercadoriaFilter {
        serde_json::from_value(json).expect("filtro deve desserializar")
    }

    async fn ids(pool: &sqlx::SqlitePool, filter_json: serde_json::Value) -> Vec<i32> {
        let filter = filter_from_json(filter_json);

        let rows: Vec<(i32,)> = build_mercadorias_query(&filter, false, false)
            .build_query_as()
            .fetch_all(pool)
            .await
            .expect("a query deve ser executável");

        rows.into_iter().map(|r| r.0).collect()
    }

    #[tokio::test]
    async fn estoque_positivo_filtra_pela_loja_marcada() {
        let pool = seed_pool().await;

        // `estoque1Positivo` marcado na URL → { "1": { gt: 0 } }
        let ids = ids(&pool, serde_json::json!({ "filter": { "estoque": { "1": { "gt": 0 } } } })).await;

        assert_eq!(ids, vec![1], "só a CAMISETA PRETA tem estoque na loja 1");
    }

    #[tokio::test]
    async fn estoque_vazio_nao_filtra_nada() {
        let pool = seed_pool().await;

        let ids = ids(&pool, serde_json::json!({ "filter": { "estoque": {} } })).await;

        assert_eq!(ids.len(), 2, "sem loja marcada, nenhuma loja é filtrada");
    }

    #[tokio::test]
    async fn varias_lojas_sao_combinadas_com_and() {
        let pool = seed_pool().await;

        let ids = ids(
            &pool,
            serde_json::json!({ "filter": { "estoque": { "1": { "gt": 0 }, "2": { "gt": 0 } } } }),
        )
        .await;

        // A mercadoria 1 tem estoque nas duas; a 2 não tem em nenhuma. O AND
        // preserva a semântica do antigo `estoque02 > 0 AND estoque03 > 0`.
        assert_eq!(ids, vec![1]);
    }

    #[tokio::test]
    async fn and_com_uma_loja_sem_estoque_nao_retorna_nada() {
        let pool = seed_pool().await;

        // Loja 4 não existe e nenhuma mercadoria tem estoque lá.
        let ids = ids(
            &pool,
            serde_json::json!({ "filter": { "estoque": { "1": { "gt": 0 }, "4": { "gt": 0 } } } }),
        )
        .await;

        assert!(ids.is_empty(), "exigir estoque numa loja inexistente esvazia a lista");
    }

    #[tokio::test]
    async fn loja_soft_deleted_nao_conta_como_estoque() {
        let pool = seed_pool().await;

        // A loja 3 tem 99 unidades na mercadoria 1, mas a loja está apagada —
        // o `paranoid: true` de `LojasModel`/`EstoqueModel` a esconde.
        let ids = ids(&pool, serde_json::json!({ "filter": { "estoque": { "3": { "gt": 0 } } } })).await;

        assert!(ids.is_empty());
    }

    #[tokio::test]
    async fn estoque_apagado_nao_conta_como_estoque() {
        let pool = seed_pool().await;

        sqlx::query("UPDATE estoques SET deletedAt = '2024-06-01T00:00:00.000Z' WHERE lojaId = 1")
            .execute(&pool)
            .await
            .expect("falha ao apagar estoque");

        let ids = ids(&pool, serde_json::json!({ "filter": { "estoque": { "1": { "gt": 0 } } } })).await;

        assert!(ids.is_empty());
    }

    #[tokio::test]
    async fn chave_de_loja_invalida_e_descartada_sem_quebrar_a_query() {
        let pool = seed_pool().await;

        // Chave não-numérica é ignorada; a query segue válida e sem filtro.
        let ids = ids(
            &pool,
            serde_json::json!({ "filter": { "estoque": { "1 OR 1=1": { "gt": 0 } } } }),
        )
        .await;

        assert_eq!(ids.len(), 2, "a chave malformada não pode gerar SQL arbitrário");
    }

    #[tokio::test]
    async fn operadores_de_intervalo_sao_aplicados() {
        let pool = seed_pool().await;

        // Loja 1 tem 5: `gte 10` não casa, `lte 10` casa.
        let alto = ids(&pool, serde_json::json!({ "filter": { "estoque": { "1": { "gte": 10 } } } })).await;
        assert!(alto.is_empty());

        let baixo = ids(&pool, serde_json::json!({ "filter": { "estoque": { "1": { "lte": 10 } } } })).await;
        assert_eq!(baixo, vec![1]);
    }

    #[tokio::test]
    async fn estoque_combina_com_os_demais_filtros() {
        let pool = seed_pool().await;

        let ids = ids(
            &pool,
            serde_json::json!({
                "filter": {
                    "estoque": { "1": { "gt": 0 } },
                    "descricao": { "contains": "BRANCA" }
                }
            }),
        )
        .await;

        assert!(
            ids.is_empty(),
            "estoque da loja 1 e descrição BRANCA não podem coexistir"
        );
    }

    #[tokio::test]
    async fn contagem_usa_o_mesmo_filtro_de_estoque() {
        let pool = seed_pool().await;
        let filter = filter_from_json(
            serde_json::json!({ "filter": { "estoque": { "2": { "gt": 0 } } } }),
        );

        let (count,): (i32,) = build_mercadorias_query(&filter, true, false)
            .build_query_as()
            .fetch_one(&pool)
            .await
            .expect("a contagem deve ser executável");

        assert_eq!(count, 1);
    }
}
