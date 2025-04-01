import Form, { useForm } from "antd/es/form/Form";
import { useEffect, useState } from "react";
import { v4 as uuidV4 } from "uuid";

type TIdealProfile = {
  name: string;
  skills: {
    content: string;
    type: "required" | "optional";
    reason: string;
  }[];
};

interface IProps {
  candidateRequirementsJson: string;
}
const IdealProfileForm = (props: IProps) => {
  const { candidateRequirementsJson } = props;
  const [form] = useForm();
  const [profiles, setProfiles] = useState<TIdealProfile[]>([]);
  useEffect(() => {
    const groups: TIdealProfile[] = JSON.parse(
      candidateRequirementsJson
    ).groups;
    groups.forEach((group) => {
      group.skills.forEach((skill) => {
        const uuid = uuidV4();
        form.setFieldValue(skill.content, skill.reason);
      });
    });
  }, []);

  return (
    <Form form={form}>
      {profiles.map((group) => {
        return (
          <div>
            <div>{group.name}</div>
            {(group.skills ?? []).map((skill) => {
              return (
                <div>
                  <></>
                </div>
              );
            })}
          </div>
        );
      })}
    </Form>
  );
};

export default IdealProfileForm;
