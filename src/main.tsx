import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./layouts/App";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/home/index.tsx";
import Agent from "./pages/agent/index.tsx";
import Signup from "./pages/signup/index.tsx";
import Signin from "./pages/signin/index.tsx";
import { ConfigProvider } from "antd";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimaryHover: "#1FAC6A",
          colorPrimary: "#1FAC6A",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />}></Route>
          <Route path="/app" element={<App />}>
            <Route path="/app/agent" element={<Agent />}></Route>
          </Route>
          <Route path="/signup" element={<Signup />}></Route>
          <Route path="/signin" element={<Signin />}></Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
