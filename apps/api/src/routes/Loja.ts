import { Router } from "express";
import { getLojas } from "../controllers/Loja";

const lojasRouter = Router();

lojasRouter.get("/", getLojas);


export default lojasRouter;
