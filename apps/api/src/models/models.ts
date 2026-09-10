// import MercadoriaModel from "./Mercadoria";
// import FabricanteModel from "./Fabricante";
// import GrupoModel from "./Grupo";
// import CategoriaModel from "./Categoria";
// import MercadoriaPhotoModel from "./MercadoriaPhotos";
// import UsuarioModel from "./Usuario";
// import sequelize from "../config/db";
// import AtributoModel from "./Atributo";
// import MercadoriaAtributosModel from "./MercadoriaAtributos";

import sequelize from "../config/db";
import AtributoModel from "./Atributo";
import AuditLog from "./AuditLogs";
import CategoriaModel from "./Categoria";
import FabricanteModel from "./Fabricante";
import GrupoModel from "./Grupo";
import KeyPhotosModel from "./KeyPhotos";
import MercadoriaModel from "./Mercadoria";
import Caracteristicas from "./MercadoriaAtributos";
import { MercadoriaKey } from "./MercadoriaKeys";
import MercadoriaPhotosModel from "./MercadoriaPhotos";
import UsuarioModel from "./Usuario";

// // ---- Um fabricante pode ter várias mercadorias ----
// // Criando a coluna fabricanteId na tabela mercadoria,
// // e chamando-a de mercadorias na tabela fabricante para consultas
// FabricanteModel.hasMany(MercadoriaModel, {
//   foreignKey: "fabricanteId",
//   as: "mercadorias",
// });

// // ---- Uma mercadoria pertence a um fabricante ----
// // Utiliza a coluna criada anteriormente, e a apelida de fabricante
// MercadoriaModel.belongsTo(FabricanteModel, {
//   foreignKey: "fabricanteId",
//   as: "fabricante",
// });

// CategoriaModel.hasMany(MercadoriaModel, {
//   foreignKey: "categoriaId",
//   as: "mercadorias",
// });
// MercadoriaModel.belongsTo(CategoriaModel, {
//   foreignKey: "categoriaId",
//   as: "categoria",
// });

// MercadoriaModel.hasMany(MercadoriaPhotoModel, {
//   foreignKey: "mercadoriaId",
//   as: "photos",
// });
// MercadoriaPhotoModel.belongsTo(MercadoriaModel, {
//   foreignKey: "mercadoriaId",
//   as: "mercadoria",
// });

// MercadoriaModel.belongsToMany(AtributoModel, {
//   through: MercadoriaAtributosModel,
// });
// AtributoModel.belongsToMany(MercadoriaModel, {
//   through: MercadoriaAtributosModel,
// });

// GrupoModel.hasMany(CategoriaModel, {
//   foreignKey: "grupoId",
//   as: "categorias",
// });

// CategoriaModel.belongsTo(GrupoModel, {
//   foreignKey: "grupoId",
//   as: "grupo",
// });

sequelize.addModels([
  GrupoModel,
  CategoriaModel,
  FabricanteModel,
  MercadoriaModel,
  MercadoriaPhotosModel,
  AtributoModel,
  Caracteristicas,
  UsuarioModel,
  MercadoriaKey,
  KeyPhotosModel,
  AuditLog,
]);

sequelize
  // .sync()
  .sync({ alter: true })
  .then(() => console.log("Modelos sincronizados com sucesso."));

// for (let key = 1; key <= 114; key++) {
//   sequelize.query(`INSERT INTO MercadoriaKeys (\`key\`) VALUES (${key});`);
// }
export {
  MercadoriaModel as Mercadoria,
  FabricanteModel as Fabricante,
  CategoriaModel as Categoria,
  GrupoModel as Grupo,
  MercadoriaPhotosModel as MercadoriaPhoto,
  UsuarioModel as Usuario,
  AtributoModel as Atributo,
  KeyPhotosModel as KeyPhoto,
};
