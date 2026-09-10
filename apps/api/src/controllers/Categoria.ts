import { Request, Response, NextFunction } from "express";
import { Categoria } from "../models/models";
import { ICategoria } from "@tauri-inventory/types";
import { ApiResponse, ApiListResponse } from "@tauri-inventory/types";
import { BaseQuery } from "@tauri-inventory/types";
import {
  buildWhereClause,
  getAdditionalFilters,
} from "../config/utils/whereBuilder";
import { Order, ValidationError } from "sequelize";
import CategoriaModel from "../models/Categoria";
import sequelize from "../config/db";
import MercadoriaModel from "../models/Mercadoria";

export const criarCategoria = async (
  req: Request<{}, {}, ICategoria>,
  res: Response<ApiResponse | ICategoria>,
  next: NextFunction,
) => {
  try {
    const categoria = req.body;
    await Categoria.create(categoria as any);

    res.status(201).json({ response: "Categoria criada com sucesso!" });
  } catch (e: unknown) {
    console.error("Failed to create categoria:", e);

    let error = "Erro desconhecido ao criar categoria";
    let status = 500;

    if (e instanceof ValidationError) {
      const validationError = e.errors[0];

      if (validationError?.validatorKey === "isUnique") {
        if (validationError.path === "nome") {
          error =
            "Erro ao criar categoria, já existe uma categoria com o mesmo nome.";
          status = 400;
        }
      } else if (validationError?.message === "PRIMARY must be unique") {
        error =
          "Erro ao criar categoria, já existe uma categoria com o mesmo ID.";
        status = 400;
      }
    }

    res.status(status).json({ response: error });
  }
};

// export const listarCategoriasFiltrado = async (
//   req: Request<{}, {}, BaseQuery<ICategoria>>,
//   res: Response<ApiResponse | ApiListResponse<ICategoria>>,
//   next: NextFunction,
// ) => {
//   try {
//     const query = req.body;

//     if (!query || Object.keys(query).length === 0) {
//       const { rows, count } = await Categoria.findAndCountAll({
//         limit: 50,
//         raw: true,
//       });
//       return res.json({ data: rows as unknown as ICategoria[], count: count });
//     }

//     const where = buildWhereClause(query);

//     const { limit, offset, order } = getAdditionalFilters(query);

//     const { rows, count } = await Categoria.findAndCountAll({
//       where,
//       limit,
//       offset,
//       order: order as Order,
//       raw: true,
//     });

//     res
//       .status(200)
//       .json({ data: rows as unknown as ICategoria[], count: count });
//   } catch (e) {
//     console.error("Failed to list categorias: ", e);
//     res.status(500).json({ response: "Failed to list categorias" });
//   }
// };

export const listarCategorias = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categorias = await Categoria.findAll({
      include: {
        association: "grupo",
      },
      raw: true,
      nest: true,
      attributes: { exclude: ["grupoId"] },
    });
    res.status(200).json(categorias);
  } catch (e) {
    res.status(500).json({ response: "Failed to list categorias" });
  }
};

export const obterCategoria = async (
  req: Request<{ id: string }>,
  res: Response<ApiResponse | ICategoria>,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const categoria = await Categoria.findByPk(id, { raw: true });

    if (!categoria) {
      return res.status(404).json({ response: "Categoria not found" });
    }

    res.status(200).json(categoria as unknown as ICategoria);
  } catch (e) {
    console.error("Failed to get categoria: ", e);
    res.status(500).json({ response: "Failed to get categoria" });
  }
};

export const alterarCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id || req.body.id;
    const categoria = req.body;

    const [affectedRows] = await Categoria.update(categoria, {
      where: { id: id },
    });

    if (affectedRows < 1) {
      return res
        .status(404)
        .json({ response: "Categoria to be updated not found" });
    }
    return res.status(200).json({ response: `Categoria ${id} atualizada` });
  } catch (e) {
    console.error("Falha ao atualizar categoria: ", e);
    res.status(500).json({ response: "Falha ao atualizar categoria" });
  }
};

export const deletarCategoria = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id || req.body.id;
    const categoria = await Categoria.findByPk(id);
    if (!categoria) {
      return res
        .status(404)
        .json({ response: "Categoria a ser deletada nao encontrada" });
    }

    await categoria.destroy();

    return res.status(200).json({ response: `Categoria ${id} deleted` });
  } catch (e) {
    console.error("Failed to delete categoria: ", e);
    res.status(500).json({ response: "Failed to delete categoria" });
  }
};

// DELETE categorias/:oldCatId/reassign/:newCatId
export const deleteReassignCategoria = async (
  req: Request<{ oldCatId: string; newCatId: string }>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const t = await sequelize.transaction();
  try {
    const { oldCatId, newCatId } = req.params;

    const oldCategoria = await CategoriaModel.findByPk(oldCatId, {
      transaction: t,
    });
    if (!oldCategoria) {
      return res
        .status(404)
        .json({ response: "Categoria para ser deletada nao encontrada." });
    }

    const newCategoria = await CategoriaModel.findByPk(newCatId, {
      transaction: t,
    });
    if (!newCategoria) {
      return res
        .status(400)
        .json({ response: "Categoria para ser atribuida nao encontrada." });
    }

    await MercadoriaModel.update(
      { categoriaId: newCategoria.get("id") },
      { where: { categoriaId: oldCategoria.get("id") }, transaction: t },
    );

    await oldCategoria.destroy();

    await t.commit();
    res.status(200).json({
      response: `Categoria ${oldCategoria.get("nome")} deletada, mercadorias passadas para ${newCategoria.get("nome")}`,
    });
  } catch (e) {
    console.error(e);
    t.rollback();

    res.status(500).json({ response: "Erro interno." });
  }
};

// GET /categorias/:id/mercadorias/count
export const getCatMercCount = async (
  req: Request<{ id: string }>,
  res: Response<number | ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const count = await MercadoriaModel.count({ where: { categoriaId: id } });

    res.status(200).json(count);
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno." });
  }
};
