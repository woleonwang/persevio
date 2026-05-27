import { ConfigProvider } from "antd";
import { observer } from "mobx-react-lite";
import globalStore from "@/store/global";
import enUSReact from "antd/es/locale/en_US";
import zhCNReact from "antd/es/locale/zh_CN";

const AntdLocaleProvider = ({ children }: { children: React.ReactNode }) => {
  const locale = globalStore.antdLocale === "zh-CN" ? zhCNReact : enUSReact;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimaryHover: "#3682fe",
          colorPrimary: "#3682fe",
          fontFamily:
            '"Sora", "PingFang SC","Lantinghei SC", "Microsoft YaHei", "HanHei SC", "Helvetica Neue", "Open Sans", Arial, "Hiragino Sans GB", 微软雅黑, STHeiti, SimSun, sans-serif !important',
          borderRadius: 12,
          colorBgContainerDisabled: "rgba(0,0,0,0.01)",
          colorTextDisabled: "rgba(0,0,0,0.5)",
          borderRadiusLG: 12,
          controlHeightLG: 44,
        },
        components: {
          Input: {
            hoverBorderColor: "rgba(54, 130, 254, 0.5)",
            activeBorderColor: "rgba(54, 130, 254, 0.5)",
            activeShadow: "none",
            errorActiveShadow: "none",
            warningActiveShadow: "none",
          },
          Select: {
            hoverBorderColor: "rgba(54, 130, 254, 0.5)",
            activeBorderColor: "rgba(54, 130, 254, 0.5)",
            activeOutlineColor: "none",
          },
          InputNumber: {
            hoverBorderColor: "rgba(54, 130, 254, 0.5)",
            activeBorderColor: "rgba(54, 130, 254, 0.5)",
            activeShadow: "none",
            errorActiveShadow: "none",
            warningActiveShadow: "none",
          },
        },
      }}
      locale={locale}
    >
      {children}
    </ConfigProvider>
  );
};

export default observer(AntdLocaleProvider);
