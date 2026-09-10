// import { AuditLogTargetType } from "../../../../../../../../packages/types/database/Logs";
import { message } from "@tauri-apps/plugin-dialog";
import { AuditLogTargetType } from "@tauri-inventory/types";

export async function getLogRedirectTarget(tipo: AuditLogTargetType, id: number) {
    switch (tipo) {
        case AuditLogTargetType.MERCADORIA: return(`/gerente/logs/mercadorias?mercId=${id}`); break;
        case AuditLogTargetType.FABRICANTE: return(`/gerente/logs/fabricantes?fabricanteId=${id}`); break;
        case AuditLogTargetType.CATEGORIA: await message("Função nao implementada, para de futicar no codigo, curioso."); break;
        case AuditLogTargetType.GRUPO: await message("Função nao implementada, para de futicar no codigo, curioso."); break;
        case AuditLogTargetType.USUARIO: return(`/gerente/logs/usuarios?userIdTarget=${id}`); break;
        case AuditLogTargetType.ATRIBUTO: await message("Função nao implementada, para de futicar no codigo, curioso."); break;
    }
}