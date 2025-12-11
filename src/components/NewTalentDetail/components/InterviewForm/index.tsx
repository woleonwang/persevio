import { Get, Post } from "@/utils/request";
import { Button, Form, Input, InputNumber, message, Radio } from "antd";
import { RefObject, useEffect, useReducer, useState } from "react";
import Calender from "../Calender";
import dayjs from "dayjs";
import Icon from "@/components/Icon";
import TimeSlot from "@/assets/icons/time-slot";
import Delete from "@/assets/icons/delete";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";

type TFormValue = TInterview;

interface IProps {
  talent: TTalent;
  jobName: string;
  interview?: TInterview;
  handlerRef: RefObject<{ submit?: () => void }>;
}
const InterviewForm: React.FC<IProps> = (props) => {
  const { talent, jobName, interview, handlerRef } = props;

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`interview_form.${key}`);

  const [form] = Form.useForm<TFormValue>();
  const [settings, setSettings] = useState<ISettings>();

  const [_, forceUpdate] = useReducer(() => ({}), {});

  useEffect(() => {
    init();
  }, []);

  const readonly = !!interview;
  const init = async () => {
    if (interview) {
      form.setFieldsValue(interview);
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
        message.success(t("create_success"));
      }
    });
  };

  if (handlerRef.current) {
    handlerRef.current.submit = submit;
  }

  const mode = form.getFieldValue("mode") as TFormValue["mode"];
  const timeSlots =
    (form.getFieldValue("time_slots") as TFormValue["time_slots"]) ?? [];

  const interviewModeOptions = {
    written: t("mode_written"),
    interview: t("mode_interview"),
  };

  const interviewTypeOptions = {
    face_to_face: t("type_face_to_face"),
    online: t("type_online"),
    phone: t("type_phone"),
  };

  return (
    <div className={styles.interviewForm}>
      <div className={styles.formContainer}>
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
          <Form.Item label={t("job_company_name")} required>
            <Input value={settings?.company_name} disabled size="large" />
          </Form.Item>

          <Form.Item label={t("job_title")} required>
            <Input value={jobName} disabled size="large" />
          </Form.Item>

          <Form.Item
            label={t("interview_mode")}
            name={readonly ? undefined : "mode"}
            rules={[{ required: true, message: t("select_mode_required") }]}
            required
          >
            {readonly ? (
              <Input
                value={interviewModeOptions[interview?.mode]}
                disabled
                size="large"
              />
            ) : (
              <Radio.Group
                optionType="button"
                options={Object.entries(interviewModeOptions).map(
                  ([key, value]) => ({
                    label: value,
                    value: key,
                  })
                )}
                size="large"
                className={styles.radioGroup}
              />
            )}
          </Form.Item>

          {mode === "written" && (
            <Form.Item
              label={t("written_test_link")}
              name="written_test_link"
              rules={[{ required: true, message: t("enter_link_required") }]}
            >
              <Input size="large" disabled={readonly} />
            </Form.Item>
          )}

          {mode === "interview" && (
            <>
              <Form.Item
                label={t("interview_type")}
                rules={[{ required: true, message: t("select_type_required") }]}
                name={readonly ? undefined : "interview_type"}
                required
              >
                {readonly ? (
                  <Input
                    value={interviewTypeOptions[interview?.interview_type]}
                    disabled
                    size="large"
                  />
                ) : (
                  <Radio.Group
                    optionType="button"
                    options={Object.entries(interviewTypeOptions).map(
                      ([key, value]) => ({
                        label: value,
                        value: key,
                      })
                    )}
                    size="large"
                    className={styles.radioGroup}
                  />
                )}
              </Form.Item>

              <Form.Item
                label={t("interview_duration")}
                name="duration"
                rules={[
                  {
                    required: true,
                    message: t("enter_duration_required"),
                  },
                ]}
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                  disabled={readonly}
                />
              </Form.Item>

              <Form.Item
                label={t("slots_gap")}
                name="slots_gap"
                rules={[
                  {
                    required: true,
                    message: t("enter_gap_required"),
                  },
                ]}
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                  disabled={readonly}
                />
              </Form.Item>

              {readonly && interview.scheduled_at ? (
                <div>
                  <Form.Item label={t("interview_time_slots")} required>
                    <Input
                      value={(() => {
                        const startTime = dayjs(interview.scheduled_at);
                        const endTime = startTime.add(
                          interview.duration,
                          "minutes"
                        );

                        return `${startTime.format(
                          "YYYY/MM/DD HH:mm"
                        )} ~ ${endTime.format("HH:mm")}`;
                      })()}
                      disabled
                      size="large"
                    />
                  </Form.Item>
                </div>
              ) : (
                <Form.Item
                  label={t("available_time_slots")}
                  name="time_slots"
                  rules={[
                    {
                      required: true,
                      message: t("select_slots_required"),
                    },
                  ]}
                >
                  {!readonly && (
                    <div className={styles.timeSlotsDescription}>
                      {t("time_slots_description")}
                    </div>
                  )}

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
                          {(() => {
                            const result = dayjs(item.to).format("HH:mm");
                            return result === "00:00" ? "24:00" : result;
                          })()}
                        </div>
                      </div>
                      {!readonly && (
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
                      )}
                    </div>
                  ))}
                </Form.Item>
              )}

              <Form.Item label={t("interviewers")} name="interviewers">
                <Input size="large" disabled={readonly} />
              </Form.Item>

              <Form.Item label={t("interview_focus")} name="focus">
                <Input.TextArea rows={4} size="large" disabled={readonly} />
              </Form.Item>

              <Form.Item label={t("contact_person")} name="contact_person">
                <Input size="large" disabled={readonly} />
              </Form.Item>

              <Form.Item label={t("contact_number")} name="contact_number">
                <Input size="large" disabled={readonly} />
              </Form.Item>
            </>
          )}

          <Form.Item label={t("notes")} name="notes">
            <Input.TextArea rows={4} disabled={readonly} />
          </Form.Item>
        </Form>
      </div>

      {mode === "interview" && !readonly && (
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
