import { message } from "@tauri-apps/plugin-dialog";
import { AuditLogTargetType } from "@tauri-inventory/types";

/**
 * Rota da subpágina de logs correspondente ao alvo de um registro.
 * Retorna `undefined` quando o alvo não possui página de logs (avisa o usuário).
 */
export async function getLogRedirectTarget(
  tipo: AuditLogTargetType,
  id: number,
): Promise<string | undefined> {
  switch (tipo) {
    case AuditLogTargetType.MERCADORIA:
      return `/gerente/logs/mercadorias?mercId=${id}`;
    case AuditLogTargetType.FABRICANTE:
      return `/gerente/logs/fabricantes?fabricanteId=${id}`;
    case AuditLogTargetType.USUARIO:
      return `/gerente/logs/usuarios?targetUserId=${id}`;
    case AuditLogTargetType.LOJA:
      return `/gerente/logs/lojas?lojaId=${id}`;
    case AuditLogTargetType.CATEGORIA:
      await message(
        "Função nao implementada, para de futicar no codigo, curioso.",
      );
      return undefined;
    case AuditLogTargetType.GRUPO:
      await message(
        "Função nao implementada, para de futicar no codigo, curioso.",
      );
      return undefined;
    case AuditLogTargetType.ATRIBUTO:
      await message(
        "Função nao implementada, para de futicar no codigo, curioso.",
      );
      return undefined;
  }
}
