import { useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";
import { Empty } from "antd";

import { Get } from "@/utils/request";
import { TTalent } from "@/pages/talent/type";

import styles from "./style.module.less";
import { parseJSON } from "@/utils";

interface IProps {
  jobId: number;
}
const Talents: React.FC<IProps> = (props) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalent[]>([]);

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`talents.${key}`);

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents`);

    if (code === 0) {
      setTalents(
        data.talents
          .filter((talent: TTalent) => talent.candidate_id !== 0)
          .map((talent: any) => ({
            ...talent,
            evaluate_result: parseJSON(talent.evaluate_result),
          }))
      );
    }
  };

  if (talents.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "center",
          paddingTop: 200,
        }}
      >
        <Empty />
      </div>
    );
  }
  return (
    <div className={styles.talentsContainer}>
      {talents.map((talent) => {
        return (
          <div
            key={talent.id}
            onClick={() =>
              window.open(`/app/jobs/${jobId}/talents/${talent.id}`)
            }
            className={styles.talentPanel}
          >
            <div
              className={classnames(
                styles.avatar,
                styles[`color-${(talent.candidate.name.charCodeAt(0) % 8) + 1}`]
              )}
            >
              {talent.candidate.name[0]}
            </div>
            <div>
              <div className={styles.name}> {talent.candidate.name}</div>
              <div className={styles.info}>
                {!!talent.evaluate_result.overall_match_level && (
                  <div className={classnames(styles.tag, styles.level)}>
                    {originalT(
                      `talent.${talent.evaluate_result.overall_match_level}`
                    )}
                  </div>
                )}
                <div className={classnames(styles.tag, styles[talent.status])}>
                  {t(`status_${talent.status}`)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Talents;
