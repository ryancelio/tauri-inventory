import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { IUsuario } from "@tauri-inventory/types";

declare global {
  namespace Express {
    interface Request {
      user?: IUsuario;
    }
  }
}

export function requiresAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ response: "Acesso negado. Token não fornecido" });
    // TODO - LOG
  }
  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("Internal server error");
    const decoded = jwt.verify(token, secret) as IUsuario;

    req.user = decoded;
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ response: "Sessão expirada, ou token inválido." });
  }
}

export const requiredRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ response: "Não autenticado" });

    if (!allowedRoles.includes(req.user.funcao)) {
      return res
        .status(403)
        .json({ response: "Acesso negado: Permissão insuficiente" });
    }
    next();
  };
};
