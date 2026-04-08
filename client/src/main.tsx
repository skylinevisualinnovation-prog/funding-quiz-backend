import React from "react";
import ReactDOM from "react-dom/client";
import { getLoginUrl } from "@/const";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

// OPTIONAL: If you want automatic redirect logic on boot
const loginUrl = getLoginUrl();

if (
  loginUrl &&
  typeof window !== "undefined" &&
  window.location.pathname === "/login"
) {
  window.location.href = loginUrl;
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}