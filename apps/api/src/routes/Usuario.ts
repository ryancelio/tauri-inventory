import { Router } from "express";
import {
  alterarUsuario,
  criarUsuario,
  deletarUsuario,
  listarUsuarios,
} from "../controllers/Usuarios";
import { requiredRole } from "../middlewares/auth";

const router = Router();

router.get("/", listarUsuarios);
router.post("/", requiredRole(["admin", "gerente"]), criarUsuario);
router.put("/:id", requiredRole(["admin", "gerente"]), alterarUsuario);
router.delete("/:id", requiredRole(["admin", "gerente"]), deletarUsuario);

export default router;
