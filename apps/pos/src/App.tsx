import React from "react";
import ToastProvider from "./context/Toast/ToastContext";

export default function App({ children }: React.PropsWithChildren) {


  return (
    <main
      className="isolate"
      // onContextMenu={(e) => e.preventDefault()}
    >
      <ToastProvider>
        {children}
        </ToastProvider>
    </main>
  );
}
