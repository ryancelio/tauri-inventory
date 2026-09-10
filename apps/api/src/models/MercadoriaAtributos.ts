import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import {
  AllowNull,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { AtributoTypesType } from "@tauri-inventory/types";
import AtributoModel from "./Atributo";
import MercadoriaModel from "./Mercadoria";

@Table({
  tableName: "Mercadoria_Atributos",
  paranoid: false,
  timestamps: false,
})
export default class MercadoriaAtributosModel extends Model {
  @ForeignKey(() => MercadoriaModel)
  @Column(DataType.INTEGER)
  declare mercadoriaId: number;

  @ForeignKey(() => AtributoModel)
  @Column(DataType.INTEGER)
  declare atributoId: number;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
  })
  declare valor: AtributoTypesType;
}
