import { NextFunction, Request, Response } from "express";
import { Mercadoria } from "../models/models";
import {
  ApiListResponse,
  ApiResponse,
  AuditData,
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  BaseQuery,
  Caracteristica,
  CaracteristicaCreate,
  IMercadoria,
  IUsuario,
  logCreate,
  MercadoriaAtributos,
  MercadoriaCreate,
  MercadoriaDB,
  MercadoriaLog,
  MercadoriaUpdate,
} from "@tauri-inventory/types";
import {
  CreationAttributes,
  Includeable,
  Op,
  Order,
  QueryTypes,
  Transaction,
} from "sequelize";
import {
  buildWhereClause,
  getAdditionalFilters,
} from "../config/utils/whereBuilder";
import { getAllowedFields } from "../config/utils/allowedFields";
import { setTimeout } from "timers/promises";
import sequelize from "../config/db";
import MercadoriaPhotosModel from "../models/MercadoriaPhotos";
import MercadoriaModel from "../models/Mercadoria";
import MercadoriaAtributosModel from "../models/MercadoriaAtributos";
import EstoqueModel from "../models/Estoque";
import LojasModel from "../models/Lojas";
import AtributoModel from "../models/Atributo";
import AuditLog, { AuditCreate, getAuditChanges } from "../models/AuditLogs";
import { MercadoriaKey } from "../models/MercadoriaKeys";

function caracteristicasParser(
  mercadoria: MercadoriaCreate | MercadoriaUpdate,
  mercId?: number,
) {
  if (!mercadoria.caracteristicas) {
    return [];
  }

  const caracteristicasTratadas: MercadoriaAtributos[] =
    mercadoria.caracteristicas.map((carac) => {
      // const value =
      //   typeof carac.value === "string"
      //     ? carac.value.toLowerCase()
      //     : carac.value;
      return {
        mercadoriaId: String(mercId || mercadoria.id),
        atributoId: carac.key,
        valor: carac.value,
      };
    });
  return caracteristicasTratadas as unknown as CreationAttributes<MercadoriaAtributosModel>[];
}

/**
 * Normaliza o estoque recebido para gravação em `Estoque`.
 *
 * Devolve `null` quando o campo não veio no payload — o que significa "não
 * mexer no estoque", diferente de uma lista vazia, que significa "zerar tudo".
 * `lojaId` ausente ou não numérico é descartado, porque viraria FK inválida.
 */
function estoqueParser(estoque: unknown) {
  if (!Array.isArray(estoque)) return null;

  const tratado = estoque
    .filter(
      (item): item is { lojaId: unknown; estoque: unknown } =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      lojaId: Number(item.lojaId),
      estoque: Number(item.estoque),
    }))
    // `Number("abc")` é NaN, e FK NaN reprova; id de loja precisa ser inteiro.
    .filter(
      (item) => Number.isInteger(item.lojaId) && item.lojaId > 0,
    )
    .map((item) => ({
      lojaId: item.lojaId,
      estoque: Number.isFinite(item.estoque) ? item.estoque : 0,
    }));

  return tratado;
}

/**
 * Grava o estoque da mercadoria em `Estoque`, uma linha por loja.
 *
 * `Estoque` é `paranoid`, então as linhas existentes são restauradas e
 * atualizadas em vez de recriadas — preservando o `id` e o `createdAt` que o
 * log de auditoria registra.
 *
 * @param lojasGerenciadas Quando informada, só essas lojas podem ser
 *   removidas. O payload chega restrito à loja do usuário (o formulário só
 *   envia os campos habilitado para ele), então sem esse recorte um gerente
 *   salvaria apagando o estoque das outras lojas. `undefined` = admin, que
 *   enxerga o formulário inteiro e pode zerar qualquer loja.
 */
