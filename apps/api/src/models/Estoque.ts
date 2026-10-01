import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import MercadoriaModel from "./Mercadoria";
import LojasModel from "./Lojas";
import { Mercadoria } from "./models";

@Table({
  tableName: "Estoque",
  paranoid: true,
})
export default class EstoqueModel extends Model{

  @ForeignKey(() => MercadoriaModel)
  @Column(DataType.INTEGER)
  declare mercadoriaId: number;

  @ForeignKey(() => LojasModel)
  @Column(DataType.INTEGER)
  declare lojaId: number;

  @Column(DataType.INTEGER)
  declare estoque: number;

  @BelongsTo(() => LojasModel)
  declare loja: LojasModel;

  @BelongsTo(() => Mercadoria)
  declare mercadoria: Mercadoria;

}
