import { invoke } from "@tauri-apps/api/core";
import {
  ApiListResponse,
  AuditLog,
  AuditLogAction,
  AuditLogLevel,
} from "@tauri-inventory/types";

export async function getAllLogs({
  action,
  level,
  page,
  userId,
}: {
  page?: number;
  userId?: number;
  action?: AuditLogAction;
  level?: AuditLogLevel;
}) {
  if (!page || page < 0) {
    page = 1;
  }

  return await invoke<ApiListResponse<AuditLog>>("get_logs_all", {
    page: page.toString(),
    userId,
    action,
    level,
  });
}

export async function getLogsMercadoria({
  mercId,
  page,
  userId,
  action,
  level,
}: {
  mercId: number;
  page?: number;
  userId?: number;
  action?: AuditLogAction;
  level?: AuditLogLevel;
}): Promise<ApiListResponse<AuditLog>> {
  if (!page || page < 0) {
    page = 1;
  }
  if (!mercId) {
    return {
      count: 0,
      data: [],
    };
  }

  return await invoke<ApiListResponse<AuditLog>>("get_logs_mercadoria", {
    page: page.toString(),
    mercId,
    userId,
    action,
    level,
  });
}

export async function getLogsUsuario({
  userIdTarget,
  page,
  userId,
  action,
  level,
}: {
  userIdTarget: number;
  page?: number;
  userId?: number;
  action?: AuditLogAction;
  level?: AuditLogLevel;
}): Promise<ApiListResponse<AuditLog>> {
  if (!page || page < 0) {
    page = 1;
  }
  if (!userIdTarget) {
    return {
      count: 0,
      data: [],
    };
  }

  return await invoke<ApiListResponse<AuditLog>>("get_logs_usuario", {
    page: page.toString(),
    userIdTarget,
    userId,
    action,
    level,
  });
}

export async function getLogsFabricantes({
  fabricanteId,
  page,
  userId,
  action,
  level,
}: {
  fabricanteId: number;
  page?: number;
  userId?: number;
  action?: AuditLogAction;
  level?: AuditLogLevel;
}): Promise<ApiListResponse<AuditLog>> {
  if (!page || page < 0) {
    page = 1;
  }
  if (!fabricanteId) {
    return {
      count: 0,
      data: [],
    };
  }

  return await invoke<ApiListResponse<AuditLog>>("get_logs_fabricante", {
    page: page.toString(),
    fabricanteId,
    userId,
    action,
    level,
  });
}
