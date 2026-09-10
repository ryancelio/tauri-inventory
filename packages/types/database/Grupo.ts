export interface GrupoCategorias {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
}

export interface IGrupo {
  id: number;
  nome: string;
  categorias: GrupoCategorias[];
  createdAt: string;
  updatedAt: string;
}

export interface GrupoDB {
  id: number;
  nome: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
}


export interface GrupoDBSent {
  id?: number;
  nome?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
