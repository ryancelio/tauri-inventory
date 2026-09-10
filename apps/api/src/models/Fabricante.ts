import { DataTypes, InferAttributes, InferCreationAttributes } from "sequelize";
import sequelize from "../config/db";
import {
  AllowNull,
  Column,
  HasMany,
  Model,
  Table,
  Validate,
} from "sequelize-typescript";
import MercadoriaModel from "./Mercadoria";

@Table({
  tableName: "fabricantes",
  paranoid: true,
})
export default class FabricanteModel extends Model<
  InferAttributes<FabricanteModel>,
  InferCreationAttributes<FabricanteModel>
> {
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
      async isUnique(this: FabricanteModel, value: string) {
        const fabricante = await FabricanteModel.findOne({
          where: { nome: value },
        });
        if (fabricante && fabricante.id !== this.id) {
          throw new Error("O nome do fabricante já está em uso.");
        }
      },
    },
  })
  declare nome: string;

  @HasMany(() => MercadoriaModel)
  declare mercadorias: MercadoriaModel;
}

// const FabricanteModel = sequelize.define(
//   "fabricante",
//   {
//     nome: {
//       type: DataTypes.STRING(50),
//       allowNull: false,
//       validate: {
//         async isUnique(this: any, value: string) {
//           const fabricante = await FabricanteModel.findOne({
//             where: { nome: value },
//           });
//           if (
//             fabricante &&
//             fabricante.getDataValue("id") !== this.getDataValue("id")
//           ) {
//             throw new Error("O nome do fabricante já está em uso.");
//           }
//         },
//       },
//     },
//   },
//   {
//     paranoid: true,
//   },
// );

// export default FabricanteModel;
