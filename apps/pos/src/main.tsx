import React from "react";
import ReactDOM from "react-dom/client";
// import Routing from "./Routing";
import { RouterProvider } from "react-router";
import { router } from "./Routes/Routers/routes";
import "./App.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App>
      <RouterProvider router={router} />
    </App>
  </React.StrictMode>,
);