async function syncEstoque(
  mercadoriaId: number,
  estoque: { lojaId: number; estoque: number }[],
  transaction: Transaction,
  lojasGerenciadas?: number[],
) {
  // Estoque repetido na mesma loja: o último enviado prevalece.
  const porLoja = new Map<number, number>();
  for (const item of estoque) porLoja.set(item.lojaId, item.estoque);

  const lojaIds = new Set(porLoja.keys());

  // Sem `raw: true`: o soft-delete/restore e o update abaixo são métodos de
  // instância do model. Com `raw`, o Sequelize devolve objeto cru e
  // `linha.destroy`/`existente.update`/`existente.restore` nem existem.
  const existentes = await EstoqueModel.findAll({
    where: { mercadoriaId },
    paranoid: false,
    transaction,
  });

  const porLojaExistente = new Map<number, EstoqueModel>();
  for (const linha of existentes) {
    porLojaExistente.set(linha.lojaId, linha);
  }

  // Lojas que saíram do payload são removidas (soft-delete), para que não
  // sobrem linhas obsoletas contando no filtro e no `getEstoqueTotal`.
  const gerenciadas = lojasGerenciadas ? new Set(lojasGerenciadas) : null;
  const removidas = existentes.filter(
    (linha) =>
      !lojaIds.has(linha.lojaId) &&
      (!gerenciadas || gerenciadas.has(linha.lojaId)),
  );

  for (const linha of removidas) {
    if (linha.deletedAt) continue;
    await linha.destroy({ transaction });
  }

  // Fora do alcance do usuário não pode ser criado, só atualizado — o recorte
  // do payload já devolve só a loja dele, mas um POST forjado passaria por
  // `estoqueParser`.
  const dentroDoEscopo = (lojaId: number) =>
    !gerenciadas || gerenciadas.has(lojaId);

  for (const [lojaId, quantidade] of porLoja) {
    if (!dentroDoEscopo(lojaId)) continue;

    const existente = porLojaExistente.get(lojaId);

    if (existente) {
      // `restore` antes do `update`: `Estoque` é `paranoid`, e o UPDATE de um
      // model paranoid só casa em linha sem `deletedAt` — na ordem inversa o
      // update não encontra a linha e o estoque fica gravado como removido.
      if (existente.deletedAt) {
        await existente.restore({ transaction });
      }
      await existente.update({ estoque: quantidade }, { transaction });
      continue;
    }

    await EstoqueModel.create(
      { mercadoriaId, lojaId, estoque: quantidade },
      { transaction },
    );
  }
}

/**
 * Compara o estoque anterior de uma mercadoria com o novo, loja a loja.
 *
 * Devolve `null` quando nada mudou, para não poluir o log. O formato é o mesmo
 * que o log já usa para `caracteristicas` (`{ nome, valor }`), então a tela de
 * auditoria renderiza "Timoteo: 5 → 7" sem nenhuma mudança nela.
 *
 * @param anteriores Linhas de `Estoque` da mercadoria, como vêm do include.
 * @param novos Payload normalizado por `estoqueParser`.
 */
async function diffEstoque(
  anteriores: { lojaId: number; estoque: number }[],
  novos: { lojaId: number; estoque: number }[],
  transaction: Transaction,
) {
  const antigoPorLoja = new Map<number, number>();
  for (const linha of anteriores) {
    antigoPorLoja.set(linha.lojaId, Number(linha.estoque));
  }

  const novoPorLoja = new Map<number, number>();
  for (const item of novos) novoPorLoja.set(item.lojaId, item.estoque);

  // Só as lojas que realmente mudaram entram no log — inclusive as que
  // desapareceram do payload, que `syncEstoque` remove.
  const lojasAfetadas = new Set(
    [...antigoPorLoja.keys(), ...novoPorLoja.keys()].filter((lojaId) => {
      const antes = antigoPorLoja.get(lojaId);
      const depois = novoPorLoja.get(lojaId);

      if (depois === undefined) return true; // loja removida do payload
      if (antes === undefined) return depois !== 0; // loja nova, só se tem algo
      return antes !== depois;
    }),
  );

  if (lojasAfetadas.size === 0) return null;

  // O nome vem do include quando a loja já tinha estoque; para loja nova é
  // preciso buscar, senão a linha sairia como "Loja 4".
  const nomePorLoja = new Map<number, string>();
  for (const linha of anteriores as unknown as {
    lojaId: number;
    loja?: { nome: string };
  }[]) {
    if (linha.loja?.nome) nomePorLoja.set(linha.lojaId, linha.loja.nome);
  }

  const faltando = [...lojasAfetadas].filter((lojaId) => !nomePorLoja.has(lojaId));
  if (faltando.length > 0) {
    const lojas = await LojasModel.findAll({
      where: { id: faltando },
      attributes: ["id", "nome"],
      transaction,
      raw: true,
    });

    for (const loja of lojas) nomePorLoja.set(loja.id, loja.nome);
  }

  const linha = (lojaId: number, valor: number) => ({
    nome: nomePorLoja.get(lojaId) ?? `Loja ${lojaId}`,
    valor,
  });

  return {
    anterior: [...lojasAfetadas]
      .filter((lojaId) => antigoPorLoja.has(lojaId))
      .map((lojaId) => linha(lojaId, antigoPorLoja.get(lojaId)!)),
    novo: [...lojasAfetadas]
      .filter((lojaId) => novoPorLoja.has(lojaId))
      .map((lojaId) => linha(lojaId, novoPorLoja.get(lojaId)!)),
  };
}

