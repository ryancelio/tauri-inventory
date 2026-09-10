import { AtributoTypesType } from "@tauri-inventory/types";
import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  BelongsToMany,
} from "sequelize-typescript";
import MercadoriaModel from "./Mercadoria";
import MercadoriaAtributosModel from "./MercadoriaAtributos";
import { DataTypes } from "sequelize";

@Table({
  tableName: "atributos",
  paranoid: true,
})
export default class AtributoModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.NUMBER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      async isUnique(this: AtributoModel, value: string) {
        const atributo = await AtributoModel.findOne({
          where: { nome: value },
        });
        if (atributo && atributo.id !== this.id) {
          throw new Error("O nome do atributo já está em uso.");
        }
      },
    },
  })
  declare nome: string;

  @AllowNull(false)
  @Column(DataTypes.ENUM("text", "number", "boolean"))
  declare tipo: AtributoTypesType;

  @BelongsToMany(() => MercadoriaModel, () => MercadoriaAtributosModel)
  declare mercadorias: MercadoriaModel[];
}
