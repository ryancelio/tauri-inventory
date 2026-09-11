import { DataTypes, InferCreationAttributes } from "sequelize";
import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Usuario } from "./models";
import {
  AtributoLog,
  GrupoLog,
  KeyPhotoLog,
  CategoriaLog,
  FabricanteLog,
  MercadoriaLog,
  MercadoriaPhotoLog,
  AuditChanges,
  AuditData,
  AuditLogAction,
  AuditLogLevel,
  AuditLogTargetType,
  PossibleLogs,
  Caracteristica,
  CaracteristicaCreate,
  AtributoTypesType,
} from "@tauri-inventory/types";

export function getAuditChanges<T extends object>(
  anterior: T,
  novo: Partial<T>,
): AuditChanges<T> {
  const alteracoes: AuditChanges<T> = {};

  for (const key of Object.keys(novo) as Array<keyof T>) {
    const novoValor = novo[key];
    if (novoValor === undefined) {
      continue;
    }

    const keyString = key.toString();
    let parsedNewValue: any = novoValor;
    const parsedOldValue: any = anterior[key];

    // --- Caso especial: caracteristicas ---
    if (
  keyString === "caracteristicas" &&
  Array.isArray(parsedNewValue) &&
  Array.isArray(parsedOldValue)
) {
  const oldCaracList = parsedOldValue as Caracteristica[];
  const matchedOldIds = new Set<number>();

  const anteriorAlteradas: Caracteristica[] = [];
  const novoAlteradas: Caracteristica[] = [];

  (parsedNewValue as { key: string; value: string | number | boolean }[]).forEach(
    (newCarac) => {
      const oldCarac = oldCaracList.find((c) => c.id.toString() === newCarac.key);

      if (oldCarac) {
        matchedOldIds.add(oldCarac.id);

        // só registra se o valor realmente mudou
        if (!Object.is(oldCarac.valor, newCarac.value)) {
          anteriorAlteradas.push(oldCarac);
          novoAlteradas.push({
            id: oldCarac.id,
            nome: oldCarac.nome,
            tipo: oldCarac.tipo,
            valor: newCarac.value,
          });
        }
      } else {
        // característica nova: não existe correspondente em "anterior"
        novoAlteradas.push({
          id: Number(newCarac.key),
          nome: "",
          tipo: "" as AtributoTypesType,
          valor: newCarac.value,
        });
      }
    },
  );

  // características que existiam antes e não vieram na nova lista (removidas)
  const removidas = oldCaracList.filter((c) => !matchedOldIds.has(c.id));
  anteriorAlteradas.push(...removidas); // só entram no lado "anterior"

  if (anteriorAlteradas.length > 0 || novoAlteradas.length > 0) {
    alteracoes[key] = {
      anterior: anteriorAlteradas as any,
      novo: novoAlteradas as any,
    };
  }

  continue;
}

    // --- Caso especial: preco* ---
    let parsedOld = parsedOldValue;
    if (keyString.startsWith("preco")) {
      parsedNewValue =
        typeof novoValor === "number" ? novoValor.toFixed(2) : novoValor;
      parsedOld =
        typeof parsedOldValue === "number"
          ? parsedOldValue.toFixed(2)
          : parsedOldValue;
    }

    // --- Caso genérico ---
    if (
      !Object.is(parsedOld, parsedNewValue) &&
      novoValor !== null &&
      novoValor !== undefined
    ) {
      alteracoes[key] = {
        anterior: parsedOldValue,
        novo: novoValor,
      };
    }
  }

  return alteracoes;
}

@Table({
  tableName: "AuditLog",
  timestamps: false,
  indexes: [
    {
      name: "idx_audit_logs_alvo",
      fields: ["alvoTipo", "alvoId"],
    },
    {
      name: "idx_audit_logs_usuario",
      fields: ["usuarioId"],
    },
    {
      name: "idx_audit_logs_acao",
      fields: ["acao"],
    },
    {
      name: "idx_audit_logs_data",
      fields: ["data"],
    },
  ],
})
export default class AuditLog extends Model {
  @Column({
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Usuario)
  @Column({
    type: DataTypes.INTEGER,
    allowNull: true,
  })
  declare usuarioId: number | null;

  @BelongsTo(() => Usuario, {
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  })
  declare Usuario?: Usuario;

  @Column({
    type: DataTypes.ENUM(...Object.values(AuditLogTargetType)),
    allowNull: false,
  })
  declare alvoTipo: AuditLogTargetType;

  @Column({
    type: DataTypes.INTEGER,
    allowNull: true,
  })
  declare alvoId: number | null;

  @Column({
    type: DataTypes.ENUM(...Object.values(AuditLogAction)),
    allowNull: false,
  })
  declare acao: AuditLogAction;

  @Column({
    type: DataTypes.ENUM(...Object.values(AuditLogLevel)),
    allowNull: false,
    defaultValue: AuditLogLevel.NORMAL,
  })
  declare nivel: AuditLogLevel;

  @Column({
    type: DataTypes.TEXT("long"),
    allowNull: true,
    get(this) {
      const rawValue = this.getDataValue("dados");
      if (!rawValue) return null;
      try {
        return typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
      } catch (e) {
        console.error(e);
        return rawValue;
      }
    },
    set(value) {
      if (value && typeof value === "object") {
        this.setDataValue("dados", JSON.stringify(value));
      } else {
        this.setDataValue("dados", value);
      }
    },
  })
  declare dados: AuditData<PossibleLogs> | null;

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  })
  declare data: Date;

  @Column({
    type: DataTypes.STRING(45),
    allowNull: true,
  })
  declare ip: string | null;
}

export type AuditCreate = Omit<InferCreationAttributes<AuditLog>, "id">;
