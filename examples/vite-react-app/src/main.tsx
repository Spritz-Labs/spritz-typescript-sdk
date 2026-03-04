import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { SpritzProvider } from "./SpritzContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <SpritzProvider>
        <App />
      </SpritzProvider>
    </BrowserRouter>
  </React.StrictMode>
);
