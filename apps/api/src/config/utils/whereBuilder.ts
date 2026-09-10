import { Op, WhereOptions } from "sequelize";
import { BaseQuery } from "@tauri-inventory/types";
import AtributoModel from "../../models/Atributo";
import Caracteristicas from "../../models/MercadoriaAtributos";

export async function buildWhereClause<T>(
  query: BaseQuery<T>,
): Promise<WhereOptions> {
  if (!query || !query.filter || Object.keys(query.filter).length === 0)
    return {};

  const where: WhereOptions | any = {};

  console.log(query);
  // console.log(JSON.stringify(query.filter.caracteristicas));

  // Iterates through the first layer,
  // which consists of the database columns
  for (const [column, conditions] of Object.entries(query.filter)) {
    if (
      conditions === undefined ||
      conditions === null ||
      Object.keys(conditions).length === 0
    )
      continue;

    // Tratamento para a tabela de junção (pode usar a key "caracteristicas" ou "atributos")
    if (column === "caracteristicas") {
      let matchingIds: number[] | null = null;

      for (const [atributoId, jsonOperators] of Object.entries(
        conditions as Record<string, any>,
      )) {
        if (jsonOperators === undefined || jsonOperators === null) continue;

        const valorConditions: any = {};

        // Se receber valor direto, aplica eq. Caso contrário, itera nos operadores.
        if (typeof jsonOperators !== "object" || Array.isArray(jsonOperators)) {
          applyOperator(valorConditions, "eq", jsonOperators);
        } else {
          for (const [operator, value] of Object.entries(jsonOperators)) {
            if (value === undefined || value === null) continue;
            applyOperator(
              valorConditions,
              operator,
              String(value).toLowerCase(),
            );
          }
        }

        if (hasConditions(valorConditions)) {
          // 1. Descobre o id do atributo pelo nome (sem include)
          const atributo = await AtributoModel.findOne({
            attributes: ["id"],
            where: { id: atributoId },
            raw: true,
          });

          // Se não existe atributo com esse nome, não há como bater — zera o resultado
          if (!atributo) {
            matchingIds = [];
            break;
          }

          // 2. Busca direto na tabela de junção, filtrando por atributoId + valor
          const records = await Caracteristicas.findAll({
            attributes: ["mercadoriaId"],
            where: {
              atributoId: atributo.id,
              valor: valorConditions,
            },
            raw: true,
          });

          const ids = records.map((r) => r.mercadoriaId);

          if (matchingIds === null) {
            matchingIds = ids;
          } else {
            matchingIds = matchingIds.filter((id) => ids.includes(id));
          }

          if (matchingIds.length === 0) break;
        }
      }

      // Aplica os IDs resultantes ao 'where' da query principal
      if (matchingIds !== null) {
        if (!where[Op.and]) {
          where[Op.and] = [];
        }
        where[Op.and].push({
          id: { [Op.in]: matchingIds },
        });
      }

      continue;
    }

    // Coluna normal
    const columnConditions: any = {};
    for (const [operator, value] of Object.entries(
      conditions as Record<string, any>,
    )) {
      if (value === undefined || value === null) continue;
      applyOperator(columnConditions, operator, value);

      if (hasConditions(columnConditions)) {
        where[column] = columnConditions ? columnConditions : undefined;
      }
    }
  }

  return where;
}

function applyOperator(conditionTarget: any, operator: string, value: any) {
  // Operator whithelisting
  switch (operator) {
    case "eq":
      conditionTarget[Op.eq] = value;
      break;
    case "contains":
      if (Array.isArray(value)) {
        conditionTarget[Op.in] = value;
      } else {
        conditionTarget[Op.like] = `%${(value as string).toLowerCase()}%`;
      }
      break;
    case "gt":
      conditionTarget[Op.gt] = value;
      break;

    case "lt":
      conditionTarget[Op.lt] = value;
      break;

    case "gte":
      conditionTarget[Op.gte] = value;
      break;

    case "lte":
      conditionTarget[Op.lte] = value;
      break;

    case "in":
      conditionTarget[Op.in] = value;
      break;

    // Outside the whitelist, not supported
    default:
      // TODO - LOG
      console.warn(`Operator ${operator} not supported.`);
  }
}
// Verifica se o objeto de condições ficou populado
function hasConditions(obj: any): boolean {
  return (
    Object.getOwnPropertySymbols(obj).length > 0 || Object.keys(obj).length > 0
  );
}

export function getAdditionalFilters<T>(query: BaseQuery<T>): {
  limit: number;
  offset: number;
  order: string[][] | undefined;
  include: string[] | undefined;
} {
  const limit = query.limit || 10; // 10 items default limit
  const offset = query.page ? (query.page - 1) * limit : 0;
  const order = query.sortBy
    ? [[query.sortBy, query.sortOrder || "ASC"]]
    : undefined;

  const include =
    query.include && query.include.length > 0 ? query.include : undefined;

  return { limit, offset, order, include };
}
