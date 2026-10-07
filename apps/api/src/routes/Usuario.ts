import { Router } from "express";
import {
  alterarUsuario,
  criarUsuario,
  desativarUsuario,
  listarUsuarios,
} from "../controllers/Usuarios";
import { requiredRole } from "../middlewares/auth";

const router = Router();

router.get("/", listarUsuarios);
router.post("/", requiredRole(["admin", "gerente"]), criarUsuario);
router.put("/:id", requiredRole(["admin", "gerente"]), alterarUsuario);
router.delete("/:id", requiredRole(["admin", "gerente"]), desativarUsuario);

export default router;
