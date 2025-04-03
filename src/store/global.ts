import { makeAutoObservable } from "mobx";
import { Get } from "../utils/request";

class GlobalStore {
  collapseForDrawer = false;

  menuCollapse = false;

  jobs: IJob[] = [];
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
}

const globalStore = new GlobalStore();

export default globalStore;
