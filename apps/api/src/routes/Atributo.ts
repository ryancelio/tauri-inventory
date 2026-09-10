import { Router } from "express";
import {
  alterarAtributo,
  criarAtributo,
  deletarAtributo,
  listarAtributos,
} from "../controllers/Atributo";

const router = Router();

router.get("/", listarAtributos);
router.post("/", criarAtributo);
router.put("/:id", alterarAtributo);
router.delete("/:id", deletarAtributo);

export default router;
