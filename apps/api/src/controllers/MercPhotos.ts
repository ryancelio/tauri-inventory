import { NextFunction, Request, response, Response } from "express";
import { IMercadoriaPhotos } from "@tauri-inventory/types";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { CreationAttributes } from "sequelize";
import KeyPhotosModel from "../models/KeyPhotos";
import { KeyPhoto, MercadoriaPhoto } from "../models/models";

// TODO
// PROD FILE PATH
export async function getUploadFolder() {
  const mainPath = path.join(__dirname, "../../upload/mercadorias/photos");

  await fs.mkdir(mainPath, { recursive: true });

  return mainPath;
}

/**
 *
 * @param files Array of files to be created
 *  @param options Object containing the filepath to the folder where the photo will be saved, unique identifier for the owner of the photo
 *  and the callback to be executed after each photo creation
 */
async function createPhotos(
  files: Express.Multer.File[],
  options: {
    filePath: string;
    identifier: string | number;
    callback: (filename: string) => Promise<void>;
  },
) {
  await fs.mkdir(path.join(options.filePath, "thumb"), {
    recursive: true,
  });
  for (const file of files) {
    const filename = `${options.identifier}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Fullsize optmized
    await sharp(file.buffer)
      .resize({
        width: 1920,
        height: 1080,
        fit: "inside",
        withoutEnlargement: true,
      })
      .toFormat("webp", { quality: 80 })
      .toFile(`${options.filePath}/${filename}.webp`);

    // Thumb
    await sharp(file.buffer)
      .resize({ width: 150, height: 150, fit: "cover" })
      .toFormat("webp", { quality: 75 })
      .toFile(`${options.filePath}/thumb/${filename}.webp`);

    await options.callback(filename);
  }
}
// POST /photos/mercadorias/:id
export async function persistMercPhoto(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("Changing id================");

    const mainPhotoPath = await getUploadFolder();

    const mercadoriaId = Number(req.params.id);

    if (!mercadoriaId || isNaN(mercadoriaId)) {
      throw new Error("Id da mercadoria inválido");
    }

    const filePath = `${mainPhotoPath}/${mercadoriaId}`;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ response: "Nenhuma imagem enviada." });
    }

    const files = req.files as Express.Multer.File[];

    await createPhotos(files, {
      filePath: filePath,
      identifier: mercadoriaId,
      callback: async (filename: string) => {
        const payload: Partial<IMercadoriaPhotos> = {
          url: `${filename}.webp`,
          mercadoriaId: mercadoriaId,
        };
        await MercadoriaPhoto.create(payload);
      },
    });

    res.status(200).json({ response: "Foto salva com sucesso" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno do servidor" });
  }
}

// POST /photos/mercadorias/key/:key
export async function persistKeyPhoto(
  req: Request<{ key: string }, {}, {}>,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("Changing key================");

    const mainPhotoPath = await getUploadFolder();

    const mercadoriaKey = Number(req.params.key);

    if (!mercadoriaKey || isNaN(mercadoriaKey)) {
      throw new Error("Key da mercadoria inválido");
    }

    const filePath = `${mainPhotoPath}/key/${mercadoriaKey}`;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ response: "Nenhuma imagem enviada." });
    }

    const files = req.files as Express.Multer.File[];

    await createPhotos(files, {
      filePath: filePath,
      identifier: mercadoriaKey,
      callback: async (filename: string) => {
        const payload: CreationAttributes<KeyPhotosModel> = {
          url: `${filename}.webp`,
          key: mercadoriaKey,
        };
        await KeyPhotosModel.create(payload);
      },
    });
    res.status(200).json({ response: "Foto salva com sucesso" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ response: "Erro interno ao salvar fotos" });
  }
}

export async function getMercPhotoList(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { mercId } = req.params;

    if (!mercId) {
      return res.status(400).json({ response: "Id da mercadoria ausente." });
    }

    const photos = await MercadoriaPhoto.findAll({
      where: { mercadoriaId: mercId },
      attributes: ["id", "url"],
      raw: true,
    });

    res.status(200).json(photos);
  } catch (e) {
    console.error(`Erro ao listar fotos de mercadorias: ${e}`);
    res.status(500).json({ response: "Erro ao listar fotos." });
  }
}

export async function getKeyPhotoList(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { key } = req.params;
    if (!key) {
      return res.status(400).json({ response: "Key da mercadoria ausente." });
    }

    const photos = await KeyPhotosModel.findAll({
      where: { key: key },
      attributes: ["id", "url"],
      raw: true,
    });
    res.status(200).json(photos);
  } catch (e) {
    console.error(`Erro ao listar fotos de mercadorias: ${e}`);
    res.status(500).json({ response: "Erro ao listar fotos." });
  }
}

export async function deleteMercPhoto(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id as string;

    const photoInfo = await MercadoriaPhoto.findByPk(id);

    if (!photoInfo) {
      return res.status(400).json({ response: "Foto nao encontrada." });
    }

    await photoInfo.destroy();

    res.status(200).json({ response: "Imagem apagada com sucesso." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno no servidor." });
  }
}

export async function deleteKeyPhoto(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.params.id;

    const keyPhotoInstance = await KeyPhoto.findByPk(id);

    if (!keyPhotoInstance) {
      return res.status(400).json({ response: "Foto nao encontrada." });
    }

    await keyPhotoInstance.destroy();

    res.status(200).json({ response: "Imagem apagada com sucesso." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ response: "Erro interno no servidor." });
  }
}
