use bcrypt::verify;
use sqlx::{QueryBuilder, Sqlite};

use crate::{
    database::{
        loja::Loja,
        usuarios::{Funcao, LoggedUser, UsuarioListFilter, UsuarioListing},
    },
    offline::database::get_db_pool,
    AppState, RustApiError,
};

/// Projeção de `usuarios` compartilhada por este módulo e por
/// [`crate::offline::database::off_audit_logs`], que precisa do mesmo formato
/// para resolver o `usuario` de cada audit log.
///
/// `lojaId` é uma coluna achatada — `Loja` não implementa `sqlx::Type`, então
/// não pode ser campo de um `FromRow`. A loja entra como `localJson`, um
/// `json_object` que espelha o `include: [{ association: "local" }]` da API.
///
/// A subquery **não** filtra `l.deletedAt`: a loja de um usuário é parte da
/// identidade dele (`lojaId` é `NOT NULL` nos dois schemas), então resolver
/// mesmo uma loja soft-deleted é melhor que devolver `null` e fazer o
/// `serde` falhar em `LoggedUser.local`. O `include` da API faz o mesmo
/// (`paranoid: false` em `listarUsuarios`).
///
/// Termina em espaço para que `{USUARIOS_SELECT}WHERE ...` funcione nos dois
/// módulos.
pub const USUARIOS_SELECT: &str = r#"SELECT
    usuarios.id,
    usuarios.nome,
    usuarios.funcao,
    usuarios.usuario,
    usuarios.ativo,
    usuarios.createdAt,
    usuarios.updatedAt,
    usuarios.deletedAt,
    usuarios.ativo,
    (
        SELECT json_object(
            'id', l.id,
            'nome', l.nome,
            'CNPJ', l.CNPJ,
            'createdAt', l.createdAt,
            'updatedAt', l.updatedAt
        )
        FROM lojas AS l
        WHERE l.id = usuarios.lojaId
    ) AS localJson
FROM usuarios "#;

/// Loja devolvida quando `lojaId` não resolve (ponteiro pendurado para uma loja
/// que não está no banco local).
///
/// `local` é `Loja` e não `Option<Loja>` em `LoggedUser`/`UsuarioListing`
/// porque o app consome `user.local.id` direto. Um placeholder degrada a tela
/// ("Loja desconhecida"); propagar o erro derrubaria o login inteiro e a
/// listagem de usuários por causa de um registro órfão.
fn loja_desconhecida() -> Loja {
    Loja {
        id: 0,
        nome: "Loja desconhecida".to_string(),
        cnpj: String::new(),
        created_at: String::new(),
        updated_at: String::new(),
    }
}

/// Desserializa a coluna `localJson` de [`USUARIOS_SELECT`].
///
/// Diferente das colunas JSON de `off_mercadorias.rs` (que são listas e
/// devolvem `Option` para o chamador aplicar `vec![]`), aqui a ausência é
/// absorvida pelo placeholder de [`loja_desconhecida`] para manter a assinatura
/// `local()` sem `Result`.
fn parse_local(raw: Option<&str>) -> Loja {
    let Some(json) = raw else {
        return loja_desconhecida();
    };

    // `json_object` com coluna TEXT devolve a JSON string; uma coluna
    // inteiramente NULL chega aqui como NULL e cai no placeholder.
    match serde_json::from_str::<Loja>(json) {
        Ok(loja) => loja,
        Err(e) => {
            println!("Erro ao ler a coluna localJson do usuario: {e}");
            loja_desconhecida()
        }
    }
}

#[derive(Debug, serde::Deserialize, serde::Serialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteLoggedUser {
    pub id: i32,
    pub nome: String,
    pub funcao: String,
    pub local_json: Option<String>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize, sqlx::FromRow)]
#[sqlx(rename_all = "camelCase")]
pub struct SQLiteUsuarioListing {
    pub id: i32,
    pub nome: String,
    pub funcao: String,
    pub local_json: Option<String>,
    pub usuario: String,
    pub ativo: bool,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
}

