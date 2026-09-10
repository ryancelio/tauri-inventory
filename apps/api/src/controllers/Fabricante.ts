import { Request, Response, NextFunction } from "express";
import { Fabricante } from "../models/models";
import {
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  IFabricante,
} from "@tauri-inventory/types";
import { ApiResponse, ApiListResponse } from "@tauri-inventory/types";
import { CreationAttributes, Order, ValidationError } from "sequelize";
import {
  buildWhereClause,
  getAdditionalFilters,
} from "../config/utils/whereBuilder";
import { BaseQuery } from "@tauri-inventory/types";
import MercadoriaModel from "../models/Mercadoria";
import sequelize from "../config/db";
import FabricanteModel from "../models/Fabricante";
import AuditLog, { getAuditChanges } from "../models/AuditLogs";

export const criarFabricante = async (
  req: Request<{}, {}, CreationAttributes<FabricanteModel>>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    let usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    let fabricante = req.body;
    // Forces capitalization
    fabricante.nome = fabricante.nome[0]
      .toUpperCase()
      .concat(fabricante.nome.slice(1));

    const newFab = await Fabricante.create(fabricante, { transaction: t });

    await AuditLog.create(
      {
        acao: AuditLogAction.CREATE,
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: newFab.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { criacao: newFab.get({ plain: true }) },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await t.commit();
    res.status(201).json({ response: "Fabricante criado com sucesso!" });
  } catch (e: unknown) {
    await t.rollback();
    console.error("Failed to create fabricante: ", e);
    let error = "Erro desconhecido ao criar fabricante";
    let status = 500;

    if (e instanceof ValidationError) {
      if (e.errors && e.errors.length > 0) {
        switch (e.errors[0].message) {
          case "PRIMARY must be unique":
            error =
              "Erro ao criar fabricante, ID já existente no banco de dados.";
            status = 400;
            break;
          case "O nome do fabricante já está em uso.":
            error =
              "Erro ao criar fabricante, nome já existente no banco de dados.";
            status = 400;
            break;
        }
      }
    }
    res.status(status).json({ response: error });
  }
};

// export const listarFabricantesFiltrado = async (
//   req: Request<{}, {}, BaseQuery<IFabricante>>,
//   res: Response<ApiResponse | ApiListResponse<IFabricante>>,
//   next: NextFunction,
// ) => {
//   try {
//     const query = req.body;

//     // No request body, returns unfiltered limited results
//     if (!query) {
//       const { rows, count } = await Fabricante.findAndCountAll({
//         limit: 50,
//       });
//       return res.json({ data: rows as unknown as IFabricante[], count: count });
//     }

//     const where = buildWhereClause(query);

//     const { limit, offset, order } = getAdditionalFilters(query);

//     const { rows, count } = await Fabricante.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: order as Order,
//       raw: true,
//     });
//     res
//       .status(200)
//       .json({ data: rows as unknown as IFabricante[], count: count });
//   } catch (e) {
//     console.error("Failed to list fabricantes: ", e);
//     res.status(500).json({ response: "Falha ao listar fabricantes" });
//   }
// };

export const listarFabricantes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const getDeleted = req.query.all?.toString().toLowerCase() === "true";
    const fabricantes = await Fabricante.findAll({ paranoid: !getDeleted });
    res.status(200).json(fabricantes);
  } catch (e) {
    res.status(500).json({ response: "Falha ao listar fabricantes" });
  }
};

export const obterFabricante = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse | IFabricante>,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const fabricante = await Fabricante.findByPk(id, { raw: true });

    if (!fabricante) {
      return res.status(404).json({ response: "Fabricante não encontrado" });
    }

    res.status(200).json(fabricante as unknown as IFabricante);
  } catch (e) {
    console.error("Failed to get fabricante: ", e);
    res.status(500).json({ response: "Falha ao listar fabricante" });
  }
};

export const alterarFabricante = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    const newFab = req.body;
    let usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    const oldFab = await Fabricante.findByPk(id.toString(), { transaction: t });

    if (!oldFab) {
      return res
        .status(404)
        .json({ response: "Fabricante to be updated not found" });
    }

    const alteracoes = getAuditChanges(oldFab, newFab);

    await AuditLog.create(
      {
        acao: AuditLogAction.UPDATE,
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: newFab.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { alteracoes },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await oldFab.update(newFab, { transaction: t });

    await t.commit();
    return res.status(200).json({ response: `Fabricante ${id} atualizado` });
  } catch (e) {
    await t.rollback();
    console.error("Failed to update fabricante: ", e);
    res.status(500).json({ response: "Falha ao apagar fabricante" });
  }
};

