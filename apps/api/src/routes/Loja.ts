import { Router } from "express";
import { getLojaEstoqueTotal, getLojas } from "../controllers/Loja";

const lojasRouter = Router();

lojasRouter.get("/", getLojas);
lojasRouter.get("/:lojaId", getLojaEstoqueTotal);


export default lojasRouter;
