import { NextFunction, Request, Response } from "express";
import {
  Atributo,
  Categoria,
  Fabricante,
  Grupo,
  Mercadoria,
  Usuario,
} from "../models/models";
import { Op } from "sequelize";
import fs from "fs/promises";
import path from "path";
import { open } from "sqlite";
import sqlcipher from "@journeyapps/sqlcipher";
import MercadoriaModel from "../models/Mercadoria";
import sqliteCreateTable from "./SqliteTablesStrings";
import AtributoModel from "../models/Atributo";
import {
  CategoriaDB,
  CategoriaUpdate,
  FabricanteDB,
  GrupoDB,
  IAtributo,
  IAtributoDB,
  IFabricante,
  IGrupo,
  IMercadoriaPhotos,
  IUsuario,
  MercadoriaDB,
  MercadoriaPhotosListing,
} from "@tauri-inventory/types";
import CategoriaModel from "../models/Categoria";
import FabricanteModel from "../models/Fabricante";
import GrupoModel from "../models/Grupo";
import MercadoriaPhotosModel from "../models/MercadoriaPhotos";
import UsuarioModel from "../models/Usuario";
import MercadoriaAtributosModel from "../models/MercadoriaAtributos";
import { UsuarioDB } from "@tauri-inventory/types";
import { MercadoriaKey } from "../models/MercadoriaKeys";

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

