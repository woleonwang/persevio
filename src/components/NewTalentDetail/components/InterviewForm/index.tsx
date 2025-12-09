import TimeRangePicker from "@/components/TimeRangePicker";
import { Get } from "@/utils/request";
import { Form, Input, InputNumber, Radio, Select } from "antd";
import { useEffect, useReducer, useState } from "react";
import Calender from "../Calender";

type TFormValue = {
  mode: "written" | "interview";
  written_test_link: string;
  interview_type: "face_to_face" | "online" | "phone";
  duration: number;
  slots_gap: number;
  time_slots: {
    from: string;
    to: string;
  };
  focus: string;
  contact_person: string;
  contact_number: string;
  notes: string;
};

interface IProps {
  talent: TTalent;
  jobName: string;
  interviewId?: number;
}
const InterviewForm: React.FC<IProps> = (props) => {
  const { talent, jobName, interviewId } = props;

  const [form] = Form.useForm<TFormValue>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [settings, setSettings] = useState<ISettings>();

  const [_, forceUpdate] = useReducer(() => ({}), {});

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (interviewId) {
      const { code, data } = await Get(`/api/interviews/${interviewId}`);
      if (code === 0) {
        form.setFieldsValue(data.interview);
      }
    }

    const { code, data } = await Get(`/api/settings`);
    if (code === 0) {
      setSettings(data);
    }
  };

  const mode = form.getFieldValue("mode");

  return (
    <div>
      <div>
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
          <Form.Item label="Job Company Name" required>
            <Input value={settings?.company_name} disabled />
          </Form.Item>
          <Form.Item label="Job Title" required>
            <Input value={jobName} disabled />
          </Form.Item>

          <Form.Item label="Interview Mode" name="mode" required>
            <Radio.Group
              optionType="button"
              options={[
                { label: "Written Test", value: "written" },
                { label: "Interview", value: "interview" },
              ]}
            />
          </Form.Item>

          {mode === "written" && (
            <Form.Item
              label="Written Test Link"
              name="written_test_link"
              required
            >
              <Input />
            </Form.Item>
          )}

          {mode === "interview" && (
            <>
              <Form.Item label="Interview Type" required>
                <Radio.Group
                  optionType="button"
                  options={[
                    { label: "Face to Face", value: "face_to_face" },
                    { label: "Online", value: "online" },
                    { label: "Phone", value: "phone" },
                  ]}
                />
              </Form.Item>

              <Form.Item label="Interview Duration" name="duration" required>
                <InputNumber suffix="min" />
              </Form.Item>

              <Form.Item label="Gap Between Slots" name="slots_gap" required>
                <InputNumber suffix="min" />
              </Form.Item>

              <Form.Item
                label="Avaliable Interview Time Slots"
                name="time_slots"
                required
              >
                <div>
                  Please select your available time slots on the right, and
                  provide multiple options for the candidate to choose trom.
                </div>
              </Form.Item>
            </>
          )}

          <Form.Item label="Notes" name="notes" required>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </div>

      {mode === "interview" && (
        <div>
          <Calender />
        </div>
      )}
    </div>
  );
};

export default InterviewForm;
