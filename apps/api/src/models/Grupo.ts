import { DataTypes, InstanceDestroyOptions } from "sequelize";
import sequelize from "../config/db";
import CategoriaModel from "./Categoria";
import {
  AfterDestroy,
  AllowNull,
  Column,
  ForeignKey,
  HasMany,
  HookOptions,
  Model,
  Table,
} from "sequelize-typescript";

@Table({
  tableName: "grupos",
  paranoid: true,
})
export default class GrupoModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.NUMBER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
    validate: {
      async isUnique(this: GrupoModel, value: string) {
        const atributo = await GrupoModel.findOne({
          where: { nome: value },
        });
        if (atributo && atributo.id !== this.id) {
          throw new Error("O nome do grupo já está em uso.");
        }
      },
    },
  })
  declare nome: string;

  @HasMany(() => CategoriaModel)
  declare categorias: CategoriaModel[];

  @AfterDestroy
  static async destroyCategoria(
    instance: CategoriaModel,
    options: InstanceDestroyOptions,
  ) {
    const id = instance.id;
    await CategoriaModel.destroy({
      where: { grupoId: id },
    });
  }
}
