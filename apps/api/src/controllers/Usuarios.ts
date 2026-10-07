import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Usuario } from "../models/models";
import {
  ApiResponse,
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  createUsuarioSchema,
  CriarUsuarioPayload,
  IUsuario,
  UsuarioListing,
} from "@tauri-inventory/types";
import UsuarioModel from "../models/Usuario";
import { ValidationError } from "sequelize";
import sequelize from "../config/db";
import AuditLog, { getAuditChanges } from "../models/AuditLogs";

export const criarUsuario = async (
  req: Request<{}, {}, CriarUsuarioPayload>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const usuario = req.body;

    const usuarioLogado = req.user;

    if (!usuarioLogado) {
      return res.status(200).json({ response: "Usuario nao autenticado" });
    }

    if (
      usuarioLogado.funcao === "gerente" &&
      usuarioLogado.local.id !== usuario.lojaId
    ) {
      return res.status(403).json({
        response:
          "Acesso negado. Sem permissão para alterar usuarios de outras lojas",
      });
    }

    const parseResult = createUsuarioSchema.safeParse(usuario);

    if (!parseResult.success) {
      return res.status(400).json({
        response: parseResult.error.issues[0].message,
      });
    }

    const senhaHash = await bcrypt.hash(usuario.senha, 10);

    const novoUsuario = {
      nome: usuario.nome,
      usuario: usuario.usuario,
      lojaId: usuario.lojaId,
      funcao: usuario.funcao,
      senhaHash: senhaHash,
    };

    const newUser = await Usuario.create(novoUsuario, { transaction: t });

    const dados = {
      nome: usuario.nome,
      usuario: usuario.usuario,
      lojaId: usuario.lojaId,
      funcao: usuario.funcao,
    };

    await AuditLog.create(
      {
        acao: AuditLogAction.CREATE,
        alvoTipo: AuditLogTargetType.USUARIO,
        alvoId: newUser.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { criacao: dados },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await t.commit();
    res.status(201).json({ response: "Usuario criado com sucesso!" });
  } catch (e: unknown) {
    await t.rollback();
    console.error("Failed to create usuario: ", e);
    let error = "Erro desconhecido ao criar usuario";
    let status = 500;

    if (e instanceof ValidationError) {
      if (e.errors && e.errors.length > 0) {
        switch (e.errors[0].message) {
          case "PRIMARY must be unique":
            error = "Erro ao criar usuario, ID já existente no banco de dados.";
            status = 400;
            break;
          case "O nome do usuario já está em uso.":
            error =
              "Erro ao criar usuario, nome já existente no banco de dados.";
            status = 400;
            break;
        }
      }
      res.status(status).json({ response: error });
    }
  }
};

export const listarUsuarios = async (
  req: Request,
  res: Response<ApiResponse | UsuarioListing>,
  next: NextFunction,
) => {
  try {
    const getDeleted = req.query.all?.toString().toLowerCase() === "true";

    // `UsuarioListFilter` em `apps/pos/src-tauri/src/database/usuarios.rs`:
    // `localId`/`ativo`. Os nomes antigos (`local`/`active`) eram colunas que
    // nunca existiram no model — `local` virou a associação e `active` é `ativo`
    // — então o filtro era silenciosamente ignorado.
    const localId = req.body?.localId;
    const ativo = req.body?.ativo;

    const usuarios = await Usuario.findAll({
      attributes: [
        "id",
        "nome",
        "usuario",
        "funcao",
        "ativo",
        "createdAt",
        "updatedAt",
        "deletedAt",
      ],
      include: [
        // `paranoid: false` para espelhar a subquery de `USUARIOS_SELECT`
        // (`apps/pos/src-tauri/src/offline/database/off_users.rs`): a loja de um
        // usuário é `NOT NULL` e faz parte da identidade dele, então uma loja
        // soft-deleted ainda precisa resolver. Sem isto o include devolveria
        // `null` e o `serde` falharia ao desserializar `LoggedUser.local`.
        { association: "local", paranoid: false },
      ],

      paranoid: !getDeleted,
      where: {
        ...(localId !== undefined ? { lojaId: localId } : undefined),
        ...(ativo !== undefined ? { ativo } : undefined),
      },
    });

    console.log(usuarios[0]);
    res.status(200).json(usuarios as any);
  } catch (e) {
    console.error("Failed to list usuarios: ", e);

    res.status(500).json({
      response:
        "Falha ao listar usuarios, entre em contato com um administrador.",
    });
  }
};

export const alterarUsuario = async (
  req: Request<{ id: string }, {}, Partial<CriarUsuarioPayload>>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const id = parseInt(req.params.id, 10);
    const usuarioData = req.body;

    const usuarioLogado = req.user;

    if (!usuarioLogado)
      return res.status(403).json({ response: "Usuario nao autenticado." });

    if (!usuarioData || isNaN(id)) {
      return res
        .status(400)
        .json({ response: "Dados do usuário ausentes ou ID inválido" });
    }

    const oldUser = await UsuarioModel.findByPk(id, {
      transaction: t,
      paranoid: false,
    });

    if (
      usuarioLogado.funcao === "gerente" &&
      usuarioLogado.local.id !== usuarioData.lojaId &&
      usuarioLogado.local.id !== oldUser?.lojaId
    ) {
      return res.status(403).json({
        response:
          "Acesso negado. Sem permissão para alterar usuarios de outras lojas",
      });
    }


    if (!oldUser) {
      return res
        .status(404)
        .json({ response: `Usuario com id: ${id} nao encontrado` });
    }
    let senhaHash: string | undefined = oldUser.senhaHash;
    if (usuarioData.senha) {
      senhaHash = await bcrypt.hash(usuarioData.senha, 10);
    }

    const novoUsuario = {
      id: id,
      nome: usuarioData.nome,
      funcao: usuarioData.funcao,
      lojaId: usuarioData.lojaId,
      usuario: usuarioData.usuario,
      senhaHash: senhaHash,
      ativo: usuarioData.ativo
    };

    // console.log(novoUsuario);

    const alteracoes = getAuditChanges(oldUser, novoUsuario);



    await AuditLog.create(
      {
        acao: AuditLogAction.UPDATE,
        alvoTipo: AuditLogTargetType.USUARIO,
        alvoId: oldUser.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: { alteracoes },
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await oldUser.update(novoUsuario, { transaction: t });

    await t.commit();

    res.status(200).json({ response: "Usuario alterado com sucesso!" });
  } catch (e: any) {
    await t.rollback();

    console.error("Erro ao alterar usuario: ", e);
    if (e.errors) {
      return res.status(400).json({ response: e.errors[0].message });
    }
    res.status(500).json({ response: "Erro interno ao alterar usuario." });
  }
};

export const desativarUsuario = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const usuarioLogado = req.user;

    // User permission checks

    if (!usuarioLogado) {
      return res.status(400).json({ response: "Usuario nao autenticado" });
    }

    if (usuarioLogado.funcao === "vendedor") {
      return res.status(403).json({ response: "Permissão insuficiente." });
    }
    const userData = await Usuario.findByPk(id, { transaction: t });

    if (!userData) {
      return res
        .status(404)
        .json({ response: "Usuario para desativar nao encontrado." });
    }

    if (
      usuarioLogado.funcao === "gerente" &&
      usuarioLogado.local !== userData.local
    ) {
      return res
        .status(403)
        .json({ response: "Não é possivel desativar usuario de outra loja." });
    }

    await AuditLog.create(
      {
        acao: AuditLogAction.DELETE,
        alvoTipo: AuditLogTargetType.USUARIO,
        alvoId: userData.id,
        usuarioId: usuarioLogado.id,
        data: new Date(),
        ip: req.ip ?? null,
        dados: null,
        nivel: AuditLogLevel.NORMAL,
      },
      { transaction: t },
    );

    await userData.destroy({ transaction: t });

    await t.commit();
    return res.status(200).json({ response: `Usuario #${id} deletado` });
  } catch (e) {
    await t.rollback();
    console.log(e);
    res.status(500).json({ response: "Erro interno." });
  }
};
