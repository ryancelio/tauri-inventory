import { Request, Response, NextFunction } from "express";
import { Grupo } from "../models/models";
import { IGrupo } from "@tauri-inventory/types";
import { ApiResponse, ApiListResponse } from "@tauri-inventory/types";
import { BaseQuery } from "@tauri-inventory/types";
import {
  buildWhereClause,
  getAdditionalFilters,
} from "../config/utils/whereBuilder";
import { Order, ValidationError } from "sequelize";
import GrupoModel from "../models/Grupo";

export const criarGrupo = async (
  req: Request<{}, {}, IGrupo>,
  res: Response<ApiResponse | IGrupo>,
  next: NextFunction,
) => {
  try {
    const grupo = req.body;
    await Grupo.create(grupo as any);

    res
      .status(201)
      .json({ response: `Grupo ${grupo.nome} criado com sucesso` });
  } catch (e: unknown) {
    console.error("Failed to create grupo: ", e);
    let error = "Erro desconhecido ao criar grupo";
    let status = 500;

    if (e instanceof ValidationError) {
      if (e.errors && e.errors.length > 0) {
        switch (e.errors[0].message) {
          case "PRIMARY must be unique":
            error = "Erro ao criar grupo, ID já existente no banco de dados.";
            status = 400;
            break;
          case "O nome do grupo já está em uso.":
            error = "Erro ao criar grupo, nome já existente no banco de dados.";
            status = 400;
            break;
        }
      }
      res.status(status).json({ response: error });
    }
  }
};

// export const listarGruposFiltrado = async (
//   req: Request<{}, {}, BaseQuery<IGrupo>>,
//   res: Response<ApiResponse | ApiListResponse<IGrupo>>,
//   next: NextFunction,
// ) => {
//   try {
//     const query = req.body;

//     // No request body, returns unfiltered limited results
//     if (!query) {
//       const { rows, count } = await Grupo.findAndCountAll({
//         limit: 50,
//       });
//       return res.json({ data: rows as unknown as IGrupo[], count: count });
//     }

//     const where = buildWhereClause(query);

//     const { limit, offset, order } = getAdditionalFilters(query);

//     const { rows, count } = await Grupo.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: order as Order,
//       raw: true,
//     });

//     res.status(200).json({ data: rows as unknown as IGrupo[], count: count });
//   } catch (e) {
//     console.error("Failed to list grupos: ", e);
//     res.status(500).json({ response: "Failed to list grupos" });
//   }
// };

export const listarGrupos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const grupos = await Grupo.findAll({
      include: {
        association: "categorias",
        attributes: { exclude: ["grupoId"] },
      },
    });
    res.status(200).json(grupos);
  } catch (e) {
    console.error("Failed to list grupos", e);
    res.status(500).json({ response: "Failed to list grupos" });
  }
};

export const obterGrupo = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse | IGrupo>,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const grupo = await Grupo.findByPk(id, { raw: true });

    if (!grupo) {
      return res.status(404).json({ response: "Grupo not found" });
    }

    res.status(200).json(grupo as unknown as IGrupo);
  } catch (e) {
    console.error("Failed to get grupo: ", e);
    res.status(500).json({ response: "Failed to get grupo" });
  }
};

export const alterarGrupo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const grupo = req.body;

    const [affectedRows] = await Grupo.update(grupo, {
      where: { id: id },
    });

    if (affectedRows < 1) {
      return res
        .status(404)
        .json({ response: "Grupo to be updated not found" });
    }
    return res.status(200).json({ response: `Grupo ${id} updated` });
  } catch (e) {
    console.error("Failed to update grupo: ", e);
    res.status(500).json({ response: "Failed to update grupo" });
  }
};

export const deletarGrupo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id || req.body.id;

    const grupo = await GrupoModel.findByPk(id);

    if (grupo) {
      await grupo.destroy();
    } else {
      return res
        .status(404)
        .json({ response: "Grupo a ser deletado não encontrado" });
    }

    return res.status(200).json({ response: `Grupo ${id} deletado` });
  } catch (e) {
    console.error("Failed to delete grupo: ", e);
    res.status(500).json({ response: "Falha interna ao deletar grupo" });
  }
};
