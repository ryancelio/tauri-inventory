use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use sqlx::{QueryBuilder, Sqlite};
use tauri::State;

use crate::{
    database::{
        audit_logs::AuditLog,
        usuarios::LoggedUser,
        ApiListResponse,
    },
    offline::database::{get_db_pool, off_users::SQLiteLoggedUser},
    ApiResponse, AppState, RustApiError,
};

/// Tamanho de página fixo, espelhando o `LOG_PAGE_LIMIT = 100` do servidor.
const LOG_PAGE_LIMIT: i64 = 100;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteAuditLog {
    pub id: i32,
    pub usuario_id: Option<i32>,
    // Campos do tipo enum são armazenados como TEXT no SQLite e convertidos
    // depois, pois os enums de `audit_logs` não implementam `Type`/`Decode`.
    pub alvo_tipo: String,
    pub alvo_id: Option<i32>,
    pub acao: String,
    pub nivel: String,
    // `dados` é um JSON serializado em coluna TEXT.
    pub dados: Option<String>,
    pub data: String,
    pub ip: Option<String>,
}

impl SQLiteAuditLog {
    fn into_audit_log(
        self,
        usuarios: &HashMap<i32, LoggedUser>,
    ) -> Result<AuditLog, RustApiError> {
        Ok(AuditLog {
            id: self.id,
            usuario: self.usuario_id.and_then(|id| usuarios.get(&id)).cloned(),
            alvo_tipo: parse_enum_value(&self.alvo_tipo, "alvoTipo")?,
            alvo_id: self.alvo_id,
            acao: parse_enum_value(&self.acao, "acao")?,
            nivel: parse_enum_value(&self.nivel, "nivel")?,
            dados: self
                .dados
                .as_deref()
                .and_then(|d| serde_json::from_str(d).ok()),
            data: self.data,
            ip: self.ip,
        })
    }
}

/// Converte a string TEXT do SQLite de volta para o enum do domínio.
/// Os enums de `audit_logs` são `#[serde(rename_all = "SCREAMING_SNAKE_CASE")]`,
/// então basta desserializar a própria string.
fn parse_enum_value<T>(value: &str, coluna: &str) -> Result<T, RustApiError>
where
    T: serde::de::DeserializeOwned,
{
    serde_json::from_value(serde_json::Value::String(value.to_string())).map_err(|_| {
        RustApiError {
            code: 500,
            message: ApiResponse {
                response: format!(
                    "Valor inválido para a coluna {coluna} no banco de dados local"
                ),
            },
        }
    })
}

/// Adiciona uma condição `coluna = valor` ao builder, inserindo `WHERE`
/// na primeira condição e `AND` nas demais.
fn push_equal<'args, T>(
    builder: &mut QueryBuilder<'args, Sqlite>,
    has_where: &mut bool,
    column: &str,
    value: T,
) where
    T: sqlx::Encode<'args, Sqlite> + sqlx::Type<Sqlite> + Send + 'args,
{
    if *has_where {
        builder.push(" AND ");
    } else {
        builder.push(" WHERE ");
        *has_where = true;
    }
    builder.push(column).push(" = ").push_bind(value);
}

/// Aplica os filtros suportados (alvo, usuário, ação e nível) a uma query
/// de audit logs. O mesmo helper é usado para a query de dados e a de contagem.
fn apply_log_filters<'args>(
    builder: &mut QueryBuilder<'args, Sqlite>,
    target: Option<(&'args str, i32)>,
    user_id: Option<i32>,
    action: Option<&'args str>,
    level: Option<&'args str>,
) {
    let mut has_where = false;

    // Filtro por tipo de alvo (usado nas rotas específicas tipo
    // mercadoria/usuário/fabricante). A string deve ser o valor
    // `SCREAMING_SNAKE_CASE` com que o enum é salvo na coluna `alvoTipo`.
    if let Some((alvo_tipo, alvo_id)) = target {
        push_equal(builder, &mut has_where, "alvoTipo", alvo_tipo);
        push_equal(builder, &mut has_where, "alvoId", alvo_id);
    }
    if let Some(user_id) = user_id {
        push_equal(builder, &mut has_where, "usuarioId", user_id);
    }
    if let Some(action) = action {
        push_equal(builder, &mut has_where, "acao", action);
    }
    if let Some(level) = level {
        push_equal(builder, &mut has_where, "nivel", level);
    }
}

