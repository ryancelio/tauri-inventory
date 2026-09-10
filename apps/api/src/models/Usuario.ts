import { DataTypes } from "sequelize";
import sequelize from "../config/db";
import { AllowNull, Column, Model, Table } from "sequelize-typescript";
import { Funcao, Local } from "@tauri-inventory/types";

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

  @AllowNull(false)
  @Column(DataTypes.ENUM("02", "03", "04"))
  declare local: Local;

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

  @AllowNull(false)
  @Column(DataTypes.STRING)
  declare senhaHash: string;
}
