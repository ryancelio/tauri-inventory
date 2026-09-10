import { DataTypes, InstanceDestroyOptions } from "sequelize";
import path from "path";
import fs from "fs/promises";
import {
  AfterDestroy,
  AllowNull,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import MercadoriaModel from "./Mercadoria";
import { getUploadFolder } from "../controllers/MercPhotos";

@Table({
  tableName: "mercadoriaPhotos",
  paranoid: true,
})
export default class MercadoriaPhotosModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.NUMBER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @AllowNull(false)
  @Column(DataTypes.STRING)
  declare url: string;

  @BelongsTo(() => MercadoriaModel)
  declare mercadoria: MercadoriaModel;

  @ForeignKey(() => MercadoriaModel)
  @AllowNull(false)
  @Column({
    type: DataTypes.NUMBER,
  })
  declare mercadoriaId: number;

  @AfterDestroy
  static async deletePhotoFile(
    instance: MercadoriaPhotosModel,
    options: InstanceDestroyOptions,
  ) {
    const mainPhotoPath = await getUploadFolder();

    const filePath = `${mainPhotoPath}/${instance.mercadoriaId}`;

    await deletePhotos(filePath, options, instance.url);
  }
}

export async function deletePhotos(
  filePath: string,
  options: InstanceDestroyOptions,
  fileName: string,
) {
  const originalPath = `${filePath}/${fileName}`;
  const thumbPath = `${filePath}/thumb/${fileName}`;

  const deleteFilesFromDisk = async () => {
    try {
      await fs.rm(originalPath, { force: true });
      await fs.rm(thumbPath, { force: true });
    } catch (e) {
      console.error(e);
    }
  };

  if (options.transaction) {
    options.transaction.afterCommit(() => {
      deleteFilesFromDisk();
    });
  } else {
    await deleteFilesFromDisk();
  }
}
