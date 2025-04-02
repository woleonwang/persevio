import { useEffect, useState } from "react";
import { Get } from "../../../../utils/request";
import { List, Modal } from "antd";
import styles from "./style.module.less";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TCandidate = {
  name: string;
};

type TTalent = {
  id: number;
  candidate_id: number;
  status: "evaluate_succeed" | "evaluate_failed";
  evaluate_result: string;
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

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/talents`);
    if (code === 0) {
      setTalents(data.talents);
    }
  };

  const downloadFile = (id: number) => {
    window.open(`/api/public/jobs/${jobId}/talents/${id}/download`);
  };

  console.log("selectedTalent:", selectedTalent);
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
      <Modal
        open={!!selectedTalent}
        onCancel={() => setSelectedTalent(undefined)}
        width={"80vw"}
        height={"80vh"}
      >
        <div>
          <div>
            Status:{" "}
            {selectedTalent?.status === "evaluate_succeed"
              ? "Passed"
              : "Failed"}
          </div>
          <div>Detail</div>
          <Markdown className={styles.a} remarkPlugins={[remarkGfm]}>
            {selectedTalent?.evaluate_result}
          </Markdown>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
