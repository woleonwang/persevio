import { makeAutoObservable } from "mobx";
import { Get } from "../utils/request";
import dayjs from "dayjs";

class GlobalStore {
  collapseForDrawer = false;

  menuCollapse = false;

  jobs: IJob[] = [];

  unreadTalentsCount = 0;

  mode = "";

  antdLocale: "zh-CN" | "en-US" = "en-US";

  constructor() {
    makeAutoObservable(this);
  }

  setMenuCollapse = (collapse: boolean) => {
    this.menuCollapse = collapse;
  };

  setCollapseForDrawer = (collapse: boolean) => {
    this.collapseForDrawer = collapse;
  };

  setAntdLocale = (locale: "zh-CN" | "en-US") => {
    this.antdLocale = locale as "zh-CN" | "en-US";
    dayjs.locale(locale.toLowerCase());
  };

  fetchJobs = async () => {
    const { code, data } = await Get("/api/jobs");
    if (code == 0) {
      this.jobs = data.jobs;
    }
  };

  fetchUnreadTalentsCount = async () => {
    const { code, data } = await Get("/api/talents/status");
    if (code == 0) {
      this.unreadTalentsCount = data.count;
    }
  };

  refreshUnreadTalentsCount = () => {
    this.fetchUnreadTalentsCount();
  };

  setMode = (mode: "standard" | "utils") => {
    this.mode = mode;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
