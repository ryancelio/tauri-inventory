import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { AllowNull, BelongsTo, Column, ForeignKey, Model, Table } from "sequelize-typescript";
import { Funcao, ILoja } from "@tauri-inventory/types";
import LojasModel from "./Lojas";

@Table({
  tableName: "usuarios",
  paranoid: true,
})
export default class UsuarioModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @AllowNull(false)
  @Column(DataTypes.STRING)
  declare nome: string;

  @AllowNull(false)
  @Column(DataTypes.ENUM("vendedor", "gerente", "admin"))
  declare funcao: Funcao;

  @ForeignKey(() => LojasModel)
  @Column({type: DataTypes.INTEGER, allowNull: false})
  declare lojaId: number;

  @BelongsTo(() => LojasModel)
  declare local: LojasModel;

  @AllowNull(false)
  @Column({
    type: DataTypes.STRING,
    validate: {
      async isUnique(this: UsuarioModel, value: string) {
        const usuario = await UsuarioModel.findOne({
          where: { usuario: value },
        });
        if (usuario && usuario.id !== this.id) {
          throw new Error("O usuário já está em uso.");
        }
      },
    },
  })
  declare usuario: string;

  @Column({
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare ativo: boolean;

  @AllowNull(false)
  @Column(DataTypes.STRING)
  declare senhaHash: string;
}
