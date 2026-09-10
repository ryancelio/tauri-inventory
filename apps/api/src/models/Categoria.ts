import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import {
  AllowNull,
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import GrupoModel from "./Grupo";

@Table({
  tableName: "categoria",
  paranoid: true,
})
export default class CategoriaModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
    validate: {
      async isUnique(this: CategoriaModel, value: string) {
        const categoria = await CategoriaModel.findOne({
          where: { nome: value },
        });
        if (categoria && categoria.id !== this.id) {
          throw new Error("O nome da categoria já está em uso.");
        }
      },
    },
  })
  declare nome: string;

  @AllowNull(false)
  @ForeignKey(() => GrupoModel)
  @Column(DataTypes.INTEGER)
  declare grupoId: number;

  @BelongsTo(() => GrupoModel)
  declare grupo: GrupoModel;
}

// const CategoriaModel = sequelize.define(
//   "categoria",
//   {
//     nome: {
//       type: DataTypes.STRING(255),
//       allowNull: false,
//       validate: {

//       },
//     },
//     grupoId: {
//       type: DataTypes.NUMBER,
//       allowNull: false,
//     },
//   },
//   {
//     paranoid: true,
//   },
// );

// export default CategoriaModel;
