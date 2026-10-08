import { RouteObject } from "react-router";
import FabricanteMutationRoute from "./DataMutation/Fabricantes";
import AtributosMutationRoute from "./DataMutation/Atributos";
import CategoriasMutationRoute from "./DataMutation/Categorias";
import MercadoriaMutationRoute from "./DataMutation/Mercadorias";
import GruposMutationRoute from "./DataMutation/Grupos";

const GerenteDataMutationsRoute: RouteObject[] = [
  ...FabricanteMutationRoute,
  ...AtributosMutationRoute,
  ...CategoriasMutationRoute,
  ...MercadoriaMutationRoute,
  ...GruposMutationRoute,
]

export default GerenteDataMutationsRoute;
