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
import MercadoriaModel from "./models/Mercadoria";
import { Sequelize } from "sequelize-typescript";
import lojasRouter from "./routes/Loja";

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
app.use("/lojas", lojasRouter);

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

app.use("/test", async (req, res) => {
  return res.status(202).json(
    await MercadoriaModel.findAndCountAll({
      limit: 50,
      include: [
        { association: "fabricante" },
        {
          association: "categoria",
          include: ["grupo"],
        },
        {
          association: "caracteristicas",
          attributes: ["id", "nome", "tipo"],
          through: { attributes: ["valor"] },
        },
        {
          association: "estoque",
          include:[{association: "loja"}]
        }
      ],
      attributes: { exclude: ["grupoId", "categoriaId", "fabricanteId"] },
    })
  );
});
const PORT = 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at port ${PORT}`);
});
