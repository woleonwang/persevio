import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, Select, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import globalStore from "@/store/global";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import {
  EVALUATE_RESULT_LEVEL_KEYS,
  getEvaluateResultLevel,
  parseJSON,
} from "@/utils";
import ListModeTable from "@/components/ListModeTable";

const Talents: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);

  const [searchName, setSearchName] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>();
  const [evaluateResultLevels, setEvaluateResultLevels] = useState<
    TEvaluateResultLevel[]
  >([]);

  const { t } = useTranslation();

  useEffect(() => {
    // 刷新未读候选人状态
    globalStore.refreshUnreadTalentsCount();
    globalStore.fetchJobs();
  }, []);

  useEffect(() => {
    fetchTalents();
  }, [selectedJobId]);

  const fetchTalents = async () => {
    setLoading(true);
    const { code, data } = await Get<{
      talents: TTalent[];
      linkedin_profiles: TLinkedinProfile[];
    }>(`/api/talents?job_id=${selectedJobId ?? ""}`);

    if (code === 0) {
      setTalents(
        (data.talents ?? []).map((talent) => ({
          ...talent,
          basicInfo: parseJSON(talent.basic_info_json),
          parsedEvaluateResult: parseJSON(talent.evaluate_json),
        })) as TTalentListItem[],
      );
    }
    setLoading(false);
  };

  const filteredList = useMemo(() => {
    return talents
      .filter((item) => {
        if (!searchName) return true;
        const name = item.name || "";
        return name.toLowerCase().includes(searchName.toLowerCase());
      })
      .filter((item) => {
        if (evaluateResultLevels.length === 0) return true;
        const level = getEvaluateResultLevel(item.parsedEvaluateResult);
        return evaluateResultLevels.includes(level);
      });
  }, [talents, searchName, evaluateResultLevels]);

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageTitle}>Candidate List </div>
      <div className={styles.filterRow}>
        <Input
          className={styles.searchInput}
          placeholder={t("job_details.pipeline_section.search_placeholder")}
          prefix={<SearchOutlined />}
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          allowClear
          style={{ width: 220 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder="All Jobs"
          value={selectedJobId}
          onChange={setSelectedJobId}
          allowClear
          options={globalStore.jobs.map((j) => ({
            value: j.id,
            label: j.name,
          }))}
          style={{ width: 260 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder={t("job_details.pipeline_section.all_fit_levels")}
          value={evaluateResultLevels}
          onChange={setEvaluateResultLevels}
          mode="multiple"
          maxTagCount={1}
          allowClear
          options={EVALUATE_RESULT_LEVEL_KEYS.map((level) => ({
            label: t(`job_talents.evaluate_result_select_options.${level}`),
            value: level,
          }))}
          style={{ width: 220 }}
        />
      </div>
      <div className={styles.pageBody}>
        {loading ? (
          <div className={styles.loading}>
            <Spin />
          </div>
        ) : (
          <ListModeTable
            variant="talents"
            items={filteredList}
            onRowClick={(talent) => {
              window.open(
                `/app/jobs/${talent.job_id}/standard-board/talents/${talent.id}?from=talents`,
                "_blank",
              );
            }}
            onUpdateTalent={fetchTalents}
          />
        )}
      </div>
    </div>
  );
};

export default observer(Talents);