export const deletarFabricante = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = req.params.id;
    let usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    const fabricante = await Fabricante.findByPk(id.toString(), {
      transaction: t,
    });

    if (!fabricante) {
      return res
        .status(404)
        .json({ response: "Fabricante para ser deletado nao encontrado" });
    }

    await AuditLog.create(
      {
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: fabricante.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await fabricante.destroy();

    await t.commit();
    return res.status(200).json({ response: `Fabricante ${id} apagado` });
  } catch (e) {
    await t.rollback();
    console.error("Failed to delete fabricante: ", e);
    res.status(500).json({ response: "Falha ao apagar fabricante" });
  }
};

// GET /fabricantes/:id/mercadorias/count
export const obterContagemMercadorias = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const count = await MercadoriaModel.count({ where: { fabricanteId: id } });

    console.log(count);

    res.status(200).json(count);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Falha ao contar mercadorias" });
  }
};

// POST /fabricantes/:id/reassign/:newFabId
export const reassignFabricante = async (
  req: Request<{ oldFabId: string; newFabId: string }>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const { oldFabId, newFabId } = req.params;

  const t = await sequelize.transaction();

  try {
    const oldFab = await FabricanteModel.findByPk(oldFabId, { transaction: t });
    let usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    if (!oldFab) {
      await t.rollback();
      return res
        .status(400)
        .json({ response: "Fabricante a ser deletado nao encontrado" });
    }

    const newFab = await FabricanteModel.findByPk(newFabId);

    if (!newFab) {
      await t.rollback();
      return res
        .status(400)
        .json({ response: "Fabricante a ser atributido nao encontrado" });
    }

    const mercsToBeUpdated = await MercadoriaModel.findAll({
      where: { fabricanteId: oldFab.id },
      transaction: t,
    });

    await MercadoriaModel.update(
      { fabricanteId: newFabId },
      {
        where: { fabricanteId: oldFab.get("id") },
        transaction: t,
      },
    );

    await AuditLog.bulkCreate(
      mercsToBeUpdated.map((merc) => ({
        acao: AuditLogAction.UPDATE,
        alvoTipo: AuditLogTargetType.MERCADORIA,
        alvoId: merc.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: {
          alteracoes: {
            fabricanteId: { anterior: oldFab.id, novo: newFab.id },
          },
        },
        nivel: AuditLogLevel.NORMAL,
      })),
      { transaction: t },
    );

    await oldFab.destroy({ transaction: t });

    await AuditLog.create(
      {
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: oldFab.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await t.commit();
    return res.status(200).json({
      response: `Fabricante ${oldFab.get("nome")} deletado, mercadorias alteradas para ${newFab.get("nome")}`,
    });
  } catch (e) {
    await t.rollback();
    console.error(e);
    return res.status(500).json({ response: "Falha ao alterar." });
  }
};

//  DELETE /fabricantes/:id/cascade
export async function cascadeFabDelete(
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction,
) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const fabricante = await FabricanteModel.findByPk(id);
    let usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    if (!fabricante) {
      await t.rollback();
      return res.status(404).json({ response: "Fabricante não encontrado" });
    }

    const mercsToBeUpdated = await MercadoriaModel.findAll({
      where: { fabricanteId: fabricante.id },
      transaction: t,
    });

    AuditLog.bulkCreate(
      mercsToBeUpdated.map((merc) => ({
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.MERCADORIA,
        alvoId: merc.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.NORMAL,
      })),
      { transaction: t },
    );

    await AuditLog.create(
      {
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: fabricante.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await MercadoriaModel.destroy({
      where: { fabricanteId: fabricante.id },
      individualHooks: true,
      transaction: t,
    });

    await fabricante.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      response: `Fabricante ${fabricante.get("id")} deletado junto a ${mercsToBeUpdated.length} mercadorias`,
    });
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ response: "Erro interno ao deletar fabricante." });
  }
}
