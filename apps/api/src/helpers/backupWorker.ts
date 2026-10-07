import Database from "@signalapp/sqlcipher";
import { parentPort, workerData } from "worker_threads";
import sqliteCreateTable from "./SqliteTablesStrings";
export const safeValue = (val: any) => {
  if (val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object" && val !== null && !Buffer.isBuffer(val)) {
    return JSON.stringify(val);
  }
  return val;
};


function run() {
  const { tempFilePath, encKey, data } = workerData;

  const sqliteDb = new Database(tempFilePath);

  try {
    sqliteDb.pragma(`key = "${encKey}"`);
    sqliteDb.pragma("journal_mode = WAL");
    sqliteDb.pragma("synchronous = OFF");

    sqliteDb.exec(sqliteCreateTable.mercadoria.create);
    sqliteDb.exec(sqliteCreateTable.mercadoriaKey.create);
    sqliteDb.exec(sqliteCreateTable.atributos.create);
    sqliteDb.exec(sqliteCreateTable.mercadoriaAtributos.create);
    sqliteDb.exec(sqliteCreateTable.categoria.create);
    sqliteDb.exec(sqliteCreateTable.fabricante.create);
    sqliteDb.exec(sqliteCreateTable.grupos.create);
    sqliteDb.exec(sqliteCreateTable.lojas.create);
    sqliteDb.exec(sqliteCreateTable.estoques.create);
    sqliteDb.exec(sqliteCreateTable.usuarios.create);
    sqliteDb.exec(sqliteCreateTable.auditLogs.create);

    const insertMercadoria = sqliteDb.prepare(
      sqliteCreateTable.mercadoria.insert,
    );
    const insertMercadoriaKey = sqliteDb.prepare(
      sqliteCreateTable.mercadoriaKey.insert,
    );
    const insertAtributos = sqliteDb.prepare(
      sqliteCreateTable.atributos.insert,
    );
    const insertMercadoriaAtributos = sqliteDb.prepare(
      sqliteCreateTable.mercadoriaAtributos.insert,
    );
    const insertCategorias = sqliteDb.prepare(
      sqliteCreateTable.categoria.insert,
    );
    const insertFabricantes = sqliteDb.prepare(
      sqliteCreateTable.fabricante.insert,
    );
    const insertGrupos = sqliteDb.prepare(sqliteCreateTable.grupos.insert);
    const insertLojas = sqliteDb.prepare(sqliteCreateTable.lojas.insert);
    const insertEstoques = sqliteDb.prepare(sqliteCreateTable.estoques.insert);
    const insertUsuarios = sqliteDb.prepare(sqliteCreateTable.usuarios.insert);
    const insertAuditLogs = sqliteDb.prepare(sqliteCreateTable.auditLogs.insert);

    const insertAll = sqliteDb.transaction(() => {
      for (const m of data.mercadorias) {
        insertMercadoria.run([
          safeValue(m.id),
          safeValue(m.key),
          safeValue(m.descricao),
          safeValue(m.precoCusto),
          safeValue(m.precoVenda),
          safeValue(m.observacoes),
          safeValue(m.fabricanteId),
          safeValue(m.categoriaId),
          safeValue(m.createdAt),
          safeValue(m.updatedAt),
          safeValue(m.deletedAt),
        ]);
      }
      for (const key of data.mercadoriaKeys)
        insertMercadoriaKey.run([safeValue(key.key)]);
      for (const a of data.atributos) {
        insertAtributos.run([
          safeValue(a.id),
          safeValue(a.nome),
          safeValue(a.tipo),
          safeValue(a.createdAt),
          safeValue(a.updatedAt),
          safeValue(a.deletedAt),
        ]);
      }
      for (const c of data.mercadoriasAtributos) {
        insertMercadoriaAtributos.run([
          safeValue(c.valor),
          safeValue(c.mercadoriaId),
          safeValue(c.atributoId),
        ]);
      }
      for (const categoria of data.categorias) {
        insertCategorias.run([
          safeValue(categoria.id),
          safeValue(categoria.nome),
          safeValue(categoria.grupoId),
          safeValue(categoria.createdAt),
          safeValue(categoria.updatedAt),
          safeValue(categoria.deletedAt),
        ]);
      }
      for (const al of data.auditLogs) {
        insertAuditLogs.run([
          safeValue(al.id),
          safeValue(al.alvoTipo),
          safeValue(al.alvoId),
          safeValue(al.acao),
          safeValue(al.nivel),
          safeValue(al.dados),
          safeValue(al.data),
          safeValue(al.ip),
          safeValue(al.usuarioId),
        ]);
      }
      for (const fabricante of data.fabricantes) {
        insertFabricantes.run([
          safeValue(fabricante.id),
          safeValue(fabricante.nome),
          safeValue(fabricante.createdAt),
          safeValue(fabricante.updatedAt),
          safeValue(fabricante.deletedAt),
        ]);
      }
      for (const grupo of data.grupos) {
        insertGrupos.run([
          safeValue(grupo.id),
          safeValue(grupo.nome),
          safeValue(grupo.createdAt),
          safeValue(grupo.updatedAt),
          safeValue(grupo.deletedAt),
        ]);
      }
      for (const loja of data.lojas) {
        insertLojas.run([
          safeValue(loja.id),
          safeValue(loja.nome),
          safeValue(loja.CNPJ),
          safeValue(loja.createdAt),
          safeValue(loja.updatedAt),
          safeValue(loja.deletedAt),
        ]);
      }
      for (const estoque of data.estoques) {
        insertEstoques.run([
          safeValue(estoque.id),
          safeValue(estoque.mercadoriaId),
          safeValue(estoque.lojaId),
          safeValue(estoque.estoque),
          safeValue(estoque.createdAt),
          safeValue(estoque.updatedAt),
          safeValue(estoque.deletedAt),
        ]);
      }
      // `usuarios` referencia `lojas` via `lojaId`, então precisa ser inserido
      // depois dela para respeitar a chave estrangeira.
      for (const usuario of data.usuarios) {
        insertUsuarios.run([
          safeValue(usuario.id),
          safeValue(usuario.nome),
          safeValue(usuario.funcao),
          safeValue(usuario.usuario),
          safeValue(usuario.senhaHash),
          safeValue(usuario.createdAt),
          safeValue(usuario.updatedAt),
          safeValue(usuario.lojaId),
          // `ativo` é BOOLEAN no MySQL; o SQLite guarda como INTEGER (0/1).
          safeValue(usuario.ativo === undefined ? 1 : usuario.ativo ? 1 : 0),
          safeValue(usuario.deletedAt),
        ]);
      }
    });
    insertAll();

    [
      insertMercadoria,
      insertMercadoriaKey,
      insertAtributos,
      insertMercadoriaAtributos,
      insertCategorias,
      insertFabricantes,
      insertGrupos,
      insertLojas,
      insertEstoques,
      insertAuditLogs,
      insertUsuarios,
    ].forEach((s) => s.close());

    parentPort?.postMessage({ ok: true });
  } catch (err: any) {
    parentPort?.postMessage({ ok: false, error: err?.message ?? String(err) });
  }finally{
    sqliteDb.close();
  }
}

run();