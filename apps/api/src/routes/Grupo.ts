import { Router } from "express";
import {
  alterarGrupo,
  criarGrupo,
  deletarGrupo,
  listarGrupos,
} from "../controllers/Grupo";

const router = Router();

router.post("/", criarGrupo);
router.get("/", listarGrupos);
router.put("/:id", alterarGrupo);
router.delete("/:id", deletarGrupo);

export default router;
