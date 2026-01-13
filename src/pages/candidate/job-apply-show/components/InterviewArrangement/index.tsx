import { useTranslation } from "react-i18next";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import styles from "./style.module.less";
import { Form, Input, InputNumber, message } from "antd";
import {
  Fragment,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import dayjs, { Dayjs } from "dayjs";
import classnames from "classnames";
import Icon from "@/components/Icon";
import Sunrise from "@/assets/icons/sunrise";
import Sunset from "@/assets/icons/sunset";
import { Post } from "@/utils/request";

interface IProps {
  interview: TInterview;
  jobApply: IJobApplyListItem;
  handlerRef: React.RefObject<{
    submit?: () => Promise<boolean>;
  }>;
}

type TFormValue = TInterview;

type TSlots = Record<
  string,
  {
    morning: {
      from: Dayjs;
      to: Dayjs;
    }[];
    afternoon: {
      from: Dayjs;
      to: Dayjs;
    }[];
  }
>;
const InterviewArrangement: React.FC<IProps> = ({
  interview,
  jobApply,
  handlerRef,
}) => {
  const [currentStartDate, setCurrentStartDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs>();
  const slotsContainerRef = useRef<HTMLDivElement>(null);

  const [_, forceUpdate] = useReducer(() => ({}), {});
  const [form] = Form.useForm<TFormValue>();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>) =>
    originalT(`job_apply.interview_arrangement.${key}`, params);

  const readonly = !!interview.scheduled_at;

  useEffect(() => {
    form.setFieldsValue(interview);
  }, [interview]);

  const slots: TSlots = useMemo(() => {
    const result: TSlots = {};
    interview.time_slots.forEach((slot) => {
      const from = dayjs(slot.from);
      const to = dayjs(slot.to);
      const date = from.format("YYYY-MM-DD");
      if (!result[date]) {
        result[date] = {
          morning: [],
          afternoon: [],
        };
      }

      let currentFrom = from;
      let currentTo = currentFrom.add(interview.duration, "minutes");
      while (!currentTo.isAfter(to)) {
        if (currentFrom.get("hour") < 12) {
          result[date].morning.push({ from: currentFrom, to: currentTo });
        } else {
          result[date].afternoon.push({ from: currentFrom, to: currentTo });
        }
        currentFrom = currentFrom.add(interview.slots_gap, "minutes");
        currentTo = currentFrom.add(interview.duration, "minutes");
      }
    });
    return result;
  }, [interview.time_slots]);

  const submit = async (): Promise<boolean> => {
    const { code } = await Post(
      `/api/candidate/job_applies/${jobApply.job_id}/interviews/${interview.id}/confirm_time`,
      {
        scheduled_at: selectedDate?.toISOString(),
      }
    );
    if (code === 0) {
      message.success(t("confirm_success"));
      return true;
    } else {
      message.error(t("confirm_failed"));
      return false;
    }
  };

  if (handlerRef.current) {
    handlerRef.current.submit = submit;
  }

  const mode = interview.mode;

  const interviewModeOptions = {
    written: originalT("interview_form.mode_written"),
    interview: originalT("interview_form.mode_interview"),
  };

  const interviewTypeOptions = {
    face_to_face: originalT("interview_form.type_face_to_face"),
    online: originalT("interview_form.type_online"),
    phone: originalT("interview_form.type_phone"),
  };

  const timeslotsSelector = (
    <div className={classnames(styles.calendarContainer)}>
      <div className={styles.dateContainer}>
        <LeftOutlined
          className={styles.dateItemIcon}
          onClick={() => {
            setCurrentStartDate(currentStartDate.subtract(14, "days"));
          }}
        />
        <div className={styles.dateItems}>
          {Array.from({ length: 14 }).map((_, index) => {
            const currentDate = currentStartDate.add(index, "days");
            const isShowBorder = index !== 0 && currentDate.get("date") === 1;
            const isShowMonth = index === 0 || currentDate.get("date") === 1;
            const hasSlots = interview.time_slots.some((slot) =>
              dayjs(slot.from).isSame(currentDate, "day")
            );
            return (
              <Fragment key={index}>
                {isShowBorder && <div className={styles.dateItemBorder} />}
                <div className={styles.dateItem}>
                  <div
                    style={{
                      visibility: isShowMonth ? "visible" : "hidden",
                      marginBottom: 4,
                      color: "rgba(102, 102, 102, 1)",
                    }}
                  >
                    {currentDate.format("MMM").toUpperCase()}
                  </div>
                  <div
                    className={classnames(styles.dateItemContent, {
                      [styles.hasSlots]: hasSlots,
                    })}
                    onClick={() => {
                      if (hasSlots) {
                        const slotItem = document.getElementById(
                          `slot-item-${currentDate.format("YYYY-MM-DD")}`
                        );
                        if (slotItem) {
                          slotItem.scrollIntoView({
                            behavior: "smooth",
                            inline: "center",
                          });
                        }
                      }
                    }}
                  >
                    <div className={styles.dateItemContentDay}>
                      {currentDate.format("ddd")}
                    </div>
                    <div className={styles.dateItemContentDate}>
                      {currentDate.format("DD")}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
        <RightOutlined
          className={styles.dateItemIcon}
          onClick={() => {
            setCurrentStartDate(currentStartDate.add(14, "days"));
          }}
        />
      </div>
      <div className={styles.slotsContainer} ref={slotsContainerRef}>
        {Object.entries(slots)
          .sort((a, b) => {
            return dayjs(a[0]).diff(dayjs(b[0]));
          })
          .map(([date, slots]) => {
            const totalSlots = slots.morning.length + slots.afternoon.length;
            return (
              <div
                key={date}
                className={styles.slotsItem}
                id={`slot-item-${date}`}
              >
                <div className={styles.slotsItemHeader}>
                  <div>
                    {t("interview_starting_on", {
                      count: totalSlots.toString(),
                    })}
                  </div>
                  <div className={styles.slotsItemHeaderDate}>
                    {dayjs(date).format(originalT("date_format.with_day"))}
                  </div>
                </div>
                <div className={styles.slotsItemContent}>
                  {[slots.morning, slots.afternoon].map((slots, index) => {
                    if (slots.length === 0) {
                      return null;
                    }
                    return (
                      <div key={index}>
                        <div className={styles.slotsItemContentGroup}>
                          <Icon
                            icon={index === 0 ? <Sunrise /> : <Sunset />}
                            className={styles.slotsItemContentIcon}
                          />
                          {index === 0 ? t("morning") : t("afternoon")}
                        </div>
                        {slots.map((slot) => {
                          return (
                            <div
                              key={slot.from.format("HH:mm")}
                              onClick={() => setSelectedDate(slot.from)}
                              className={classnames(styles.slotItem, {
                                [styles.selected]: selectedDate?.isSame(
                                  slot.from,
                                  "minute"
                                ),
                              })}
                            >
                              <div className={styles.slotItemTime}>
                                {dayjs(slot.from).format("HH:mm")} ~{" "}
                                {dayjs(slot.to).format("HH:mm")}
                              </div>
                              <div className={styles.slotItemDuration}>
                                {interview.duration} m
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div
        className={classnames(styles.formContainer, {
          [styles.readonly]: readonly,
        })}
      >
        <Form form={form} layout="vertical" onFieldsChange={forceUpdate}>
          <Form.Item
            label={originalT("interview_form.job_company_name")}
            required
          >
            <Input value={jobApply.company_name} disabled size="large" />
          </Form.Item>

          <Form.Item label={originalT("interview_form.job_title")} required>
            <Input value={jobApply.job_name} disabled size="large" />
          </Form.Item>

          <Form.Item
            label={originalT("interview_form.interview_mode")}
            required
          >
            <Input
              value={interviewModeOptions[interview?.mode]}
              disabled
              size="large"
            />
          </Form.Item>

          {mode === "written" && (
            <Form.Item
              label={originalT("interview_form.written_test_link")}
              name="written_test_link"
            >
              <Input size="large" disabled />
            </Form.Item>
          )}

          {mode === "interview" && (
            <>
              <Form.Item
                label={originalT("interview_form.interview_type")}
                required
              >
                <Input
                  value={interviewTypeOptions[interview?.interview_type]}
                  disabled
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label={originalT("interview_form.interview_duration")}
                name="duration"
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                  disabled
                />
              </Form.Item>

              <Form.Item
                label={originalT("interview_form.slots_gap")}
                name="slots_gap"
              >
                <InputNumber
                  suffix="min"
                  size="large"
                  style={{ width: "100%" }}
                  disabled
                />
              </Form.Item>

              {!!interview.scheduled_at ? (
                <div>
                  <Form.Item
                    label={originalT("interview_form.interview_time_slots")}
                    required
                  >
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
                  label={originalT("interview_form.interview_time_slots")}
                  required
                >
                  <div
                    className={classnames(
                      styles.mobileVisible,
                      styles.mobileCalendarContainer
                    )}
                  >
                    {timeslotsSelector}
                  </div>
                </Form.Item>
              )}

              <Form.Item
                label={originalT("interview_form.interviewers")}
                name="interviewers"
              >
                <Input size="large" disabled />
              </Form.Item>

              <Form.Item
                label={originalT("interview_form.interview_focus")}
                name="focus"
              >
                <Input.TextArea rows={4} size="large" disabled />
              </Form.Item>

              <Form.Item
                label={originalT("interview_form.contact_person")}
                name="contact_person"
              >
                <Input size="large" disabled />
              </Form.Item>

              <Form.Item
                label={originalT("interview_form.contact_number")}
                name="contact_number"
              >
                <Input size="large" disabled />
              </Form.Item>
            </>
          )}

          <Form.Item label={originalT("interview_form.notes")} name="notes">
            <Input.TextArea rows={4} disabled />
          </Form.Item>
        </Form>
      </div>
      {!readonly && (
        <div className={styles.desktopVisible}>{timeslotsSelector}</div>
      )}
    </div>
  );
};

export default InterviewArrangement;
