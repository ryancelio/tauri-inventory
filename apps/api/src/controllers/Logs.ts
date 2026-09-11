import { NextFunction, Request, Response } from "express";
import AuditLogModel from "../models/AuditLogs";
import {
  ApiListResponse,
  ApiResponse,
  AuditLog,
  AuditLogTargetType,
} from "@tauri-inventory/types";
import { Usuario } from "../models/models";

const LOG_PAGE_LIMIT = 100;

function getDefaultFilters(req: Request) {
  let page = Number(req.query.page);
  let userId: number | undefined = Number(req.query.userId);

  let level = req.query.level;
  let action = req.query.action;

  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(userId)) {
    userId = undefined;
  }

  const userIdFilter = userId !== undefined ? { usuarioId: userId } : {};
  const levelFilter = level !== undefined ? { nivel: level } : {};
  const actionFilter = action !== undefined ? { acao: action } : {};

  const offset = page * LOG_PAGE_LIMIT - LOG_PAGE_LIMIT;

  return {
    userIdFilter,
    levelFilter,
    actionFilter,
    offset,
  };
}

// GET /logs/all?page=<Number>
export async function getAllLogs(
  req: Request,
  res: Response<ApiListResponse<AuditLog> | ApiResponse>,
  next: NextFunction,
) {
  try {
    const { actionFilter, levelFilter, userIdFilter, offset } =
      getDefaultFilters(req);

    const where = {
      ...userIdFilter,
      ...levelFilter,
      ...actionFilter,
    };

    const { count, rows } = await AuditLogModel.findAndCountAll({
      where,
      limit: LOG_PAGE_LIMIT,
      offset,
      order: [["id", "DESC"]],

      include: [
        {
          association: "Usuario",
          as: "usuario",
          attributes: ["id", "nome", "funcao", "local"],
        },
      ],
      attributes: { exclude: ["usuarioId"] },
    });

    return res.status(200).json({ count, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
}

// GET /logs/mercadoria/:id?page=<Number>
export async function getMercLogs(
  req: Request,
  res: Response<ApiListResponse<AuditLog> | ApiResponse>,
  next: NextFunction,
) {
  try {
    const { actionFilter, levelFilter, userIdFilter, offset } =
      getDefaultFilters(req);

    const mercId = req.params.id;

    const { count, rows } = await AuditLogModel.findAndCountAll({
      where: {
        alvoTipo: AuditLogTargetType.MERCADORIA,
        alvoId: mercId,
        ...userIdFilter,
        ...levelFilter,
        ...actionFilter,
      },
      order: [["id", "DESC"]],
      limit: LOG_PAGE_LIMIT,
      offset,
      include: [
        {
          association: "Usuario",
          as: "usuario",
          attributes: ["id", "nome", "funcao", "local"],
        },
      ],
      attributes: { exclude: ["usuarioId"] },
      paranoid: false,
    });

    return res.status(200).json({ count, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
}

// GET /logs/usuario/:userIdTarget?page=<Number>
export async function getUserLogs(
  req: Request,
  res: Response<ApiListResponse<AuditLog> | ApiResponse>,
  next: NextFunction,
) {
  try {
    const { actionFilter, levelFilter, userIdFilter, offset } =
      getDefaultFilters(req);

    const userIdTarget = req.params.userIdTarget;

    const { count, rows } = await AuditLogModel.findAndCountAll({
      where: {
        alvoTipo: AuditLogTargetType.USUARIO,
        alvoId: userIdTarget,
        ...userIdFilter,
        ...levelFilter,
        ...actionFilter,
      },
      order: [["id", "DESC"]],
      limit: LOG_PAGE_LIMIT,
      offset,
      include: [
        {
          association: "Usuario",
          as: "usuario",
          attributes: ["id", "nome", "funcao", "local"],
        },
      ],
      attributes: { exclude: ["usuarioId"] },
      paranoid: false,
    });
    res.status(200).json({ count, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
}
// GET /logs/fabricante/:fabricanteId?page=<Number>
export async function getFabricanteLogs(
  req: Request,
  res: Response<ApiListResponse<AuditLog> | ApiResponse>,
  next: NextFunction,
) {
  try {
    const { actionFilter, levelFilter, userIdFilter, offset } =
      getDefaultFilters(req);

    const fabricanteId = req.params.fabricanteId;

    const { count, rows } = await AuditLogModel.findAndCountAll({
      where: {
        alvoTipo: AuditLogTargetType.FABRICANTE,
        alvoId: fabricanteId,
        ...userIdFilter,
        ...levelFilter,
        ...actionFilter,
      },
      order: [["id", "DESC"]],
      limit: LOG_PAGE_LIMIT,
      offset,
      include: [
        {
          association: "Usuario",
          as: "usuario",
          attributes: ["id", "nome", "funcao", "local"],
        },
      ],
      attributes: { exclude: ["usuarioId"] },
      paranoid: false,
    });
    res.status(200).json({ count, data: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno" });
  }
}
