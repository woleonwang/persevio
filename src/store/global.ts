import { makeAutoObservable } from "mobx";

class GlobalStore {
  collapseForDrawer = false;

  constructor() {
    makeAutoObservable(this);
  }

  setCollapseForDrawer = (collapse: boolean) => {
    this.collapseForDrawer = collapse;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
