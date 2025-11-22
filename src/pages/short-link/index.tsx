import { Get } from "@/utils/request";
import { Spin } from "antd";
import { useEffect } from "react";
import { useParams } from "react-router";

const ShortLink = () => {
  const { shortLink } = useParams<{ shortLink: string }>();

  useEffect(() => {
    fetchOriginalUrl();
  }, []);

  const fetchOriginalUrl = async () => {
    const { code, data } = await Get(`/api/short_links/${shortLink}`);
    if (code === 0) {
      window.location.href = data.original_link;
    }
  };

  return (
    <div className="flex-center" style={{ height: "100vh" }}>
      <Spin size="large" />
    </div>
  );
};

export default ShortLink;
