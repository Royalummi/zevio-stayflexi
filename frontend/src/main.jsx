import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

// Suppress known harmless warnings and errors
// 1. ReactQuill's deprecated findDOMNode warning
// 2. Sonner's ForwardRef setState warning in StrictMode (known issue, doesn't affect functionality)
// 3. R2 CORS errors during propagation (takes 1-5 minutes after configuration)
// 4. Image load errors that are already handled with fallbacks
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("findDOMNode") ||
      args[0].includes("ReactQuill") ||
      // Sonner v1.x known bug: Toaster calls dismiss() during its own render cycle
      // in React StrictMode / concurrent mode. This is cosmetic only — does not
      // affect functionality. See: https://github.com/emilkowalski/sonner/issues
      (args[0].includes("Cannot update a component") &&
        args[0].includes("while rendering a different")) ||
      args[0].includes("Failed to load image") ||
      args[0].includes("CORS issue"))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
      {/* Toaster placed outside BrowserRouter to prevent state update conflicts */}
      <Toaster
        position="top-right"
        richColors
        duration={4000}
        closeButton
        expand={false}
      />
    </ErrorBoundary>
  </React.StrictMode>,
);