function sequelizeResponseParser(mercadoria: Mercadoria) {
  const merc = mercadoria.get({ plain: true });

  // Se a mercadoria tiver atributos, iteramos sobre eles
  if (merc.caracteristicas && Array.isArray(merc.caracteristicas)) {
    merc.caracteristicas = merc.caracteristicas.map((attr: any) => {
      // Extraímos o objeto MercadoriaAtributosModel e o restante das propriedades (id, nome, tipo)
      const { MercadoriaAtributosModel, ...restoAtributo } = attr;

      return {
        ...restoAtributo,
        // Subimos o valor para o nível principal do atributo
        valor: MercadoriaAtributosModel?.valor,
      };
    });
  }
  return merc;
}

/**
 * Include do estoque por loja usado em todas as projeções que expõem
 * `mercadoria.estoque`.
 *
 * Sem restringir `attributes`, o Sequelize devolve a linha de `Estoque`
 * inteira (`id`, `lojaId`, `estoque`, `createdAt`, `updatedAt`) e a `Lojas`
 * inteira (`id`, `nome`, `CNPJ`, `createdAt`, `updatedAt`).
 *
 * Isso não é opcional: o app POS deserializa a resposta em structs Rust com
 * campos obrigatórios — `Estoque` (`apps/pos/src-tauri/src/database/estoque.rs`)
 * e `Loja` (`.../loja.rs`) — e o modo offline monta exatamente esse mesmo
 * formato via `json_object` em `off_mercadorias.rs`. Uma projeção mais estreita
 * (ex.: `attributes: ["estoque"]`) omite `createdAt`/`updatedAt` e o serde falha
 * com "error decoding response body", quebrando online o que funciona offline.
 */
const estoqueInclude: Includeable = {
  association: "estoque",
  include: [{ association: "loja" }],
};

// POST mercadorias/
export const criarMercadoria = async (
  req: Request<{}, {}, MercadoriaCreate>,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const user = req.user;

    if (!user) {
      return;
    }
    let mercadoria = req.body;

    if (!mercadoria.key) {
      const maxKey = await MercadoriaKey.create({}, { transaction: t });

      mercadoria.key = maxKey.key;
    }

    // `Estoque` é gravado logo após o create, já que a mercadoria precisa do id
    // para ser a FK. Tira do payload para o insert não tentar uma coluna que
    // `mercadorias` não tem mais.
    const estoque = estoqueParser(mercadoria.estoque);
    delete mercadoria.estoque;

    const merc = await Mercadoria.create(
      mercadoria as unknown as CreationAttributes<MercadoriaModel>,
      { transaction: t },
    );

    const caracteristicas = caracteristicasParser(mercadoria, merc.id);
    delete mercadoria.caracteristicas;

    if (estoque && estoque.length > 0) {
      await syncEstoque(merc.id, estoque, t);
    }

    // console.log(caracteristicas);
    // console.log(merc.get({ plain: true }));

    if (caracteristicas && caracteristicas.length > 0) {
      await MercadoriaAtributosModel.bulkCreate(caracteristicas, {
        transaction: t,
      });
    }

    const logData: AuditData<MercadoriaLog> = {
      criacao: merc.get({ plain: true }),
    };

    const log: Omit<AuditCreate, "id"> = {
      acao: AuditLogAction.CREATE,
      alvoTipo: AuditLogTargetType.MERCADORIA,
      alvoId: merc.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: logData,
      nivel: AuditLogLevel.NORMAL,
    };

    await AuditLog.create(log, {
      transaction: t,
    });

    await t.commit();
    res.status(201).json(sequelizeResponseParser(merc));
  } catch (e) {
    await t.rollback();
    console.error("Failed to create merc: ", e);
    res.status(500).json({ response: "Failed to create mercadoria" });
  }
};

