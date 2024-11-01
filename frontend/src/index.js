import React from "react";
import ReactDOM from "react-dom/client"; // Import from 'react-dom/client' for React 18
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { UserProvider } from "./components/contexts/userContext";
import { TokenRefreshProvider } from "./components/contexts/tokenRefreshContext";

const Root = () => {
  return (
    <BrowserRouter>
      <UserProvider>
        <TokenRefreshProvider>
          <App />
        </TokenRefreshProvider>
      </UserProvider>
    </BrowserRouter>
  );
};

// Select the root DOM node
const container = document.getElementById("root");

// Create a root.
const root = ReactDOM.createRoot(container);

// Initial render
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
