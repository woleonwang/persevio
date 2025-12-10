import { Get, Post } from "@/utils/request";
import { Button, Form, Input, InputNumber, message, Radio, Select } from "antd";
import { RefObject, useEffect, useReducer, useState } from "react";
import Calender from "../Calender";
import dayjs from "dayjs";
import Icon from "@/components/Icon";
import TimeSlot from "@/assets/icons/time-slot";
import Delete from "@/assets/icons/delete";

import styles from "./style.module.less";

type TFormValue = {
  mode: "written" | "interview";
  written_test_link: string;
  interview_type: "face_to_face" | "online" | "phone";
  duration: number;
  slots_gap: number;
  time_slots: {
    from: string;
    to: string;
  }[];
  interviewers: string;
  focus: string;
  contact_person: string;
  contact_number: string;
  notes: string;
};

interface IProps {
  talent: TTalent;
  jobName: string;
  interviewId?: number;
  handlerRef: RefObject<{ submit?: () => void }>;
}
const InterviewForm: React.FC<IProps> = (props) => {
  const { talent, jobName, interviewId, handlerRef } = props;

  const [form] = Form.useForm<TFormValue>();
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

  const submit = () => {
    form.validateFields().then(async (values) => {
      const { code } = await Post(
        `/api/jobs/${talent.job_id}/talents/${talent.id}/interviews`,
        values
      );
      if (code === 0) {
        message.success("Interview created successfully");
      }
    });
  };

  if (handlerRef.current) {
    handlerRef.current.submit = submit;
  }

  const mode = form.getFieldValue("mode") as TFormValue["mode"];
  const timeSlots =
    (form.getFieldValue("time_slots") as TFormValue["time_slots"]) ?? [];

  return (
    <div className={styles.interviewForm}>
      <div className={styles.formContainer}>
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
          <Form.Item label="Job Company Name" required>
            <Input value={settings?.company_name} disabled size="large" />
          </Form.Item>
          <Form.Item label="Job Title" required>
            <Input value={jobName} disabled size="large" />
          </Form.Item>

          <Form.Item
            label="Interview Mode"
            name="mode"
            rules={[
              { required: true, message: "Please select interview mode" },
            ]}
          >
            <Radio.Group
              optionType="button"
              options={[
                { label: "Written Test", value: "written" },
                { label: "Interview", value: "interview" },
              ]}
              size="large"
              className={styles.radioGroup}
            />
          </Form.Item>

          {mode === "written" && (
            <Form.Item
              label="Written Test Link"
              name="written_test_link"
              rules={[
                { required: true, message: "Please enter written test link" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
          )}

          {mode === "interview" && (
            <>
              <Form.Item
                label="Interview Type"
                rules={[
                  { required: true, message: "Please select interview type" },
                ]}
                name="interview_type"
              >
                <Radio.Group
                  optionType="button"
                  options={[
                    { label: "Face to Face", value: "face_to_face" },
                    { label: "Online", value: "online" },
                    { label: "Phone", value: "phone" },
                  ]}
                  size="large"
                  className={styles.radioGroup}
                />
              </Form.Item>

              <Form.Item
                label="Interview Duration"
                name="duration"
                rules={[
                  {
                    required: true,
                    message: "Please enter interview duration",
                  },
                ]}
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                label="Gap Between Slots"
                name="slots_gap"
                rules={[
                  {
                    required: true,
                    message: "Please enter gap between slots",
                  },
                ]}
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                />
              </Form.Item>

              <Form.Item
                label="Avaliable Interview Time Slots"
                name="time_slots"
                rules={[
                  {
                    required: true,
                    message: "Please select available time slots",
                  },
                ]}
              >
                <div className={styles.timeSlotsDescription}>
                  Please select your available time slots on the right, and
                  provide multiple options for the candidate to choose trom.
                </div>

                {timeSlots.map((item) => (
                  <div key={item.from} className={styles.timeSlotItem}>
                    <div className={styles.timeSlotItemContent}>
                      <Icon
                        icon={<TimeSlot />}
                        className={styles.timeSlotItemIcon}
                      />
                      <div>{dayjs(item.from).format("YYYY-MM-DD")}</div>
                      <div className={styles.timeSlotItemTime}>
                        {dayjs(item.from).format("HH:mm")} ~{" "}
                        {dayjs(item.to).format("HH:mm")}
                      </div>
                    </div>
                    <Button
                      className={styles.timeSlotItemDelete}
                      onClick={() => {
                        form.setFieldsValue({
                          time_slots: timeSlots.filter(
                            (_item) => _item !== item
                          ),
                        });
                        forceUpdate();
                      }}
                      icon={
                        <Icon
                          icon={<Delete />}
                          className={styles.timeSlotItemDeleteIcon}
                        />
                      }
                    />
                  </div>
                ))}
              </Form.Item>

              <Form.Item label="Interviewers" name="interviewers">
                <Input size="large" />
              </Form.Item>

              <Form.Item label="Interview Focus" name="focus">
                <Input.TextArea rows={4} size="large" />
              </Form.Item>

              <Form.Item label="Contact Person" name="contact_person">
                <Input size="large" />
              </Form.Item>

              <Form.Item label="Contact Number" name="contact_number">
                <Input size="large" />
              </Form.Item>
            </>
          )}

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </div>

      {mode === "interview" && (
        <div className={styles.calendarContainer}>
          <Calender
            value={timeSlots}
            onChange={(value) => {
              form.setFieldsValue({
                time_slots: value,
              });
              forceUpdate();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default InterviewForm;
