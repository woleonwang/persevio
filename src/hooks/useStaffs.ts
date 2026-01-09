import { Get } from "@/utils/request";
import { useEffect, useState } from "react";

const useStaffs = () => {
  const [staffs, setStaffs] = useState<IStaff[]>([]);

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    const { code, data } = await Get("/api/staffs");
    if (code === 0) {
      setStaffs(data.staffs);
    }
  };

  return { staffs, fetchStaffs };
};

export default useStaffs;
