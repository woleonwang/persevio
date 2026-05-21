import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Input, Select, Spin } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

import globalStore from "@/store/global";
import styles from "./style.module.less";
import { Get } from "@/utils/request";
import {
  getCandidateCardData,
  getEvaluateResultLevel,
  normalizeTalentField,
  parseJSON,
} from "@/utils";
import ListModeTable from "@/components/ListModeTable";
import useStaffs from "@/hooks/useStaffs";
import {
  EVALUATE_INTERVIEW_RECOMMENDATION_KEYS,
  TALENT_DETAIL_FROM,
} from "@/utils/consts";
import { buildTalentDetailUrl } from "@/utils";

const Talents: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<TTalentListItem[]>([]);

  const [searchName, setSearchName] = useState<string>("");
  const [selectedJobId, setSelectedJobId] = useState<number | undefined>();
  const [evaluateResultLevels, setEvaluateResultLevels] = useState<
    TInterviewRecommendation[]
  >([]);
  const [selectedRecruiterId, setSelectedRecruiterId] = useState<number>();

  const { t } = useTranslation();
  const { staffs } = useStaffs({ includeDeactivated: true });

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

  const staffFilterOptions = useMemo(
    () =>
      staffs.map((staff) => ({
        label: staff.name,
        value: staff.id,
      })),
    [staffs],
  );

  const staffSelectFilterOption = useCallback(
    (input: string, option?: { value?: number }) => {
      const staff = staffs.find((s) => s.id === option?.value);
      if (!staff) return false;
      const needle = input.toLowerCase();
      const email = staff.account?.username ?? "";
      return (
        staff.name.toLowerCase().includes(needle) ||
        email.toLowerCase().includes(needle)
      );
    },
    [staffs],
  );

  const filteredList = useMemo(() => {
    return talents
      .filter((item) => {
        if (!searchName) return true;
        const query = searchName.trim().toLowerCase();
        const card = getCandidateCardData(item);
        const haystack = [
          item.name ?? "",
          normalizeTalentField(card.location),
          normalizeTalentField(card.visa),
          normalizeTalentField(card.comp),
          normalizeTalentField(card.expectedCompensation),
          normalizeTalentField(card.exp),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .filter((item) => {
        if (evaluateResultLevels.length === 0) return true;
        const level = getEvaluateResultLevel(item.parsedEvaluateResult);
        return evaluateResultLevels.includes(level);
      })
      .filter((item) => {
        if (selectedRecruiterId == null) return true;
        return (item.talent_recruiters ?? []).some(
          (c) => c.staff_id === selectedRecruiterId,
        );
      });
  }, [talents, searchName, evaluateResultLevels, selectedRecruiterId]);

  return (
    <div className={styles.candidatesContainer}>
      <div className={styles.pageTitle}>{t("candidate_list_page.title")}</div>
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
          placeholder={t("candidate_list_page.all_jobs")}
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
          placeholder={t("talents.assigned_recruiter_placeholder")}
          value={selectedRecruiterId}
          onChange={setSelectedRecruiterId}
          allowClear
          options={staffFilterOptions}
          autoClearSearchValue
          showSearch
          filterOption={staffSelectFilterOption}
          style={{ width: 220 }}
        />
        <Select
          className={styles.filterSelect}
          placeholder={t("job_details.pipeline_section.all_fit_levels")}
          value={evaluateResultLevels}
          onChange={setEvaluateResultLevels}
          mode="multiple"
          maxTagCount={1}
          allowClear
          options={EVALUATE_INTERVIEW_RECOMMENDATION_KEYS.map((level) => ({
            label: t(`job_talents.evaluate_result_options.${level}`),
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
                buildTalentDetailUrl(
                  talent.job!.invitation_token,
                  talent.id,
                  TALENT_DETAIL_FROM.talents,
                ),
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
