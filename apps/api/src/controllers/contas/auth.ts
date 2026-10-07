import { NextFunction, Request, Response } from "express";
import { Usuario } from "../../models/models";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUsuario, UsuarioLogado } from "@tauri-inventory/types";

export const login = async (
  req: Request<{}, {}, { usuario: string; senha: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { usuario, senha } = req.body;
    const row = await Usuario.findOne({
      where: {
        usuario: usuario,
      },
      include: [
        {association: "local"}
      ],
    });

    if (!row)
      return res.status(400).json({ response: "Usuário ou Senha Inválidos." });
    const user = row;
    const matches = await bcrypt.compare(senha, user.senhaHash);

    if (!matches)
      return res.status(400).json({ response: "Usuário ou Senha Inválidos" });

    const payload: UsuarioLogado = {
      id: user.id,
      nome: user.nome,
      funcao: user.funcao,
      local: user.local as any,
    };

    const secret = process.env.JWT_SECRET;
    if (!secret || secret === "") {
      console.error("Invalid or missing JWT_SECRET varible in .env");
      return res.status(500).json({
        response: "Erro interno, entre em contato com um administrador",
      });
    }
    const token = jwt.sign(payload, secret);

    return res.status(200).json({
      token,
      user: payload,
    });
  } catch (e) {
    console.log("Erro: ", e);
    res.status(500).json({
      response: "Erro interno, entre em contato com um administrador",
    });
  }
};
