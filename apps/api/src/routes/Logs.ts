import { Router } from "express";
import {
  getAllLogs,
  getFabricanteLogs,
  getMercLogs,
  getUserLogs,
} from "../controllers/Logs";

const logsRouter = Router();

logsRouter.get("/all", getAllLogs);
logsRouter.get("/mercadoria/:id", getMercLogs);
logsRouter.get("/usuario/:userIdTarget", getUserLogs);
logsRouter.get("/fabricante/:fabricanteId", getFabricanteLogs);

export default logsRouter;
