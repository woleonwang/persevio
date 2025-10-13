import { makeAutoObservable } from "mobx";
import { Get } from "../utils/request";

class GlobalStore {
  collapseForDrawer = false;

  menuCollapse = false;

  jobs: IJob[] = [];

  unreadTalentsCount = 0;

  mode = "";

  constructor() {
    makeAutoObservable(this);
  }

  setMenuCollapse = (collapse: boolean) => {
    this.menuCollapse = collapse;
  };

  setCollapseForDrawer = (collapse: boolean) => {
    this.collapseForDrawer = collapse;
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