// GET mercadorias/
export const listarMercadorias = async (
  req: Request<{}, {}, BaseQuery<IMercadoria>>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.body;

    // await setTimeout(3000, "ok");

    // No request body, returns unfiltered limited results
    if (!query) {
      const { rows, count } = await Mercadoria.findAndCountAll({
        limit: 50,
        distinct: true,
        include: [
          { association: "fabricante" },
          {
            association: "categoria",
            include: ["grupo"],
            attributes: { exclude: ["grupoId"] },
          },
          estoqueInclude,
        ],
        attributes: { exclude: ["grupoId", "categoriaId", "fabricanteId"] },
      });
      return res.status(200).json({
        data: rows.map((r) =>
          // r.get({ plain: true }),
          sequelizeResponseParser(r),
        ),
        count: count,
      });
    }

    const where: any = await buildWhereClause(query);

    let grupoIdFilter: number | undefined;
    if (where.grupoId !== undefined) {
      grupoIdFilter = where.grupoId;
      delete where.grupoId;
    }

    console.log(where);

    const { limit, offset, order, include } = getAdditionalFilters(query);

    const { rows, count } = await Mercadoria.findAndCountAll({
      where,
      limit,
      offset,
      order: order as Order,
      distinct: true,
      include: include
        ? undefined
        : [
            { association: "fabricante" },
            {
              association: "categoria" as const,
              include: ["grupo"],
              ...(grupoIdFilter !== undefined && {
                where: { grupoId: grupoIdFilter },
                required: true,
              }),
            },
            {
              association: "caracteristicas",
              attributes: ["id", "nome", "tipo"],
              through: { attributes: ["valor"] },
            },
            estoqueInclude,
          ],
      attributes: include
        ? include
        : { exclude: ["grupoId", "categoriaId", "fabricanteId"] },
    });
    const mercadorias = rows.map((r) =>
      sequelizeResponseParser(r),
    );
    res.status(200).json({
      data: mercadorias,
      count: count,
    });
  } catch (e) {
    console.error("Failed to list mercadorias: ", e);
    res.status(500).json({ response: "Failed to list mercadorias" });
  }
};

export const relatorioMercadorias = async (
  req: Request<{}, {}, BaseQuery<IMercadoria>>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = req.body;

    // O estoque por loja vem da associação `Estoque`; antes ele eram as colunas
    // `estoque02/03/04` de `mercadorias`, que deixaram de existir.
    const relatorioInclude: Includeable[] = [
      { association: "fabricante", attributes: ["id", "nome"] },
      {
        association: "caracteristicas",
        attributes: ["id", "nome", "tipo"],
        through: { attributes: ["valor"] },
      },
      estoqueInclude,
    ];

    const relatorioAttributes = ["id", "descricao", "precoCusto", "precoVenda"];

    if (!query) {
      const { rows, count } = await MercadoriaModel.findAndCountAll({
        distinct: true,
        attributes: relatorioAttributes,
        include: relatorioInclude,

        order: [["descricao", "ASC"]],
      });

      return res.status(200).json({
        data: rows.map((r) =>
          r.get({ plain: true }),
        ) as unknown as IMercadoria[],
        count,
      });
    }

    const where = await buildWhereClause(query);

    const { rows, count } = await MercadoriaModel.findAndCountAll({
      distinct: true,
      attributes: relatorioAttributes,
      include: relatorioInclude,
      order: [["descricao", "ASC"]],
      where,
    });

    res.status(200).json({
      data: rows.map((r) => r.get({ plain: true })) as unknown as IMercadoria[],
      count,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno do servidor" });
  }
};

// GET mercadorias/:id
export const obterMercadoria = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const getDeleted = req.query.all?.toString().toLowerCase() === "true";
    const id = req.params.id;
    const mercadoria = await Mercadoria.findByPk(id, {
      include: [
        "fabricante",
        {
          association: "categoria",
          include: ["grupo"],
          attributes: { exclude: ["grupoId"] },
        },
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
        estoqueInclude,
      ],
      attributes: { exclude: ["grupoId", "categoriaId", "fabricanteId"] },
      nest: true,
      paranoid: !getDeleted,
    });

    if (!mercadoria) {
      return res.status(404).json({ response: "Mercadoria not found" });
    }
    const merc = sequelizeResponseParser(mercadoria);
    res.status(200).json(merc);
  } catch (e) {
    console.error("Failed to get mercadoria: ", e);
    res.status(500).json({ response: "Failed to get mercadoria" });
  }
};

