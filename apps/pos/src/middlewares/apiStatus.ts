import { invoke } from "@tauri-apps/api/core";
import { MiddlewareFunction } from "react-router";
import { apiStatusContext } from "../context/contexts";
import { getIsApiOnline } from "../backend/backendHelper";

export const apiStatusMiddleware: MiddlewareFunction = async (
  { context },
  next,
) => {
  try {
    const isOnline = await getIsApiOnline();
    context.set(apiStatusContext, { isChecking: false, isOnline });
  } catch (error) {
    context.set(apiStatusContext, { isChecking: false, isOnline: false });
  }

  await next();
};
