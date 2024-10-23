import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import App from "./App";
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from "react-router-dom";
import './index.css';
import { UserContext } from "./App";
import { TokenRefreshProvider } from "./components/contexts/tokenRefreshContext";
import getUserInfo from "./utilities/decodeJwt";

const Root = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userInfo = getUserInfo();
    setUser(userInfo);
  }, []);

  return (
    <BrowserRouter>
      <UserContext.Provider value={{ user }}>
        <TokenRefreshProvider>
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
            integrity="sha384-Zenh87qX5JnK2Jl0vWa8Ck2rdkQ2Bzep5IDxbcnCeuOxjzrPF/et3URy9Bv1WTRi"
            crossorigin="anonymous"
          />
          <App />
        </TokenRefreshProvider>
      </UserContext.Provider>
    </BrowserRouter>
  );
};

ReactDOM.render(
  <Root />,
  document.getElementById("root")
);
