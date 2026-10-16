import { Router } from "express";
import { createLoja, getLojaEstoqueTotal, getLojas } from "../controllers/Loja";
import { bodyParser } from "../middlewares/bodyParser";
import { createLojaSchema } from "../../../../packages/types/dist/database/Loja";

const lojasRouter = Router();

lojasRouter.get("/", getLojas);
lojasRouter.get("/:lojaId", getLojaEstoqueTotal);
lojasRouter.post("/", bodyParser(createLojaSchema),createLoja,);


export default lojasRouter;