// PUT /mercadorias/:id
export const alterarMercadoria = async (
  req: Request<{ id: string }, {}, MercadoriaUpdate>,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ response: "Id da mercadoria inválido!" });
    }

    let mercadoria = req.body;
    const caracteristicas = caracteristicasParser(mercadoria, id);

    // O estoque vem como lista `[{ lojaId, estoque }]`, mas `Mercadoria` não tem
    // essa coluna — é gravado em `Estoque` logo abaixo. Tira do payload para o
    // `update` não tentar escrever uma coluna inexistente.
    const estoque = estoqueParser(mercadoria.estoque);
    delete mercadoria.estoque;

    // Negative merc Key, assigns new
    if (mercadoria.key === -1) {
      const maxKey: number = await Mercadoria.max("key");

      mercadoria.key = maxKey ? maxKey + 1 : 1;
    }

    const user = req.user;
    if (!user)
      return res.status(403).json({ response: "Usuario nao autenticado" });

    let updateFields: string[] | undefined = undefined;

    // O recorte do estoque depende da loja do usuário. Token emitido antes de
    // `local` virar objeto traz a string antiga ("02") e não tem id — sem isso
    // um gerente ficaria sem poder nenhum em vez de receber um erro claro.
    let lojasGerenciadas: number[] | undefined = undefined;

    if (user.funcao !== "admin") {
      if (!Number.isInteger(user.local?.id)) {
        return res
          .status(403)
          .json({ response: "Usuario sem loja definida. Faça login novamente." });
      }

      lojasGerenciadas = [user.local.id];

      const allowedFields = getAllowedFields(user);
      // Mantém apenas os campos que a) são permitidos e b) foram enviados (não são undefined).
      // `estoque` fica de fora de propósito: quem não é admin só escreve na
      // própria loja, e isso é aplicado por `syncEstoque` via `lojasGerenciadas`.
      updateFields = allowedFields.filter(
        (field) => mercadoria[field as keyof MercadoriaUpdate] !== undefined,
      );
    }

    const oldMercadoria = await Mercadoria.findByPk(id, {
      transaction: t,
      include: [
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
        {
          association: "estoque",
          attributes: ["lojaId", "estoque"],
          include: [{ association: "loja", attributes: ["nome"] }],
        },
      ],
    });

    if (!oldMercadoria) {
      return res
        .status(404)
        .json({ response: "Mercadoria to be updated not found" });
    }
    const parsedOldMerc = sequelizeResponseParser(oldMercadoria);


    const alteracoes = getAuditChanges<MercadoriaLog>(
      parsedOldMerc,
      mercadoria as any,
    );

    // O estoque foi removido do corpo, então o diff genérico não o enxerga — e
    // mesmo se enxergasse, compararia listas de formatos diferentes. Ele é
    // comparado por loja, no formato `nome: valor` que o log já sabe renderizar.
    if (estoque) {
      const alteracoesEstoque = await diffEstoque(
        (oldMercadoria.estoque ?? []) as unknown as {
          lojaId: number;
          estoque: number;
        }[],
        estoque,
        t,
      );

      if (alteracoesEstoque) {
        alteracoes.estoque = alteracoesEstoque as never;
      }
    }

    console.log(alteracoes);

    const logData: AuditData<MercadoriaLog> = {
      alteracoes,
    };

    const log: AuditCreate = {
      acao: AuditLogAction.UPDATE,
      alvoTipo: AuditLogTargetType.MERCADORIA,
      alvoId: oldMercadoria.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: logData,
      nivel: AuditLogLevel.NORMAL,
    };
    AuditLog.create(log, { transaction: t });

    await MercadoriaAtributosModel.destroy({
      where: { mercadoriaId: id },
      transaction: t,
    });

    delete mercadoria.caracteristicas;
    await oldMercadoria.update(mercadoria, {
      transaction: t,
      fields: updateFields,
    });
    if (caracteristicas && caracteristicas.length > 0) {
      await MercadoriaAtributosModel.bulkCreate(caracteristicas, {
        transaction: t,
      });
    }

    // `estoque` só é aplicado quando veio no corpo: um PUT sem estoque não deve
    // apagar o que já está em `Estoque`. Quem não é admin só pode mexer na
    // própria loja, então o resto do estoque fica fora do alcance.
    console.log({ id, estoque, lojasGerenciadas });
    if (estoque) {
      await syncEstoque(id, estoque, t, lojasGerenciadas);
    }

    await t.commit();
    return res.status(200).json({ response: `Mercadoria ${id} atualizada` });
  } catch (e) {
    await t.rollback();
    console.error("Failed to update mercadoria: ", e);
    res.status(500).json({ response: "Failed to update mercadoria" });
  }
};