/// Carrega os usuários ativos para resolver o `usuario` (Option<LoggedUser>)
/// de cada log, espelhando o `include` da API.
async fn load_usuarios_por_id(
    pool: &sqlx::Pool<sqlx::Sqlite>,
) -> Result<HashMap<i32, LoggedUser>, RustApiError> {
    let usuarios: Vec<SQLiteLoggedUser> =
        match sqlx::query_as("SELECT id, nome, funcao, local FROM usuarios WHERE deletedAt IS NULL")
            .fetch_all(pool)
            .await
        {
            Ok(val) => val,
            Err(e) => {
                return Err(RustApiError {
                    code: 500,
                    message: ApiResponse {
                        response: format!(
                            "Erro ao executar a consulta no modo offline: {}",
                            e
                        ),
                    },
                })
            }
        };

    Ok(usuarios
        .into_iter()
        .filter_map(|u| LoggedUser::try_from(u).ok())
        .map(|u| (u.id, u))
        .collect())
}

/// Consulta central de audit logs no SQLite local, compartilhada por todas
/// as rotas de logs. Retorna `ApiListResponse<AuditLog>` no mesmo formato
/// da API online.
async fn query_audit_logs(
    state: &State<'_, AppState>,
    page: &'_ str,
    target: Option<(&'static str, i32)>,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    let pool = get_db_pool(state)?;

    let page: i64 = page.trim().parse::<i64>().unwrap_or(1).max(1);
    let offset = (page - 1) * LOG_PAGE_LIMIT;

    let usuarios = load_usuarios_por_id(&pool).await?;

    let mut data_builder = QueryBuilder::new("SELECT * FROM AuditLog");
    apply_log_filters(&mut data_builder, target, user_id, action, level);
    data_builder
        // Espelha o `order: [["id", "DESC"]]` da API.
        .push(" ORDER BY id DESC")
        .push(" LIMIT ")
        .push_bind(LOG_PAGE_LIMIT)
        .push(" OFFSET ")
        .push_bind(offset);

    let logs: Vec<SQLiteAuditLog> = data_builder
        .build_query_as()
        .fetch_all(&pool)
        .await
        .map_err(|e| RustApiError {
            code: 500,
            message: ApiResponse {
                response: format!("Erro ao executar a consulta no modo offline: {}", e),
            },
        })?;

    let mut count_builder = QueryBuilder::new("SELECT COUNT(*) FROM AuditLog");
    apply_log_filters(&mut count_builder, target, user_id, action, level);

    let count: i32 = count_builder
        .build_query_scalar()
        .fetch_one(&pool)
        .await
        .map_err(|e| RustApiError {
            code: 500,
            message: ApiResponse {
                response: format!("Erro ao executar a consulta no modo offline: {}", e),
            },
        })?;

    let data = logs
        .into_iter()
        .map(|log| log.into_audit_log(&usuarios))
        .collect::<Result<Vec<_>, _>>()?;

    Ok(ApiListResponse { data, count })
}

pub async fn offline_get_all_audit_logs(
    state: State<'_, AppState>,
    page: &'_ str,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    query_audit_logs(&state, page, None, user_id, action, level).await
}

pub async fn offline_get_mercadoria_logs(
    state: State<'_, AppState>,
    page: &'_ str,
    merc_id: i32,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    query_audit_logs(
        &state,
        page,
        Some(("MERCADORIA", merc_id)),
        user_id,
        action,
        level,
    )
    .await
}

pub async fn offline_get_usuario_logs(
    state: State<'_, AppState>,
    page: &'_ str,
    user_id_target: i32,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    query_audit_logs(
        &state,
        page,
        Some(("USUARIO", user_id_target)),
        user_id,
        action,
        level,
    )
    .await
}

pub async fn offline_get_fabricante_logs(
    state: State<'_, AppState>,
    page: &'_ str,
    fabricante_id: i32,
    user_id: Option<i32>,
    action: Option<&'_ str>,
    level: Option<&'_ str>,
) -> Result<ApiListResponse<AuditLog>, RustApiError> {
    query_audit_logs(
        &state,
        page,
        Some(("FABRICANTE", fabricante_id)),
        user_id,
        action,
        level,
    )
    .await
}