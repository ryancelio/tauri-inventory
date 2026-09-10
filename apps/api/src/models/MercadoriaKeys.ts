import { DataTypes } from "sequelize";
import {
  AllowNull,
  Column,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import KeyPhotosModel from "./KeyPhotos";
import Mercadoria from "./Mercadoria";

@Table({
  tableName: "MercadoriaKeys",
  paranoid: true,
  timestamps: false,
})
export class MercadoriaKey extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare key: number;

  @HasMany(() => Mercadoria)
  declare mercadorias: Mercadoria[];

  @HasMany(() => KeyPhotosModel)
  declare fotos: KeyPhotosModel[];
}