// SIMILAR MERCS

export const getAllSimilarMercs = async (
  req: Request<{ key: string }>,
  res: Response<IMercadoria[] | ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { key } = req.params;
    const rows = await Mercadoria.findAll({
      where: { key: key },
      attributes: ["id", "key", "descricao", "precoVenda"],
      include: [
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
        estoqueInclude,
      ],
    });

    const mercs = rows.map((merc) => sequelizeResponseParser(merc));
    res.status(200).json(mercs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno no servidor." });
  }
};

// export const updateAllSimilarMercs = async (
//   req: Request<{ key: string }, {}, SimilarMercCreate>,
//   res: Response<ApiResponse>,
//   next: NextFunction,
// ) => {
//   try {
//     const key = req.params.key;
//     const mercadoria = req.body;

//     if (!mercadoria) {
//       return res
//         .status(400)
//         .json({ response: "Dados novos inválidos ou nao presentes" });
//     }
//     if (!key) {
//       return res.status(400).json({ response: "Key invalida ou nao presente" });
//     }

//     let fields: string[] = ["precoVenda", "precoCusto"];

//     if (mercadoria.caracteristicas) {
//       fields.push("caracteristicas");
//     }

//     const affectedRows = await Mercadoria.update(mercadoria, {
//       where: {
//         key: key,
//       },
//       fields: fields,
//     });

//     return res
//       .status(200)
//       .json({ response: `Atualizado ${affectedRows} mercadorias` });
//   } catch (e) {
//     console.error("Erro ao atualizar similar mercs", e);
//     res.status(500).json({ response: "Falha ao atualizar similarMercs." });
//   }
// };

interface UpdateSmercByIdPayload {
  precoCusto: string;
  precoVenda: string;
  key: string;
  selectedIds: string[];
}

export const updateSimilarMercsByIdList = async (
  req: Request<
    { key: string },
    {},
    { mercadoria: Partial<MercadoriaDB>; selectedIds: string[] }
  >,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const key = req.params.key;
    const mercadoria = req.body.mercadoria;
    const selectedIds = req.body.selectedIds;

    const user = req.user;

    if (!user) {
      return res.status(403).json({ response: "Usuario nao autenticado" });
    }

    if (!mercadoria) {
      return res
        .status(400)
        .json({ response: "Dados novos inválidos ou nao presentes" });
    }
    if (!key) {
      return res.status(400).json({ response: "Key invalida ou nao presente" });
    }

    let fields: string[] = [];

    if (mercadoria.precoVenda !== undefined && mercadoria.precoVenda !== null) {
      fields.push("precoVenda");
    }
    if (mercadoria.precoCusto !== undefined && mercadoria.precoCusto !== null) {
      fields.push("precoCusto");
    }

    if (mercadoria.caracteristicas) {
      fields.push("caracteristicas");
    }

    const oldMercadorias = await Mercadoria.findAll({
      where: { id: { [Op.in]: selectedIds } },
    });

    console.log(mercadoria);

    // console.log("OLD MERCADORIAS---------------", oldMercadorias);
    const [affectedRows] = await Mercadoria.update(mercadoria, {
      where: {
        key: key,
        id: { [Op.in]: selectedIds },
      },
      fields: fields,
      transaction: t,
    });

    let logs: AuditCreate[] = [];
    // for (const oldMerc in oldMercadorias) {
    // const Mercadoria.findByPk(id)
    oldMercadorias.forEach((oldMerc) => {
      const changes = getAuditChanges(
        oldMerc,
        mercadoria as Partial<Mercadoria>,
      );

      if (Object.keys(changes).length > 0) {
        const log: Omit<AuditCreate, "id"> = {
          acao: AuditLogAction.UPDATE,
          alvoTipo: AuditLogTargetType.MERCADORIA,
          alvoId: oldMerc.id,
          usuarioId: user.id,
          data: new Date(),
          ip: req.ip ?? null,
          dados: { alteracoes: changes },
          nivel: AuditLogLevel.NORMAL,
        };
        // console.log(log);
        logs.push(log);
      }
    });
    console.log("Logs: --------- ", logs);
    await AuditLog.bulkCreate(logs, { transaction: t });

    t.commit();
    return res
      .status(200)
      .json({ response: `Atualizado ${affectedRows} mercadorias` });
  } catch (e) {
    t.rollback();
    console.error("Erro ao atualizar similar mercs", e);
    res.status(500).json({ response: "Falha ao atualizar similarMercs." });
  }
};

