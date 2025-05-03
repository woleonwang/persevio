import { Outlet, useNavigate } from "react-router";

import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Spin } from "antd";
import { Get } from "../../utils/request";

const CandidateLayout = () => {
  const navigate = useNavigate();

  const [inited, setInited] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    try {
      // 校验 token
      const { code, data } = await Get("/api/candidate/settings");
      if (code === 0) {
        setInited(true);
        console.log(data);
      }
    } catch (e) {
      navigate("/signin_candidate");
    }
  };

  if (!inited) {
    return (
      <div
        style={{
          width: "100vw",
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div>Candidate Layout</div>
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default observer(CandidateLayout);
