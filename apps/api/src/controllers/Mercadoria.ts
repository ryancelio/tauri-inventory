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
import { CreationAttributes, Op, Order, QueryTypes } from "sequelize";
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

// function mercIntoLog(mercadoria: Mercadoria): MercadoriaLog{
//   return{
//     ...mercadoria
//   }
// }

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

    const merc = await Mercadoria.create(
      mercadoria as unknown as CreationAttributes<MercadoriaModel>,
      { transaction: t },
    );

    const caracteristicas = caracteristicasParser(mercadoria, merc.id);
    delete mercadoria.caracteristicas;

    // console.log(caracteristicas);
    // console.log(merc.get({ plain: true }));

    if (caracteristicas && caracteristicas.length > 0) {
      await MercadoriaAtributosModel.bulkCreate(caracteristicas, {
        transaction: t,
      });
    }

    const logData: AuditData<MercadoriaLog> = {
      criacao: merc.get({plain: true}),
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
          {
            association: "caracteristicas",
            attributes: ["id", "nome", "tipo"],
            through: { attributes: ["valor"] },
          },
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
          ],
      attributes: include
        ? include
        : { exclude: ["grupoId", "categoriaId", "fabricanteId"] },
    });
    res.status(200).json({
      data: rows.map((r) =>
        // r.get({ plain: true }),
        sequelizeResponseParser(r),
      ),
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

    if (!query) {
      const { rows, count } = await MercadoriaModel.findAndCountAll({
        distinct: true,
        attributes: [
          "id",
          "descricao",
          "estoque02",
          "estoque03",
          "estoque04",
          "precoCusto",
          "precoVenda",
        ],
        include: [
          { association: "fabricante", attributes: ["id", "nome"] },
          {
            association: "caracteristicas",
            attributes: ["id", "nome", "tipo"],
            through: { attributes: ["valor"] },
          },
        ],

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
      attributes: [
        "id",
        "descricao",
        "estoque02",
        "estoque03",
        "estoque04",
        "precoCusto",
        "precoVenda",
      ],
      include: [
        { association: "fabricante", attributes: ["id", "nome"] },
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
      ],
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

    if(isNaN(id)){
      return res.status(400).json({response: "Id da mercadoria inválido!"})
    }

    let mercadoria = req.body;
    
    const caracteristicas = caracteristicasParser(mercadoria, id);

    // Negative merc Key, assigns new
    if (mercadoria.key === -1) {
      const maxKey: number = await Mercadoria.max("key");

      mercadoria.key = maxKey ? maxKey + 1 : 1;
    }

    const user = req.user;
    if (!user)
      return res.status(403).json({ response: "Usuario nao autenticado" });

    let updateFields: string[] | undefined = undefined;

    if (user.funcao !== "admin") {
      const allowedFields = getAllowedFields(user, mercadoria);
      // Mantém apenas os campos que a) são permitidos e b) foram enviados (não são undefined)
      updateFields = allowedFields.filter(
        (field) => mercadoria[field as keyof MercadoriaUpdate] !== undefined,
      );
    }

    const oldMercadoria =  await Mercadoria.findByPk(id, {
      transaction: t,
      include: [
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
      ],
    });

    if (!oldMercadoria) {
      return res
        .status(404)
        .json({ response: "Mercadoria to be updated not found" });
    }
    const parsedOldMerc = sequelizeResponseParser(oldMercadoria);

    // console.log(mercadoria);
    // console.log(sequelizeResponseParser(oldMercadoria));

    const alteracoes = getAuditChanges<MercadoriaLog>(
      parsedOldMerc,
      mercadoria as any,
    );

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
      attributes: [
        "id",
        "key",
        "descricao",
        "estoque02",
        "estoque03",
        "estoque04",
        "precoVenda",
      ],
      include: [
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
      ],
    });

    const mercs = rows.map((merc) => sequelizeResponseParser(merc));
    console.log(mercs[0]);
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
