import { useEffect, useState } from "react";
import { Get } from "../../../../utils/request";
import { List } from "antd";

type TProfile = {
  id: number;
  file_path: string;
  content: string;
  job_id: number;
  created_at: string;
  updated_at: string;
};

const Profile = (props: { jobId: number }) => {
  const { jobId } = props;
  const [profiles, setProfiles] = useState<TProfile[]>([]);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { code, data } = await Get(`/api/jobs/${jobId}/profiles`);
    if (code === 0) {
      setProfiles(data.profiles);
    }
  };

  const downloadFile = (id: number) => {
    window.open(`/api/public/jobs/${jobId}/profiles/${id}/download`);
  };

  return (
    <List
      style={{ width: "100%" }}
      dataSource={profiles}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
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
            description={<div></div>}
          />
        </List.Item>
      )}
    />
  );
};

export default Profile;
