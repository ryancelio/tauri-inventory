import { Router } from "express";
import {
  alterarMercadoria,
  criarMercadoria,
  deletarMercadoria,
  getAllSimilarMercs,
  listarMercadoriaKey,
  listarMercadorias,
  listarMercadoriasSimple,
  listarMercadoriasSimpleLog,
  obterMercadoria,
  relatorioMercadorias,
  // updateAllSimilarMercs,
  updateSimilarMercsByIdList,
} from "../controllers/Mercadoria";
import { requiredRole } from "../middlewares/auth";
import { bodyParser } from "../middlewares/bodyParser";
import { criarMercadoriaSchema, updateMercadoriaSchema } from "@tauri-inventory/types";

const router = Router();

router.post("/", requiredRole(["gerente", "admin"]),bodyParser(criarMercadoriaSchema), criarMercadoria);
router.get("/", listarMercadorias);
router.get("/relatorio", relatorioMercadorias);
router.get("/simple/", listarMercadoriasSimple);
router.get("/simple/log", listarMercadoriasSimpleLog);
router.get("/:id", obterMercadoria);
router.get("/keys/listing", listarMercadoriaKey);
router.put("/:id", requiredRole(["gerente", "admin"])
,bodyParser(updateMercadoriaSchema)
, alterarMercadoria);
router.delete(
  "/:id",

  requiredRole(["gerente", "admin"]),
  deletarMercadoria,
);
router.get(
  "/similar/:key",

  requiredRole(["gerente", "admin"]),
  getAllSimilarMercs,
);

router.put(
  "/similar/:key",
  requiredRole(["gerente", "admin"]),
  updateSimilarMercsByIdList,
);
// router.put(
//   "/similar/all/:key",
//   requiredRole(["gerente", "admin"]),
//   updateAllSimilarMercs,
// );

export default router;
