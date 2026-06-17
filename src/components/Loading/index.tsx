import LoadingImg from "@/assets/loading.webp";
import { Spin } from "antd";

const Loading = () => {
  return (
    <Spin
      indicator={
        <img
          src={LoadingImg}
          alt="loading"
          style={{ width: 200, height: "auto" }}
        />
      }
    />
  );
};

export default Loading;