impl SQLiteLoggedUser {
    /// A coluna `funcao` é TEXT no SQLite (o enum do MySQL não implementa
    /// `sqlx::Type`), então a conversão para `Funcao` é explícita.
    pub fn parse_funcao(&self) -> Result<Funcao, RustApiError> {
        Funcao::try_from(self.funcao.as_str())
    }

    pub fn local(&self) -> Loja {
        parse_local(self.local_json.as_deref())
    }
}

impl SQLiteUsuarioListing {
    pub fn parse_funcao(&self) -> Result<Funcao, RustApiError> {
        Funcao::try_from(self.funcao.as_str())
    }

    pub fn local(&self) -> Loja {
        parse_local(self.local_json.as_deref())
    }
}

pub async fn offline_login(
    usuario: String,
    senha: String,
    state: &tauri::State<'_, AppState>,
) -> Result<LoggedUser, RustApiError> {
    let pool = get_db_pool(state)?;

    let user_response: (String, String) =
        match sqlx::query_as("SELECT usuario, senhaHash FROM usuarios WHERE usuario = ?")
            .bind(usuario)
            .fetch_optional(&pool)
            .await
        {
            Ok(val) => match val {
                Some(val) => val,
                None => {
                    return Err(RustApiError {
                        code: 400,
                        message: crate::ApiResponse {
                            response: "Usuario/Senha Inválidos".to_string(),
                        },
                    })
                }
            },
            Err(e) => {
                println!("Erro ao ler usuarios para login: {e}");
                return Err(RustApiError {
                    code: 500,
                    message: crate::ApiResponse {
                        response: "Erro interno ao conectar ao banco de dados local.".to_string(),
                    },
                });
            }
        };
    let hash = user_response.1.clone();
    let valid_pass = match tokio::task::spawn_blocking(move || verify(senha, &hash)).await {
        Ok(Ok(val)) => val,
        _ => {
            // println!("Erro BCRYPT: {}", err.to_string());
            return Err(RustApiError {
                code: 500,
                message: crate::ApiResponse {
                    response: "Erro interno ao conectar ao banco de dados local.".to_string(),
                },
            });
        }
    };

    if valid_pass {
        // `USUARIOS_SELECT` traz a loja já aninhada; `fetch_optional` em vez de
        // `fetch_one` para não estourar com `RowNotFound` se o usuário for
        // apagado entre a checagem da senha e esta query.
        let logged_user = match sqlx::query_as::<Sqlite, SQLiteLoggedUser>(&format!(
            "{USUARIOS_SELECT}WHERE usuarios.usuario = ?"
        ))
        .bind(user_response.0)
        .fetch_optional(&pool)
        .await
        {
            Ok(Some(val)) => val,
            Ok(None) => {
                return Err(RustApiError {
                    code: 400,
                    message: crate::ApiResponse {
                        response: "Usuario/Senha inválidos.".to_string(),
                    },
                })
            }
            Err(e) => {
                println!("Error getting user_data for response: {e}");
                return Err(RustApiError {
                    code: 500,
                    message: crate::ApiResponse {
                        response: "Erro interno ao conectar ao banco de dados local.".to_string(),
                    },
                });
            }
        };
        logged_user.try_into()
    } else {
        Err(RustApiError {
            code: 400,
            message: crate::ApiResponse {
                response: "Usuario/Senha inválidos.".to_string(),
            },
        })
    }
}

