import { Request, Response } from "express";
import LojasModel from "../models/Lojas";
import MercadoriaModel from "../models/Mercadoria";
import EstoqueModel from "../models/Estoque";
import sequelize from "../config/db";
import {
  CreateLojaPayload,
  ILoja,
} from "../../../../packages/types/dist/database/Loja";
import { ApiResponse } from "../../../../packages/types/dist/database/ApiResponses";
import AuditLog, { AuditCreate, getAuditChanges } from "../models/AuditLogs";
import {
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
} from "@tauri-inventory/types";
import UsuarioModel from "../models/Usuario";

export async function getLojas(req: Request, res: Response) {
  try {
    const lojas = await LojasModel.findAll();
    res.status(200).json(lojas);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno." });
  }
}

export async function createLoja(
  req: Request<{}, ILoja | ApiResponse, CreateLojaPayload>,
  res: Response,
) {
  const t = await sequelize.transaction();
  try {
    const usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(403).json({ response: "Usuario nao autenticado" });
    }

    const lojaPayload = req.body;
    const loja = await LojasModel.create(lojaPayload, { transaction: t });

    await AuditLog.create(
      {
        acao: AuditLogAction.CREATE,
        alvoTipo: AuditLogTargetType.LOJA,
        alvoId: loja.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { criacao: loja.get({ plain: true }) },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await t.commit();
    return res.status(201).json(loja);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ response: "Erro interno ao criar loja." });
  }
}
export async function editLoja(
  req: Request<{ lojaId: string }, ILoja | ApiResponse, CreateLojaPayload>,
  res: Response,
) {
  const t = await sequelize.transaction();
  try {
    const usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(403).json({ response: "Usuario nao autenticado" });
    }
    const { lojaId } = req.params;
    const lojaPayload = req.body;
    const oldLoja = await LojasModel.findByPk(lojaId, { transaction: t });
    if (!oldLoja) {
      return res
        .status(404)
        .json({ response: `Loja com id ${lojaId} não encontrada.` });
    }

    const changes = getAuditChanges(oldLoja, lojaPayload);

    await AuditLog.create(
      {
        acao: AuditLogAction.UPDATE,
        alvoTipo: AuditLogTargetType.LOJA,
        alvoId: lojaId,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { alteracoes: changes },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    const lojaRes = await oldLoja.update(lojaPayload);

    await t.commit();
    return res.status(201).json(lojaRes);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ response: "Erro interno ao editar loja." });
  }
}
export async function deleteLoja(
  req: Request<{ lojaId: string }, ILoja | ApiResponse, CreateLojaPayload>,
  res: Response,
) {
  const t = await sequelize.transaction();
  try {
    const usuarioLogado = req.user;
    if (!usuarioLogado) {
      return res.status(403).json({ response: "Usuario nao autenticado" });
    }
    const lojaId = Number(req.params.lojaId);

    if (!lojaId || isNaN(lojaId)) {
      return res.status(400).json({ response: "Dados da loja inválidos." });
    }

    const oldLoja = await LojasModel.findByPk(lojaId, { transaction: t });

    if (!oldLoja) {
      return res
        .status(404)
        .json({ response: `Loja com id ${lojaId} não encontrada.` });
    }

    await oldLoja.destroy({ transaction: t });

    await AuditLog.create(
      {
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.LOJA,
        alvoId: lojaId,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.CRITICO,
      },
      { transaction: t },
    );

    const usersToDelete = await UsuarioModel.findAll({
      where: { lojaId: lojaId },
      transaction: t,
    });

    await AuditLog.bulkCreate(
      usersToDelete.map((user) => ({
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.USUARIO,
        alvoId: user.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.CRITICO,
      })),
      { transaction: t },
    );

    await UsuarioModel.destroy({ where: { lojaId }, transaction: t });

    await t.commit();
    return res.status(201).json(oldLoja);
  } catch (e) {
    await t.rollback();
    console.error(e);
    res.status(500).json({ response: "Erro interno ao deletar loja." });
  }
}

export async function getLojaEstoqueTotal(req: Request, res: Response) {
  try {
    const { lojaId } = req.params;
    const countResponse: number | null = await EstoqueModel.sum("estoque", {
      where: {
        lojaId: lojaId,
      },
    });
    const count = countResponse !== null ? countResponse : 0;
    return res.status(200).json({ count });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro Interno." });
  }
}
