import { Request, Response } from "express";
import LojasModel from "../models/Lojas";
import MercadoriaModel from "../models/Mercadoria";
import EstoqueModel from "../models/Estoque";
import sequelize from "../config/db";
import { CreateLojaPayload, ILoja } from "../../../../packages/types/dist/database/Loja";
import { ApiResponse } from "../../../../packages/types/dist/database/ApiResponses";
import AuditLog from "../models/AuditLogs";
import { AuditLogAction, AuditLogLevel, AuditLogTargetType } from "@tauri-inventory/types";

export async function getLojas(req: Request, res: Response) {
  try {
    const lojas = await LojasModel.findAll();
    res.status(200).json(lojas);
  } catch (e) {
    console.error(e);
    res.status(500).json({response: "Erro interno."})
  }
}

export async function createLoja(
  req: Request<{}, ILoja | ApiResponse, CreateLojaPayload>, res: Response
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
    res.status(500).json({response: "Erro interno ao criar loja."})
  }
}

export async function getLojaEstoqueTotal(req: Request, res: Response) {
  try {
    const { lojaId } = req.params;
    const countResponse: number | null = await EstoqueModel.sum("estoque",{
      where: {
        lojaId: lojaId,
      }
    })
    const count = countResponse !== null ? countResponse : 0;
    return res.status(200).json({ count });
  }catch (e) {
    console.error(e);
    res.status(500).json({response: "Erro Interno."})
  }
}
