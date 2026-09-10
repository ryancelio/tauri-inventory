import { Router } from "express";
import {
  alterarCategoria,
  criarCategoria,
  deletarCategoria,
  deleteReassignCategoria,
  getCatMercCount,
  listarCategorias,
} from "../controllers/Categoria";

const router = Router();

router.post("/", criarCategoria);
router.get("/", listarCategorias);
router.put("/:id", alterarCategoria);
router.delete("/:id", deletarCategoria);
router.delete("/:oldCatId/reassign/:newCatId", deleteReassignCategoria);
router.get("/:id/mercadorias/count", getCatMercCount);

export default router;
