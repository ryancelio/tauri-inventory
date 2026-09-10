import { Request, Response, NextFunction } from "express";
import { Atributo } from "../models/models";
import {
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  IAtributo,
  IUsuario,
} from "@tauri-inventory/types";
import { ApiResponse, ApiListResponse } from "@tauri-inventory/types";
import { BaseQuery } from "@tauri-inventory/types";
import {
  buildWhereClause,
  getAdditionalFilters,
} from "../config/utils/whereBuilder";
import { CreationAttributes, Order, ValidationError } from "sequelize";
import AuditLog, { AuditCreate, getAuditChanges } from "../models/AuditLogs";
import sequelize from "../config/db";

export const criarAtributo = async (
  req: Request<{}, {}, CreationAttributes<Atributo>>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const atributo = req.body;
    const user = req.user as IUsuario;
    atributo.nome = atributo.nome.toLowerCase();

    const newAtributo = await Atributo.create(atributo, { transaction: t });
    const log: AuditCreate = {
      acao: AuditLogAction.CREATE,
      alvoTipo: AuditLogTargetType.ATRIBUTO,
      alvoId: newAtributo.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: { criacao: newAtributo },
      nivel: AuditLogLevel.NORMAL,
    };
    await AuditLog.create(log, { transaction: t });
    t.commit();
    return res.status(201).json({ response: "Atributo criado com sucesso" });
  } catch (e: unknown) {
    t.rollback();
    console.error("Failed to create atributo: ", e);
    let error = "Erro desconhecido ao criar atributo";
    let status = 500;

    if (e instanceof ValidationError) {
      if (e.errors && e.errors.length > 0) {
        switch (e.errors[0].message) {
          case "PRIMARY must be unique":
            error =
              "Erro ao criar atributo, ID já existente no banco de dados.";
            status = 400;
            break;
          case "O nome do atributo já está em uso.":
            error =
              "Erro ao criar atributo, nome já existente no banco de dados.";
            status = 400;
            break;
        }
      }
      res.status(status).json({ response: error });
    }
  }
};

// export const listarAtributosFiltrado = async (
//   req: Request<{}, {}, BaseQuery<IAtributo>>,
//   res: Response<ApiResponse | ApiListResponse<IAtributo>>,
//   next: NextFunction,
// ) => {
//   try {
//     const query = req.body;

//     if (!query || Object.keys(query).length === 0) {
//       const { rows, count } = await Atributo.findAndCountAll({
//         limit: 50,
//         raw: true,
//       });
//       return res.json({ data: rows as unknown as IAtributo[], count: count });
//     }

//     const where = buildWhereClause(query);

//     const { limit, offset, order } = getAdditionalFilters(query);

//     const { rows, count } = await Atributo.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: order as Order,
//       raw: true,
//     });

//     res
//       .status(200)
//       .json({ data: rows as unknown as IAtributo[], count: count });
//   } catch (e) {
//     console.error("Failed to list atributos: ", e);
//     res.status(500).json({ response: "Failed to list atributos" });
//   }
// };

export const listarAtributos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const atributos = await Atributo.findAll({ raw: true });
    res.status(200).json(atributos);
  } catch (e) {
    console.error("Failed to list atributos: ", e);
    res.status(500).json({ response: "Failed to list atributos" });
  }
};

export const obterAtributo = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse | IAtributo>,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const atributo = await Atributo.findByPk(id, { raw: true });

    if (!atributo) {
      return res.status(404).json({ response: "Atributo not found" });
    }

    res.status(200).json(atributo as unknown as IAtributo);
  } catch (e) {
    console.error("Failed to get atributo: ", e);
    res.status(500).json({ response: "Failed to get atributo" });
  }
};

export const alterarAtributo = async (
  req: Request<{ id?: string }, CreationAttributes<Atributo>>,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id || req.body.id;
    const newAtributo = req.body;
    const user = req.user as IUsuario;

    // const [affectedRows] = await Atributo.update(atributo, {
    //   where: { id: id },
    // });
    const oldAtributo = await Atributo.findByPk(id, { transaction: t });
    if (!oldAtributo) {
      return res
        .status(404)
        .json({ response: "Atributo to be updated not found" });
    }
    await oldAtributo.update(newAtributo, {
      transaction: t,
    });

    const changes = getAuditChanges(oldAtributo, newAtributo);
    const log: AuditCreate = {
      acao: AuditLogAction.UPDATE,
      alvoTipo: AuditLogTargetType.ATRIBUTO,
      alvoId: oldAtributo.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: { alteracoes: changes },
      nivel: AuditLogLevel.NORMAL,
    };
    await AuditLog.create(log, { transaction: t });

    t.commit();
    return res.status(200).json({ response: `Atributo ${id} updated` });
  } catch (e) {
    t.rollback();
    console.error("Failed to update atributo: ", e);
    res.status(500).json({ response: "Failed to update atributo" });
  }
};

export const deletarAtributo = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const user = req.user as IUsuario;

    const atributo = await Atributo.findByPk(id);

    if (!atributo) {
      return res
        .status(404)
        .json({ response: "Atributo to be deleted not found" });
    }
    await atributo.destroy({ transaction: t });

    const log: AuditCreate = {
      acao: AuditLogAction.DELETE,
      alvoTipo: AuditLogTargetType.ATRIBUTO,
      alvoId: atributo.id,
      usuarioId: user.id,
      data: new Date(),
      ip: req.ip ?? null,
      dados: null,
      nivel: AuditLogLevel.NORMAL,
    };
    await AuditLog.create(log, { transaction: t });

    t.commit();
    return res.status(200).json({ response: `Atributo ${id} deleted` });
  } catch (e) {
    t.rollback();
    console.error("Failed to delete atributo: ", e);
    res.status(500).json({ response: "Failed to delete atributo" });
  }
};
