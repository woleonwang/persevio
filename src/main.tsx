import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./layouts/App";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/home";
// import Signup from "./pages/signup/index.tsx";
import Signin from "./pages/signin";
import { ConfigProvider } from "antd";
// import Entry from "./pages/entry/index.tsx";
import Jobs from "./pages/jobs";
import JobsCreate from "./pages/jobs-create";
import JobsShow from "./pages/jobs-show";
import CompanyKnowledge from "./pages/company";
import Apply from "./pages/apply";
import Settings from "./pages/settings";
import JobCoworker from "./pages/job-coworker";

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
          <Route path="/jobs/:id/chat" element={<JobsShow />}></Route>
          <Route
            path="/jobs/:invitation_token/coworker"
            element={<JobCoworker />}
          ></Route>
          <Route path="/app" element={<App />}>
            {/* <Route path="/entry" element={<Entry />}></Route> */}
            <Route
              path="/app/entry/create-job"
              element={<JobsCreate />}
            ></Route>
            <Route path="/app/jobs" element={<Jobs />}></Route>
            <Route path="/app/company" element={<CompanyKnowledge />}></Route>
            <Route path="/app/settings" element={<Settings />}></Route>
          </Route>
          {/* <Route path="/signup" element={<Signup />}></Route> */}
          <Route path="/signin" element={<Signin />}></Route>
          <Route path="/apply" element={<Apply />}></Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>
);
