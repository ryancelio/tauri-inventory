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
import LojasModel from "./Lojas";
import EstoqueModel from "./Estoque";

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
  LojasModel,
  EstoqueModel
]);

sequelize
  .sync({ alter: true })
  .then(() => console.log("Modelos sincronizados com sucesso."));

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