pub async fn offline_get_usuarios(
    state: &tauri::State<'_, AppState>,
    get_deleted: Option<bool>,
    filter: Option<UsuarioListFilter>,
) -> Result<Vec<UsuarioListing>, RustApiError> {
    let db = get_db_pool(state)?;

    let mut qb = QueryBuilder::<Sqlite>::new(USUARIOS_SELECT);

    // Espelha o `paranoid: !getDeleted` do `Usuario.findAll` da API. Esta é a
    // única condição sempre presente, então ela abre o `WHERE` — as demais só
    // acrescentam `AND`, senão o SQLite reclama de `AND` sem condição anterior.
    if get_deleted.unwrap_or(false) {
        qb.push(" WHERE 1 = 1 ");
    } else {
        qb.push(" WHERE usuarios.deletedAt IS NULL ");
    }

    if let Some(fltr) = filter {
        if let Some(local_id) = fltr.local_id {
            qb.push(" AND usuarios.lojaId = ").push_bind(local_id);
        }

        if let Some(ativo) = fltr.ativo {
            // `ativo` é INTEGER no SQLite; o `bind` já converte o bool.
            qb.push(" AND usuarios.ativo = ").push_bind(ativo);
        }
    }

    let users = qb
        .build_query_as::<SQLiteUsuarioListing>()
        .fetch_all(&db)
        .await;

    match users {
        // O erro do `TryFrom` (uma `funcao` fora do enum) é propagado sem
        // embrulhar, senão a mensagem real se perde.
        Ok(users) => users.into_iter().map(UsuarioListing::try_from).collect(),
        Err(err) => {
            eprintln!("{err}");
            Err(RustApiError::from_str("Erro ao listar usuarios."))
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;
    use crate::offline::database::off_audit_logs;

    /// Mesmo DDL de `apps/api/src/helpers/SqliteTablesStrings.ts`, com duas
    /// lojas e três usuários cobrindo: visível, soft-deleted, `ativo = 0`,
    /// loja soft-deleted e `lojaId` pendurado.
    async fn seed_pool() -> sqlx::SqlitePool {
        let pool = sqlx::SqlitePool::connect("sqlite::memory:")
            .await
            .expect("falha ao abrir o banco em memória");

        let schema = r#"
        CREATE TABLE lojas (
            id INTEGER NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            CNPJ TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            deletedAt TEXT DEFAULT NULL
        );
        CREATE TABLE usuarios (
            id INTEGER NOT NULL PRIMARY KEY,
            nome TEXT NOT NULL,
            funcao TEXT NOT NULL,
            usuario TEXT NOT NULL,
            senhaHash TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            lojaId INTEGER NOT NULL,
            ativo INTEGER NOT NULL DEFAULT 1,
            deletedAt TEXT DEFAULT NULL
        );
        "#;

        sqlx::raw_sql(schema)
            .execute(&pool)
            .await
            .expect("falha ao criar o schema");

        let lojas = [
            // id, nome, CNPJ, createdAt, updatedAt, deletedAt
            (1, "Timoteo", "12.345.678/0001-99", None),
            (2, "Coronel Fabriciano", "98.765.432/0001-11", None),
            (
                3,
                "Ipatinga",
                "11.222.333/0001-44",
                Some("2024-06-01T00:00:00.000Z"),
            ),
        ];

        for (id, nome, cnpj, deleted) in lojas {
            sqlx::query("INSERT INTO lojas (id,nome,CNPJ,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?,?)")
                .bind(id)
                .bind(nome)
                .bind(cnpj)
                .bind("2024-01-01T00:00:00.000Z")
                .bind("2024-01-01T00:00:00.000Z")
                .bind(deleted)
                .execute(&pool)
                .await
                .expect("falha ao inserir loja");
        }

        // id, nome, funcao, usuario, lojaId, ativo, deletedAt
        let usuarios = [
            (1, "Ana Souza", "admin", "ana", 1, 1, None),
            (2, "Bruno Lima", "gerente", "bruno", 2, 1, None),
            (3, "Carla Dias", "vendedor", "carla", 3, 1, None),
            (4, "Dan Alves", "vendedor", "dan", 1, 0, None),
            (
                5,
                "Eva Nunes",
                "vendedor",
                "eva",
                2,
                1,
                Some("2024-06-01T00:00:00.000Z"),
            ),
        ];

        for (id, nome, funcao, usuario, loja_id, ativo, deleted) in usuarios {
            sqlx::query("INSERT INTO usuarios (id,nome,funcao,usuario,senhaHash,createdAt,updatedAt,lojaId,ativo,deletedAt) VALUES (?,?,?,?,?,?,?,?,?,?)")
                .bind(id)
                .bind(nome)
                .bind(funcao)
                .bind(usuario)
                .bind("$2b$10$hashedplaceholderplaceholderplaceholderplace")
                .bind("2024-01-01T00:00:00.000Z")
                .bind("2024-01-01T00:00:00.000Z")
                .bind(loja_id)
                .bind(ativo)
                .bind(deleted)
                .execute(&pool)
                .await
                .expect("falha ao inserir usuario");
        }

        pool
    }

    /// Roda `USUARIOS_SELECT` + a cláusula de exclusão, sem depender de
    /// `tauri::State` (que não existe em teste).
    async fn listar(
        pool: &sqlx::SqlitePool,
        get_deleted: bool,
        filter: Option<UsuarioListFilter>,
    ) -> Vec<UsuarioListing> {
        let mut qb = QueryBuilder::<Sqlite>::new(USUARIOS_SELECT);

        if get_deleted {
            qb.push(" WHERE 1 = 1 ");
        } else {
            qb.push(" WHERE usuarios.deletedAt IS NULL ");
        }

        if let Some(fltr) = filter {
            if let Some(local_id) = fltr.local_id {
                qb.push(" AND usuarios.lojaId = ").push_bind(local_id);
            }
            if let Some(ativo) = fltr.ativo {
                qb.push(" AND usuarios.ativo = ").push_bind(ativo);
            }
        }

        qb.build_query_as::<SQLiteUsuarioListing>()
            .fetch_all(pool)
            .await
            .expect("falha ao listar usuarios")
            .into_iter()
            .map(|u| {
                u.try_into()
                    .expect("TryFrom<SQLiteUsuarioListing> deve funcionar")
            })
            .collect()
    }

    #[tokio::test]
    async fn usuario_traz_a_loja_como_objeto() {
        let pool = seed_pool().await;
        let usuarios = listar(&pool, false, None).await;

        let ana = usuarios.iter().find(|u| u.id == 1).unwrap();
        assert_eq!(ana.local.id, 1);
        assert_eq!(ana.local.nome, "Timoteo");
        assert_eq!(ana.local.cnpj, "12.345.678/0001-99");
        // `lojaId` achatado é coluna auxiliar: não pode vazar para o payload.
        assert!(
            serde_json::to_value(ana).unwrap().get("lojaId").is_none(),
            "`lojaId` é coluna do SQLite, não do payload"
        );
    }

    #[tokio::test]
    async fn loja_soft_deleted_ainda_e_resolvida() {
        let pool = seed_pool().await;
        let usuarios = listar(&pool, false, None).await;

        // A loja 3 está soft-deleted. O `include` da API roda com
        // `paranoid: false`, então o offline precisa devolver a loja cheia —
        // devolver `null` aqui faria o serde falhar em `local: Loja`.
        let carla = usuarios.iter().find(|u| u.id == 3).unwrap();
        assert_eq!(
            carla.local.id, 3,
            "loja soft-deleted continua sendo a loja do usuário"
        );
        assert_eq!(carla.local.nome, "Ipatinga");
    }

    #[tokio::test]
    async fn loja_id_pendurado_degrada_em_vez_de_erro() {
        let pool = seed_pool().await;

        sqlx::query("INSERT INTO usuarios (id,nome,funcao,usuario,senhaHash,createdAt,updatedAt,lojaId,ativo,deletedAt) VALUES (?,?,?,?,?,?,?,?,?,?)")
            .bind(99)
            .bind("Sem Loja")
            .bind("vendedor")
            .bind("semloja")
            .bind("$2b$10$hashedplaceholderplaceholderplaceholderplace")
            .bind("2024-01-01T00:00:00.000Z")
            .bind("2024-01-01T00:00:00.000Z")
            .bind(4242) // não existe em `lojas`
            .bind(1)
            .bind(None::<String>)
            .execute(&pool)
            .await
            .unwrap();

        let usuarios = listar(&pool, false, None).await;
        let orfao = usuarios
            .iter()
            .find(|u| u.id == 99)
            .expect("listagem falhou");

        assert_eq!(orfao.local.id, 0, "loja ausente vira o placeholder");
        assert_eq!(orfao.local.nome, "Loja desconhecida");
    }

    #[tokio::test]
    async fn listagem_bate_com_o_payload_da_api() {
        let pool = seed_pool().await;
        let usuarios = listar(&pool, false, None).await;
        let ana = usuarios.iter().find(|u| u.id == 1).unwrap();

        // `UsuarioListing` em `packages/types/database/Usuario.ts`.
        assert_eq!(
            serde_json::to_value(ana).unwrap(),
            json!({
                "id": 1,
                "nome": "Ana Souza",
                "funcao": "admin",
                "local": {
                    "id": 1,
                    "nome": "Timoteo",
                    "CNPJ": "12.345.678/0001-99",
                    "createdAt": "2024-01-01T00:00:00.000Z",
                    "updatedAt": "2024-01-01T00:00:00.000Z",
                },
                "usuario": "ana",
                "createdAt": "2024-01-01T00:00:00.000Z",
                "updatedAt": "2024-01-01T00:00:00.000Z",
            })
        );
    }

    #[tokio::test]
    async fn logged_user_serializa_com_local_aninhado() {
        let pool = seed_pool().await;
        let rows: Vec<SQLiteLoggedUser> =
            sqlx::query_as(&format!("{USUARIOS_SELECT}WHERE usuarios.id = 1"))
                .fetch_all(&pool)
                .await
                .unwrap();

        let user: LoggedUser = rows.into_iter().next().unwrap().try_into().unwrap();
        assert_eq!(user.local.nome, "Timoteo");
        assert_eq!(serde_json::to_value(&user).unwrap()["local"]["id"], 1);
    }

    #[tokio::test]
    async fn colunas_achatadas_nao_vazam_para_o_payload() {
        let pool = seed_pool().await;
        let rows: Vec<SQLiteUsuarioListing> =
            sqlx::query_as(&format!("{USUARIOS_SELECT}WHERE usuarios.id = 1"))
                .fetch_all(&pool)
                .await
                .unwrap();

        let payload = serde_json::to_value(&rows[0]).unwrap();
        for coluna in ["lojaId", "ativo", "localJson", "senhaHash"] {
            assert!(
                payload.get(coluna).is_none(),
                "`{coluna}` é coluna auxiliar do SQLite e não deve sair no payload"
            );
        }
    }

    #[tokio::test]
    async fn filtro_por_loja_id_e_por_ativo() {
        let pool = seed_pool().await;

        let por_loja = listar(
            &pool,
            false,
            Some(UsuarioListFilter {
                local_id: Some(1),
                ativo: None,
            }),
        )
        .await;
        assert_eq!(
            por_loja.iter().map(|u| u.id).collect::<Vec<_>>(),
            vec![1, 4],
            "loja 1: Ana (ativo) e Dan (inativo)"
        );

        let inativos = listar(
            &pool,
            false,
            Some(UsuarioListFilter {
                local_id: None,
                ativo: Some(false),
            }),
        )
        .await;
        assert_eq!(inativos.iter().map(|u| u.id).collect::<Vec<_>>(), vec![4]);

        let combinados = listar(
            &pool,
            false,
            Some(UsuarioListFilter {
                local_id: Some(1),
                ativo: Some(true),
            }),
        )
        .await;
        assert_eq!(combinados.iter().map(|u| u.id).collect::<Vec<_>>(), vec![1]);
    }

    #[tokio::test]
    async fn filtro_combinado_nao_gera_where_duplicado() {
        let pool = seed_pool().await;

        // Sem filtro nenhum: só a cláusula de `deletedAt`.
        let sem_filtro = listar(&pool, false, None).await;
        assert_eq!(sem_filtro.len(), 4);

        // Com os dois filtros + `deletedAt`: um `WHERE` só, senão o SQLite
        // reclamaria de `AND` sem condição anterior.
        let ambos = listar(
            &pool,
            false,
            Some(UsuarioListFilter {
                local_id: Some(2),
                ativo: Some(true),
            }),
        )
        .await;
        assert_eq!(ambos.iter().map(|u| u.id).collect::<Vec<_>>(), vec![2]);

        // `get_deleted = true` também precisa de um `WHERE` válido.
        let com_excluidos = listar(&pool, true, None).await;
        assert_eq!(com_excluidos.len(), 5);
    }

    #[tokio::test]
    async fn get_deleted_traz_os_excluidos() {
        let pool = seed_pool().await;

        let visiveis = listar(&pool, false, None).await;
        assert!(
            !visiveis.iter().any(|u| u.usuario == "eva"),
            "usuário soft-deleted fica de fora por padrão"
        );

        let todos = listar(&pool, true, None).await;
        let eva = todos
            .iter()
            .find(|u| u.usuario == "eva")
            .expect("Eva não veio");
        assert_eq!(eva.local.nome, "Coronel Fabriciano");
    }

    #[tokio::test]
    async fn funcao_invalida_vira_erro_em_vez_de_panic() {
        let pool = seed_pool().await;

        sqlx::query("INSERT INTO usuarios (id,nome,funcao,usuario,senhaHash,createdAt,updatedAt,lojaId,ativo,deletedAt) VALUES (?,?,?,?,?,?,?,?,?,?)")
            .bind(100)
            .bind("Função Ruim")
            .bind("gerente-chefe")
            .bind("funcaoruim")
            .bind("$2b$10$hashedplaceholderplaceholderplaceholderplace")
            .bind("2024-01-01T00:00:00.000Z")
            .bind("2024-01-01T00:00:00.000Z")
            .bind(1)
            .bind(1)
            .bind(None::<String>)
            .execute(&pool)
            .await
            .unwrap();

        let rows: Vec<SQLiteUsuarioListing> =
            sqlx::query_as(&format!("{USUARIOS_SELECT}WHERE usuarios.id = 100"))
                .fetch_all(&pool)
                .await
                .unwrap();

        let err = UsuarioListing::try_from(rows.into_iter().next().unwrap())
            .expect_err("função desconhecida no banco local deve virar erro, não panic");
        assert_eq!(err.code, 500);
    }

    #[tokio::test]
    async fn usuarios_select_e_reeutilizado_pelos_audit_logs() {
        let pool = seed_pool().await;

        // O mesmo seletor que `off_audit_logs::load_usuarios_por_id` usa.
        let usuarios: Vec<SQLiteLoggedUser> = sqlx::query_as(&format!(
            "{USUARIOS_SELECT}WHERE usuarios.deletedAt IS NULL"
        ))
        .fetch_all(&pool)
        .await
        .expect("a concatenação de `USUARIOS_SELECT` + `WHERE` deve ser SQL válido");

        let resolvidos: Vec<LoggedUser> = usuarios
            .into_iter()
            .filter_map(|u| LoggedUser::try_from(u).ok())
            .collect();

        assert_eq!(resolvidos.len(), 4, "o usuário soft-deleted é excluído");
        assert!(resolvidos.iter().all(|u| !u.local.nome.is_empty()));
        assert!(
            resolvidos
                .iter()
                .all(|u| u.local.nome != loja_desconhecida().nome),
            "nenhum usuário de teste deveria cair no placeholder"
        );

        // O módulo de audit logs realmente usa esse caminho.
        let por_id = off_audit_logs::usuarios_por_id(&pool)
            .await
            .expect("load de usuários para os audit logs");
        assert_eq!(por_id.len(), 4);
        assert_eq!(por_id.get(&1).unwrap().local.nome, "Timoteo");
    }
}
