import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import React from "react";
import ToastProvider from "./context/Toast/ToastContext";

export default function App({ children }: React.PropsWithChildren) {
  useEffect(() => {
    const checkHealth = () => {
      invoke("recheck_api_status").catch((err) => {
        console.error("Health check falhou:", err);
      });
    };
    checkHealth();
  }, []);

  return (
    <main
      className="isolate"
      // onContextMenu={(e) => e.preventDefault()}
    >
      <ToastProvider>{children}</ToastProvider>
    </main>
  );
}
