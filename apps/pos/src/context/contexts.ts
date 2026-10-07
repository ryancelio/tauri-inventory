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

// REACT CONTEXTS (GLOBAL)
export const ToastContext = createContext<ToastContextValue | null>(null);

// Status da conexão, publicado por MainLayout a partir da verificação inicial
// disparada pelo front. O default (sem provider) não bloqueia a tela.
export const ApiStatusContext = createContext<ApiStatusCheck>({
  isOnline: false,
  isChecking: false,
});

// export const offlineModeContext = createContext<boolean | null>(null);