async function generateFullBackup() {
  try {
    await fs.unlink(TEMPFILE_PATH).catch(() => null);
    try {
      await fs.access(BACKUP_PATH);
      // OK
    } catch {
      // DOESNT EXIST
      console.log("Folder doenst exist, creating...");
      await fs.mkdir(BACKUP_PATH, { recursive: true });
    }

    await fs.writeFile(TEMPFILE_PATH, "");

    // const sqliteDb = new Database(TEMPFILE_PATH);
    const sqliteDb = await open({
      filename: TEMPFILE_PATH,
      driver: sqlcipher.Database,
    });
    // TODO: SECURE PASS
    const ENC_DB_KEY = "password4312";
    await sqliteDb.run(`PRAGMA key = "${ENC_DB_KEY}"`);
    await sqliteDb.run("PRAGMA journal_mode = WAL");
    await sqliteDb.run("PRAGMA synchronous = OFF");

    const safeValue = (val: any) => {
      if (val === undefined) return null;
      if (val instanceof Date) return val.toISOString();
      if (typeof val === "object" && val !== null && !Buffer.isBuffer(val)) {
        return JSON.stringify(val);
      }
      return val;
    };

    await sqliteDb.exec(sqliteCreateTable.mercadoria.create);
    await sqliteDb.exec(sqliteCreateTable.mercadoriaKey.create);
    await sqliteDb.exec(sqliteCreateTable.atributos.create);
    await sqliteDb.exec(sqliteCreateTable.mercadoriaAtributos.create);
    await sqliteDb.exec(sqliteCreateTable.categoria.create);
    await sqliteDb.exec(sqliteCreateTable.fabricante.create);
    await sqliteDb.exec(sqliteCreateTable.grupos.create);
    await sqliteDb.exec(sqliteCreateTable.mercPhotos.create);
    await sqliteDb.exec(sqliteCreateTable.usuarios.create);

    // WARNING - LARGE DATASETS MAY NEED PAGINATION
    const mercadorias = (await MercadoriaModel.findAll({
      raw: true,
    })) as unknown as MercadoriaDB[];

    const mercadoriaKeys = await MercadoriaKey.findAll({ raw: true });

    const atributos = (await AtributoModel.findAll({
      raw: true,
    })) as unknown as IAtributoDB[];

    const mercadoriasAtributos = await MercadoriaAtributosModel.findAll({
      raw: true,
    });

    const categorias = (await CategoriaModel.findAll({
      raw: true,
    })) as unknown as CategoriaDB[];
    const fabricantes = (await FabricanteModel.findAll({
      raw: true,
    })) as unknown as FabricanteDB[];

    const grupos = (await GrupoModel.findAll({
      raw: true,
    })) as unknown as GrupoDB[];

    const mercPhotos = (await MercadoriaPhotosModel.findAll({
      raw: true,
    })) as unknown as IMercadoriaPhotos[];

    const usuarios = (await UsuarioModel.findAll({
      raw: true,
    })) as unknown as UsuarioDB[];

    await sqliteDb.run("BEGIN TRANSACTION");

    let insertMercadoria;
    let insertMercadoriaKey;
    let insertAtributos;
    let insertMercadoriaAtributos;
    let insertCategorias;
    let insertFabricantes;
    let insertGrupos;
    let insertMercPhotos;
    let insertUsuarios;

    try {
      insertMercadoria = await sqliteDb.prepare(
        sqliteCreateTable.mercadoria.insert,
      );
      insertMercadoriaKey = await sqliteDb.prepare(
        sqliteCreateTable.mercadoriaKey.insert,
      );
      insertAtributos = await sqliteDb.prepare(
        sqliteCreateTable.atributos.insert,
      );
      insertMercadoriaAtributos = await sqliteDb.prepare(
        sqliteCreateTable.mercadoriaAtributos.insert,
      );
      insertCategorias = await sqliteDb.prepare(
        sqliteCreateTable.categoria.insert,
      );
      insertFabricantes = await sqliteDb.prepare(
        sqliteCreateTable.fabricante.insert,
      );
      insertGrupos = await sqliteDb.prepare(sqliteCreateTable.grupos.insert);
      insertMercPhotos = await sqliteDb.prepare(
        sqliteCreateTable.mercPhotos.insert,
      );
      insertUsuarios = await sqliteDb.prepare(
        sqliteCreateTable.usuarios.insert,
      );

      for (const mercadoria of mercadorias) {
        await insertMercadoria.run(
          safeValue(mercadoria.id),
          safeValue(mercadoria.key),
          safeValue(mercadoria.descricao),
          safeValue(mercadoria.precoCusto),
          safeValue(mercadoria.precoVenda),
          safeValue(mercadoria.estoque02),
          safeValue(mercadoria.estoque03),
          safeValue(mercadoria.estoque04),
          safeValue(mercadoria.observacoes),
          safeValue(mercadoria.fabricanteId),
          safeValue(mercadoria.categoriaId),
          safeValue(mercadoria.createdAt),
          safeValue(mercadoria.updatedAt),
          safeValue(mercadoria.deletedAt),
        );
      }

      for (const key of mercadoriaKeys) {
        await insertMercadoriaKey.run(safeValue(key.key));
      }

      for (const atributo of atributos) {
        await insertAtributos.run(
          safeValue(atributo.id),
          safeValue(atributo.nome),
          safeValue(atributo.tipo),
          safeValue(atributo.createdAt),
          safeValue(atributo.updatedAt),
          safeValue(atributo.deletedAt),
        );
      }
      for (const caracteristica of mercadoriasAtributos) {
        await insertMercadoriaAtributos.run(
          safeValue(caracteristica.valor),
          safeValue(caracteristica.mercadoriaId),
          safeValue(caracteristica.atributoId),
        );
      }
      for (const categoria of categorias) {
        await insertCategorias.run(
          safeValue(categoria.id),
          safeValue(categoria.nome),
          safeValue(categoria.grupoId),
          safeValue(categoria.createdAt),
          safeValue(categoria.updatedAt),
          safeValue(categoria.deletedAt),
        );
      }
      for (const mercPhoto of mercPhotos) {
        await insertMercPhotos.run(
          safeValue(mercPhoto.id),
          safeValue(mercPhoto.url),
          safeValue(mercPhoto.mercadoriaId),
          safeValue(mercPhoto.createdAt),
          safeValue(mercPhoto.updatedAt),
          safeValue(mercPhoto.deletedAt),
        );
      }
      for (const usuario of usuarios) {
        await insertUsuarios.run(
          safeValue(usuario.id),
          safeValue(usuario.nome),
          safeValue(usuario.funcao),
          safeValue(usuario.usuario),
          safeValue(usuario.senhaHash),
          safeValue(usuario.local),
          safeValue(usuario.createdAt),
          safeValue(usuario.updatedAt),
          safeValue(usuario.deletedAt),
        );
      }

      for (const fabricante of fabricantes) {
        await insertFabricantes.run(
          safeValue(fabricante.id),
          safeValue(fabricante.nome),
          safeValue(fabricante.createdAt),
          safeValue(fabricante.updatedAt),
          safeValue(fabricante.deletedAt),
        );
      }
      for (const grupo of grupos) {
        await insertGrupos.run(
          safeValue(grupo.id),
          safeValue(grupo.nome),
          safeValue(grupo.createdAt),
          safeValue(grupo.updatedAt),
          safeValue(grupo.deletedAt),
        );
      }

      await sqliteDb.run("COMMIT");
    } catch (e) {
      console.error("Error during database creation, rolling back..", e);
      await sqliteDb.run("ROLLBACK");
      throw e;
    } finally {
      await Promise.allSettled([
        insertMercadoria?.finalize(),
        insertMercadoriaKey?.finalize(),
        insertMercadoriaAtributos?.finalize(),
        insertAtributos?.finalize(),
        insertCategorias?.finalize(),
        insertFabricantes?.finalize(),
        insertGrupos?.finalize(),
        insertMercPhotos?.finalize(),
        insertUsuarios?.finalize(),
      ]);

      await sqliteDb.close();
    }

    await fs.rename(TEMPFILE_PATH, BACKUP_FILE_PATH);
  } catch (e) {
    // await fs.unlink(TEMPFILE_PATH);
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
