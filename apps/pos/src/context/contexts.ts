import { UsuarioLogado } from "@tauri-inventory/types";
import { createContext as routerCreateContext } from "react-router";
import { createContext } from "react";
import { ToastContextValue } from "./Toast/ToastContext";

export interface ApiStatusCheck {
  isChecking: boolean;
  isOnline: boolean;
}
// REACT ROUTER CONTEXTS
export const userContext = routerCreateContext<UsuarioLogado | null>(null);
export const apiStatusContext = routerCreateContext<ApiStatusCheck | null>(
  null,
);

// REACT CONTEXTS (GLOBAL)
export const ToastContext = createContext<ToastContextValue | null>(null);

// export const offlineModeContext = createContext<boolean | null>(null);
