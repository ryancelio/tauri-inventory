const createMercadoria = `
    CREATE TABLE mercadorias (
    id INTEGER PRIMARY KEY,
    key INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    precoCusto REAL NOT NULL DEFAULT 0.00,
    precoVenda REAL NOT NULL DEFAULT 0.00,
    estoque02 INTEGER NOT NULL DEFAULT 0,
    estoque03 INTEGER NOT NULL DEFAULT 0,
    estoque04 INTEGER NOT NULL DEFAULT 0,
    observacoes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    fabricanteId INTEGER,
    categoriaId INTEGER,
    deletedAt TEXT
);`;
const insertMercadoriaStatment =
  "INSERT INTO mercadorias (id, key,descricao, precoCusto,precoVenda,estoque02,estoque03,estoque04,observacoes,fabricanteId,categoriaId,createdAt,updatedAt,deletedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

const createMercadoriaKey = `
  CREATE TABLE MercadoriaKeys (
  key INTEGER PRIMARY KEY
  );
  `;
const insertMercadoriaKeyStatement =
  "INSERT INTO MercadoriaKeys (key) VALUES (?);";

const createAtributos = `CREATE TABLE atributos (
    id INTEGER PRIMARY KEY,
    tipo TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    nome TEXT NOT NULL,
    deletedAt TEXT
);`;

const insertAtributosStatement =
  "INSERT INTO atributos (id,nome,tipo,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?,?)";

const createMercadoriaAtributos = `CREATE TABLE Mercadoria_Atributos (
    valor TEXT NOT NULL,
    mercadoriaId INTEGER NOT NULL,
    atributoId INTEGER NOT NULL,

    PRIMARY KEY (mercadoriaId, atributoId)
);`;

const insertMercadoriaAtributos = `
INSERT INTO Mercadoria_atributos (valor,mercadoriaId,atributoId) VALUES (?,?,?)`;

const createCategoria = `CREATE TABLE categoria (
  id INTEGER NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  grupoId INTEGER DEFAULT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL
);`;
const insertCategoriaStatement =
  "INSERT INTO categoria (id,nome,grupoId,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?,?)";

const createFabricantes = `CREATE TABLE fabricantes (
  id INTEGER NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL
);`;

const insertFabricantesStatement =
  "INSERT INTO fabricantes (id,nome,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?)";

const createGrupos = `CREATE TABLE grupos (
  id INTEGER NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL
);`;

const insertGruposStatement =
  "INSERT INTO grupos (id,nome,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?)";

const createMercPhotos = `CREATE TABLE mercadoriaPhotos (
  id INTEGER NOT NULL PRIMARY KEY,
  url TEXT NOT NULL,
  mercadoriaId INTEGER DEFAULT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL
);`;
const insertMercPhotosStatement =
  "INSERT INTO mercadoriaPhotos (id,url,mercadoriaId,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?,?)";

const createUsuarios = `CREATE TABLE usuarios (
  id INTEGER NOT NULL PRIMARY KEY,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  usuario TEXT NOT NULL,
  senhaHash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  local TEXT NOT NULL,
  deletedAt TEXT DEFAULT NULL
);`;

const insertUsuariosStatement =
  "INSERT INTO usuarios (id,nome,funcao,usuario,senhaHash,local,createdAt,updatedAt,deletedAt) VALUES (?,?,?,?,?,?,?,?,?)";

  const createAuditLog = `
  CREATE TABLE AuditLog (
  id INTEGER NOT NULL PRIMARY KEY,
  alvoTipo TEXT NOT NULL,
  alvoId INTEGER DEFAULT NULL,
  acao TEXT NOT NULL,
  nivel TEXT NOT NULL,
  dados TEXT DEFAULT NULL,
  data TEXT NOT NULL,
  ip TEXT DEFAULT NULL,
  usuarioId INTEGER DEFAULT NULL
);`
const insertAuditLogStatement = "INSERT INTO AuditLog (id,alvoTipo,alvoId,acao,nivel,dados,data,ip,usuarioId) VALUES (?,?,?,?,?,?,?,?,?)";

const sqliteCreateTable = {
  mercadoria: { create: createMercadoria, insert: insertMercadoriaStatment },
  mercadoriaKey: {
    create: createMercadoriaKey,
    insert: insertMercadoriaKeyStatement,
  },
  atributos: { create: createAtributos, insert: insertAtributosStatement },
  mercadoriaAtributos: {
    create: createMercadoriaAtributos,
    insert: insertMercadoriaAtributos,
  },
  categoria: { create: createCategoria, insert: insertCategoriaStatement },
  fabricante: { create: createFabricantes, insert: insertFabricantesStatement },
  grupos: { create: createGrupos, insert: insertGruposStatement },
  // mercPhotos: { create: createMercPhotos, insert: insertMercPhotosStatement },
  auditLogs: {create: createAuditLog, insert: insertAuditLogStatement},
  usuarios: { create: createUsuarios, insert: insertUsuariosStatement },
};

export default sqliteCreateTable;