// DELETE mercadorias/
export const deletarMercadoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id || req.body.id;
    const mercadoria = await Mercadoria.findByPk(id);
    const user = req.user as IUsuario;

    console.log(mercadoria);

    if (!mercadoria) {
      return res
        .status(400)
        .json({ response: "Mercadoria para ser deletada nao encontrada" });
    }

    const log: AuditCreate = {
      acao: AuditLogAction.DELETE,
      alvoTipo: AuditLogTargetType.MERCADORIA,
      alvoId: mercadoria.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: null,
      nivel: AuditLogLevel.NORMAL,
    };

    await AuditLog.create(log, { transaction: t });

    await mercadoria.destroy({ transaction: t });

    await t.commit();

    return res.status(200).json({ response: `Mercadoria ${id} deleted` });
  } catch (e) {
    await t.rollback();
    console.error("Failed to delete mercadoria: ", e);
    res.status(500).json({ response: "Failed to delete mercadoria" });
  }
};

export const listarMercadoriaKey = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q } = req.query;
    const hasQuery = q !== undefined && q !== "";

    const examples = await sequelize.query(
      `
    SELECT
      m.id,
      m.\`key\`,
      m.descricao
    FROM mercadorias AS m
    INNER JOIN (
      SELECT \`key\`, MIN(id) AS id
      FROM mercadorias
      ${hasQuery ? "WHERE descricao LIKE :query" : ""}
      GROUP BY \`key\`
    ) AS examples
      ON examples.\`key\` = m.\`key\`
      AND examples.id = m.id
    ORDER BY m.\`key\`
    LIMIT 50
  `,
      {
        replacements: hasQuery ? { query: `%${q}%` } : {},
        type: QueryTypes.SELECT,
      },
    );
    return res.status(200).json(examples);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Failed to list MercadoriaKey listing" });
  }
};

// GET mercadorias/simple?q=""
export const listarMercadoriasSimple = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { q } = req.query;
    const validQ = q !== undefined && q !== "";
    let where;

    if (validQ) {
      where = { descricao: { [Op.like]: `%${q}%` } };
    } else {
      where = {};
    }

    const mercs = await Mercadoria.findAll({
      where,
      attributes: ["id", "descricao"],
      include: [
        {
          association: "caracteristicas",
          attributes: ["nome"],
          through: { attributes: ["valor"] },
        },
      ],
      limit: 100,
    });

    // Color too expensive

    // const parsedMerc = mercs.map((merc) => {
    //   const parsed = sequelizeResponseParser(merc);
    //   return {
    //     id: parsed.id,
    //     descricao: `${parsed.descricao} ${parsed.caracteristicas.find((c) => c.nome === "cor")?.valor || ""}`,
    //   };
    // });
    // res.status(200).json(parsedMerc);

    res.status(200).json(mercs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
};

// GET mercadorias/simple/log?q=""
export const listarMercadoriasSimpleLog = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("LOG QUERY========");

    const { q } = req.query;
    const validQ = q !== undefined && q !== "";
    let where;

    if (validQ) {
      where = { descricao: { [Op.like]: `%${q}%` } };
    } else {
      where = {};
    }

    const mercs = await Mercadoria.findAll({
      where,
      attributes: ["id", "descricao"],
      include: [
        {
          association: "caracteristicas",
          attributes: ["nome"],
          through: { attributes: ["valor"] },
        },
      ],
      paranoid: false,
      limit: 100,
    });

    res.status(200).json(mercs);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
};
