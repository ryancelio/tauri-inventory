use sqlx::{QueryBuilder, Sqlite};

use crate::database::{
    filters::{DateFilter, NumberFilter, StringFilter},
    mercadoria::types::MercadoriaFilter,
};

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
        // Agrega os atributos relacionados (via tabela de junção) em um JSON array
        // usando uma subquery correlacionada, para manter o formato esperado por
        // SQLiteMercadoria::caracteristicas_json (Option<String>).
        builder = QueryBuilder::new(
            "SELECT mercadorias.*, \
            (SELECT json_group_array(
                json_object('id', a.id, 'nome', a.nome, 'tipo', a.tipo, 'valor', ma.valor)
            )
            FROM Mercadoria_Atributos ma
            JOIN atributos a ON a.id = ma.atributoId
            WHERE ma.mercadoriaId = mercadorias.id) AS caracteristicasJson \
            FROM mercadorias
            ",
        );
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
        if let Some(ref f) = internal_filter.estoque02 {
            conditions.apply_number("estoque02", f);
        }
        if let Some(ref f) = internal_filter.estoque03 {
            conditions.apply_number("estoque03", f);
        }
        if let Some(ref f) = internal_filter.estoque04 {
            conditions.apply_number("estoque04", f);
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
