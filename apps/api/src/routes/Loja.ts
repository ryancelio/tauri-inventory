import { Router } from "express";
import { createLoja, getLojaEstoqueTotal, getLojas } from "../controllers/Loja";
import { bodyParser } from "../middlewares/bodyParser";
import { createLojaSchema } from "../../../../packages/types/dist/database/Loja";
import { requiredRole } from "../middlewares/auth";

const lojasRouter = Router();

lojasRouter.get("/", getLojas);
lojasRouter.get("/:lojaId/estoque", getLojaEstoqueTotal);
lojasRouter.post(
  "/",
  requiredRole(["admin", "gerente"]),
  bodyParser(createLojaSchema),
  createLoja,
);

export default lojasRouter;
