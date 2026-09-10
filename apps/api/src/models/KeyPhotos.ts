import {
  AfterDestroy,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { MercadoriaKey } from "./MercadoriaKeys";
import { InstanceDestroyOptions } from "sequelize";
import { getUploadFolder } from "../controllers/MercPhotos";
import MercadoriaPhotosModel, { deletePhotos } from "./MercadoriaPhotos";

@Table({
  tableName: "KeyPhotos",
  paranoid: true,
})
export default class KeyPhotosModel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => MercadoriaKey)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare key: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare url: string;

  @BelongsTo(() => MercadoriaKey)
  declare mercadoriaKey: MercadoriaKey;

  @AfterDestroy
  static async deletePhotoFile(
    instance: KeyPhotosModel,
    options: InstanceDestroyOptions,
  ) {
    const mainPhotoPath = await getUploadFolder();

    const filePath = `${mainPhotoPath}/key/${instance.key}`;

    await deletePhotos(filePath, options, instance.url);
  }
}
