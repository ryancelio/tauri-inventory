import { Router } from "express";
import {
  criarFabricante,
  listarFabricantes,
  alterarFabricante,
  deletarFabricante,
  obterContagemMercadorias,
  reassignFabricante,
  cascadeFabDelete,
} from "../controllers/Fabricante";

const router = Router();

router.post("/", criarFabricante);
router.get("/", listarFabricantes);
router.get("/:id/mercadorias/count", obterContagemMercadorias);
router.delete("/:oldFabId/reassign/:newFabId", reassignFabricante);
router.delete("/:id/cascade", cascadeFabDelete);
router.put("/:id", alterarFabricante);
router.delete("/:id", deletarFabricante);

export default router;
