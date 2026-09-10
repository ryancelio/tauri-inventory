import {
  Table,
  Column,
  Model,
  DataType,
  AllowNull,
  Default,
  AfterDestroy,
  BelongsTo,
  BelongsToMany,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
} from "sequelize-typescript";
import MercadoriaPhotosModel from "./MercadoriaPhotos";
import FabricanteModel from "./Fabricante";
import AtributoModel from "./Atributo";
import MercadoriaAtributosModel from "./MercadoriaAtributos";
import {
  BelongsToManyAddAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  DataTypes,
  InstanceDestroyOptions,
  NonAttribute,
} from "sequelize";
import Atributo from "./Atributo";
import CategoriaModel from "./Categoria";
import { MercadoriaKey } from "./MercadoriaKeys";

@Table({
  tableName: "mercadorias",
  paranoid: true,
})
export default class MercadoriaModel extends Model {
  @AllowNull(false)
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  // @AllowNull(false)
  // @Column(DataType.INTEGER)
  // declare key: number;

  @ForeignKey(() => MercadoriaKey)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare key: number;

  @BelongsTo(() => MercadoriaKey)
  declare mercadoriaKey: MercadoriaKey;

  @AllowNull(false)
  @Column(DataType.STRING(75))
  declare descricao: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare precoCusto: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.DECIMAL(10, 2))
  declare precoVenda: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare estoque02: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare estoque03: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare estoque04: number;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare observacoes: string | null;

  @ForeignKey(() => FabricanteModel)
  @AllowNull(false)
  @Column(DataTypes.INTEGER)
  declare fabricanteId: number;

  @BelongsTo(() => FabricanteModel)
  declare fabricante: FabricanteModel;

  @ForeignKey(() => CategoriaModel)
  @AllowNull(false)
  @Column(DataTypes.INTEGER)
  declare categoriaId: number;

  @BelongsTo(() => CategoriaModel)
  declare categoria: CategoriaModel;

  @BelongsToMany(() => AtributoModel, () => MercadoriaAtributosModel)
  declare caracteristicas: AtributoModel[];

  // Tipa o método addAtributo (Aceita uma instância de Atributo ou o ID, e opções extras)
  declare addAtributo: BelongsToManyAddAssociationMixin<Atributo, number>;

  // Tipa o método getAtributos (opcional, mas bom ter)
  declare getAtributos: BelongsToManyGetAssociationsMixin<Atributo>;

  // Propriedade virtual para quando você fizer query com "include"
  declare Atributos?: NonAttribute<Atributo[]>;

  // -----------------------------------------------------------
  // Hooks
  // -----------------------------------------------------------
  @AfterDestroy
  static async cleanupPhotos(
    instance: MercadoriaModel,
    options: InstanceDestroyOptions,
  ) {
    await MercadoriaPhotosModel.destroy({
      // No sequelize-typescript, você acessa a propriedade diretamente via 'instance.id'
      // em vez de usar instance.get("id")
      where: { mercadoriaId: instance.id },
      individualHooks: true,
      transaction: options?.transaction,
    });
  }
}
