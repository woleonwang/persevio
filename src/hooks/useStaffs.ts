import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

interface IUseStaffsOptions {
  includeDeactivated?: boolean;
}

const useStaffs = (options: IUseStaffsOptions = {}) => {
  const { includeDeactivated = false } = options;
  const [staffs, setStaffs] = useState<IStaffWithAccount[]>([]);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    const { code, data } = await Get<{ staffs: IStaffWithAccount[] }>(
      "/api/staffs",
    );
    if (code === 0) {
      const nextStaffs = (data.staffs ?? []).filter((staff) => {
        if (includeDeactivated) return true;
        return staff.status !== "deactivated";
      });
      setStaffs(nextStaffs);
    }
  };

  return { staffs, fetchStaffs };
};

export default useStaffs;
