import { Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import Estoque from "./Estoque";

@Table({ tableName: "Lojas", paranoid: true})
export default class LojasModel extends Model{
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare nome: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare CNPJ: string;

  @HasMany(() => Estoque)
  declare estoques: Estoque[]

}
