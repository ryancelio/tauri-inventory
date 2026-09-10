import express from "express";
import cors from "cors";
import mercadoriaRouter from "./routes/Mercadoria";
import fabricanteRouter from "./routes/Fabricante";
import categoriaRouter from "./routes/Categoria";
import grupoRouter from "./routes/Grupo";
import { requiredRole, requiresAuth } from "./middlewares/auth";
import authRouter from "./routes/Auth";
import usuarioRouter from "./routes/Usuario";
import atributosRouter from "./routes/Atributo";
import {
  createIncrementalBackup,
  requestFullBackup,
} from "./helpers/DatabaseBackupController";
import mercPhotosRouter from "./routes/MercPhotos";
import path from "path";
import logsRouter from "./routes/Logs";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/mercadorias", requiresAuth, mercadoriaRouter);
app.use("/fabricantes", requiresAuth, fabricanteRouter);
app.use("/categorias", requiresAuth, categoriaRouter);
app.use("/grupos", requiresAuth, grupoRouter);
app.use("/usuarios", requiresAuth, usuarioRouter);
app.use("/atributos", requiresAuth, atributosRouter);
app.use("/logs", logsRouter);
app.get("/health", (req, res, next) => {
  res.status(200).json({ response: "Ok", timestamp: new Date().toISOString() });
});
app.get("/backup/download/full", requiresAuth, requestFullBackup);
app.get("/backup/download/incremental", createIncrementalBackup);

app.use(
  "/mercadorias-fotos",
  // requiresAuth,
  express.static(path.join(__dirname, "../upload/mercadorias/photos")),
);

app.use("/photos/mercadorias", mercPhotosRouter);

app.use("", authRouter);

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
