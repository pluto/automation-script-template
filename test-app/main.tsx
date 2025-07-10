import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { PlutoProvider } from "@plutoxyz/react-frame";
import "./index.css"; // Optional: Add styling for your test app

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PlutoProvider>
      <App />
    </PlutoProvider>
  </React.StrictMode>,
);
