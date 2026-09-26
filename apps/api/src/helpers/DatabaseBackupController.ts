import { NextFunction, Request, Response } from "express";
import {
  Atributo,
  Categoria,
  Fabricante,
  Grupo,
  Mercadoria,
  Usuario,
} from "../models/models";
import { Worker } from "worker_threads";
import { Op } from "sequelize";
import fs from "fs/promises";
import path from "path";
import MercadoriaModel from "../models/Mercadoria";
import AtributoModel from "../models/Atributo";
import CategoriaModel from "../models/Categoria";
import FabricanteModel from "../models/Fabricante";
import GrupoModel from "../models/Grupo";
import UsuarioModel from "../models/Usuario";
import MercadoriaAtributosModel from "../models/MercadoriaAtributos";
import { MercadoriaKey } from "../models/MercadoriaKeys";
import AuditLogModel from "../models/AuditLogs";

const BACKUP_PATH = path.join(__dirname, "..", "..", "backups");

export async function createIncrementalBackup(
  req: Request<{}, {}, { since: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const since = req.query.since;
    if (!since) {
      return res.status(400).json({ response: "Data desde faltando" });
    }
    const mercadorias = await Mercadoria.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });

    const atributos = await Atributo.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });

    const categorias = await Categoria.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });

    const fabricantes = await Fabricante.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });

    const grupos = await Grupo.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });
    const usuarios = await Usuario.findAll({
      where: { updatedAt: { [Op.gte]: since } },
    });

    // console.log(mercadorias);
    res.status(200).json({
      mercadorias,
      atributos,
      categorias,
      fabricantes,
      grupos,
      usuarios,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno do servidor" });
  }
}
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const BACKUP_FILE_PATH = path.join(BACKUP_PATH, "app_data_latest.sqlite");
const TEMPFILE_PATH = `${BACKUP_FILE_PATH}.tmp`;
let isGeneratingBackup = false;

async function getBackupStatus() {
  try {
    const stats = await fs.stat(BACKUP_FILE_PATH);
    const now = Date.now();
    const fileAgeMs = now - stats.mtimeMs;

    return {
      exists: true,
      isValid: fileAgeMs < CACHE_TTL_MS,
    };
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return { exists: false, isValid: false };
    }
    throw e;
  }
}
function runBackupWorker(
  tempFilePath: string,
  encKey: string,
  data: Record<string, unknown[]>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "backupWorker.js"), {
      workerData: { tempFilePath, encKey, data },
    });

    worker.once("message", (msg) => {
      if (msg.ok) resolve();
      else reject(new Error(msg.error));
    });
    worker.once("error", reject);
    worker.once("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Backup worker stopped with exit code ${code}`));
    });
  });
}

async function generateFullBackup() {
  try {
    await fs.unlink(TEMPFILE_PATH).catch(() => null);
    try {
      await fs.access(BACKUP_PATH);
    } catch {
      console.log("Folder doenst exist, creating...");
      await fs.mkdir(BACKUP_PATH, { recursive: true });
    }

    const mercadorias = await MercadoriaModel.findAll({ raw: true, paranoid: false });
    const mercadoriaKeys = await MercadoriaKey.findAll({ raw: true, paranoid: false });
    const atributos = await AtributoModel.findAll({ raw: true, paranoid: false });
    const mercadoriasAtributos = await MercadoriaAtributosModel.findAll({ raw: true, paranoid: false });
    const categorias = await CategoriaModel.findAll({ raw: true, paranoid: false });
    const fabricantes = await FabricanteModel.findAll({ raw: true, paranoid: false });
    const grupos = await GrupoModel.findAll({ raw: true, paranoid: false });
    // const mercPhotos = await MercadoriaPhotosModel.findAll({ raw: true, paranoid: false });
    const usuarios = await UsuarioModel.findAll({ raw: true, paranoid: false });
    const auditLogs = await AuditLogModel.findAll({raw: true, paranoid: false});

    console.log(auditLogs[0]);

    await runBackupWorker(TEMPFILE_PATH, "password4312", {
      mercadorias,
      mercadoriaKeys,
      atributos,
      mercadoriasAtributos,
      categorias,
      fabricantes,
      grupos,
      usuarios,
      auditLogs,
    });

    await fs.rename(TEMPFILE_PATH, BACKUP_FILE_PATH);
  } catch (e) {
    console.error("Erro na geração do SQLite:", e);
    throw e;
  }
}
export async function requestFullBackup(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const DEBUG_FORCE_NEW = true;
    const status = await getBackupStatus();

    // Backup cache expired
    if (!status.isValid || DEBUG_FORCE_NEW) {
      if (isGeneratingBackup) {
        while (isGeneratingBackup) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        }
      } else {
        isGeneratingBackup = true;
        // LOG
        console.log("Generating new FULL backup....");
        try {
          await generateFullBackup();
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          isGeneratingBackup = false;
        }
      }
    }

    res.download(BACKUP_FILE_PATH, `BACKUP_${Date.now()}.sqlite`);
  } catch (e) {
    console.error("Backup generation failed: ", e);
    res.status(500).json({ response: "Falha ao criar backup." });
  }
}
