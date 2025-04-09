import { useEffect, useState } from "react";
import { Get } from "../../../../utils/request";
import { Drawer, List } from "antd";
import styles from "./style.module.less";
import { TEvaluation } from "./type";
import { useTranslation } from "react-i18next";

type TCandidate = {
  name: string;
};

type TTalent = {
  id: number;
  candidate_id: number;
  status: "evaluate_succeed" | "evaluate_failed";
  evaluate_result: TEvaluation;
  file_path: string;
  content: string;
  job_id: number;
  created_at: string;
  updated_at: string;
  candidate: TCandidate;
};

const Profile = (props: { jobId: number }) => {
  const { jobId } = props;
  const [talents, setTalents] = useState<TTalent[]>([]);
  // const [modalShow, setModalShow] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<TTalent>();

  const { t: originalT } = useTranslation();

  const t = (key: string) => {
    return originalT(`profile.${key}`);
  };

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents`);
    if (code === 0) {
      setTalents(
        data.talents.map((talent: any) => ({
          ...talent,
          evaluate_result: JSON.parse(talent.evaluate_result),
        }))
      );
    }
  };

  const downloadFile = (id: number) => {
    window.open(`/api/public/jobs/${jobId}/talents/${id}/download`);
  };

  return (
    <div className={styles.listWrapper}>
      <List
        style={{ width: "100%" }}
        dataSource={talents}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={
                <div
                  onClick={() => {
                    setSelectedTalent(item);
                  }}
                >
                  {item.candidate.name}
                </div>
              }
              description={
                <div>
                  <div
                    onClick={() => downloadFile(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {
                      item.file_path.split("/")[
                        item.file_path.split("/").length - 1
                      ]
                    }
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Drawer
        open={!!selectedTalent}
        onClose={() => setSelectedTalent(undefined)}
        width={"1200px"}
      >
        {(() => {
          if (!selectedTalent) return null;

          const result = selectedTalent.evaluate_result;

          const groupedEvaluations = [
            {
              title: "Minimum",
              items: result.evaluation.filter(
                (item) => item.priority === "minimum"
              ),
            },
            {
              title: "Big Plus",
              items: result.evaluation.filter(
                (item) => item.priority === "big_plus"
              ),
            },
            {
              title: "Plus",
              items: result.evaluation.filter(
                (item) => item.priority === "plus"
              ),
            },
          ];

          return (
            <div>
              <div>
                Status:{" "}
                {selectedTalent?.status === "evaluate_succeed"
                  ? "Passed"
                  : "Failed"}
              </div>
              <div>Detail</div>
              <div>
                <div>Overall: {t(result.summary.overall)}</div>
                <div>Competency: {t(result.summary.competency)}</div>
                <div>Logistics: {t(result.summary.logistics)}</div>
                <div>Reasoning: {result.summary.reasoning}</div>

                <div>
                  Score
                  <div>Minimum: {result.summary.suitability_score.minimum}</div>
                  <div>
                    Big Plus: {result.summary.suitability_score.big_plus}
                  </div>
                  <div>Plus: {result.summary.suitability_score.plus}</div>
                  <div>Bonus: {result.summary.suitability_score.bonus}</div>
                  <div>Total: {result.summary.suitability_score.total}</div>
                </div>

                <div>Calculated Rank: {result.summary.calculated_rank}</div>
              </div>

              <div>
                {groupedEvaluations.map((group) => {
                  if (group.items.length === 0) return null;

                  return (
                    <div key={group.title}>
                      <div>{group.title}</div>
                      {group.items.map((item) => {
                        return (
                          <div>
                            <div>Criterion: {item.criterion}</div>
                            <div>Judgement: {t(item.judgement)}</div>
                            <div>
                              Confidence Level: {t(item.confidence_level)}
                            </div>
                            <div>Points awarded: {item.points_awarded}</div>
                            {item.reasons.map((reason) => {
                              return (
                                <div key={reason.reason}>
                                  <div>Reason: {reason.reason}</div>
                                  <div>Evidences: {reason.evidences}</div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
};

export default Profile;
