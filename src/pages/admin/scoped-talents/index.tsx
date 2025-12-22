import AdminTalents from "@/components/AdminTalents";
import commonStyles from "../style.module.less";
const ScopedTalents = () => {
  return (
    <div className={commonStyles.adminContainer}>
      <div className={commonStyles.adminPageHeader}>候选人列表</div>
      <div className={commonStyles.adminFilter}>
        <div className={commonStyles.adminFilterItem}></div>
      </div>
      <div className={commonStyles.adminMain} style={{ overflow: "auto" }}>
        <AdminTalents hideHeader={true} />
      </div>
    </div>
  );
};

export default ScopedTalents;
