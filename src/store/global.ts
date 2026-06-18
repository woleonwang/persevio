import { makeAutoObservable } from "mobx";
import { Get } from "../utils/request";
import dayjs from "dayjs";

class GlobalStore {
  collapseForDrawer = false;

  menuCollapse = false;

  jobs: IJob[] = [];

  unreadTalentsCount = 0;

  unreadTalentsJobIds: number[] = [];

  mode = "";

  antdLocale: "zh-CN" | "en-US" = "en-US";

  staffRole: "hiring_manager" | "admin" | "recruiter" = "hiring_manager";

  isAdmin = false;

  useNewTalentDetailsPage = false;

  email = "";

  staffName = "";

  companyName = "";

  availableCredits: number | null = null;

  orgNodeId = 0;

  visibleOrgNodeIds: number[] = [];

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
      this.unreadTalentsJobIds = data.job_ids ?? [];
    }
  };

  refreshUnreadTalentsCount = () => {
    this.fetchUnreadTalentsCount();
  };

  setMode = (mode: "standard" | "utils") => {
    this.mode = mode;
  };

  setStaffRole = (role: "hiring_manager" | "admin" | "recruiter") => {
    this.staffRole = role;
  };

  setIsAdmin = (isAdmin: boolean) => {
    this.isAdmin = isAdmin;
  };

  setEmail = (email: string) => {
    this.email = email;
  };

  setStaffName = (staffName: string) => {
    this.staffName = staffName;
  };

  setCompanyName = (companyName: string) => {
    this.companyName = companyName;
  };

  setAvailableCredits = (availableCredits: number | null) => {
    this.availableCredits = availableCredits;
  };

  setOrgNodeId = (orgNodeId: number) => {
    this.orgNodeId = orgNodeId;
  };

  setVisibleOrgNodeIds = (visibleOrgNodeIds: number[]) => {
    this.visibleOrgNodeIds = visibleOrgNodeIds;
  };

  setUseNewTalentDetailsPage = (value: boolean) => {
    this.useNewTalentDetailsPage = value;
  };
}

const globalStore = new GlobalStore();

export default globalStore;
