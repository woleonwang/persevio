import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Button, Modal, TimePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import classnames from "classnames";
import { useTranslation } from "react-i18next";

import styles from "./style.module.less";

export type TValue = {
  from: string;
  to: string;
};

interface IProps {
  value?: TValue[];
  onChange?: (value: TValue[]) => void;
}

const AVAILABLE_HOURS = Array.from({ length: 24 }, (_, index) => index);
const Calendar: React.FC<IProps> = (props) => {
  const { value: timeSlots, onChange } = props;
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`calendar.${key}`);

  const headers = [
    t("weekdays.sun"),
    t("weekdays.mon"),
    t("weekdays.tue"),
    t("weekdays.wed"),
    t("weekdays.thu"),
    t("weekdays.fri"),
    t("weekdays.sat"),
  ];
  const MONTHS = [
    t("months.jan"),
    t("months.feb"),
    t("months.mar"),
    t("months.apr"),
    t("months.may"),
    t("months.jun"),
    t("months.jul"),
    t("months.aug"),
    t("months.sep"),
    t("months.oct"),
    t("months.nov"),
    t("months.dec"),
  ];
  const [value, setValue] = useState<TValue[]>([]);

  const [currentWeek, setCurrentWeek] = useState<Dayjs>(
    dayjs().startOf("week"),
  );
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs>();
  const [currentTimeRange, setCurrentTimeRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >();

  type DragState = {
    currentDay: Dayjs;
    columnTop: number;
    startMinutes: number;
    currentMinutes: number;
    minMinutes: number;
  };
  const [dragState, setDragState] = useState<DragState | null>(null);

  const getMinutesFromY = (y: number, minMinutes = 0) => {
    const clamped = Math.max(0, Math.min(y, 24 * 50 - 1));
    const snapped = Math.round(((clamped / 50) * 60) / 15) * 15;
    return Math.max(minMinutes, snapped);
  };

  useEffect(() => {
    setValue(timeSlots ?? []);
  }, [timeSlots]);

  const addNewTimeSlot = (from: Dayjs, to: Dayjs) => {
    // 把有交集的 timeslot 合并
    const unOverlappingTimeSlots: TValue[] = [];
    let currentTimeSlot = { from, to };
    value.forEach((item) => {
      const fromDayjs = dayjs(item.from);
      const toDayjs = dayjs(item.to);
      const isNotOverlapping =
        !fromDayjs.isSame(currentTimeSlot.from, "day") ||
        fromDayjs.isAfter(currentTimeSlot.to) ||
        toDayjs.isBefore(currentTimeSlot.from);

      if (isNotOverlapping) {
        unOverlappingTimeSlots.push(item);
      } else {
        currentTimeSlot = {
          from: fromDayjs.isBefore(currentTimeSlot.from)
            ? fromDayjs
            : currentTimeSlot.from,
          to: toDayjs.isAfter(currentTimeSlot.to)
            ? toDayjs
            : currentTimeSlot.to,
        };
      }
    });

    const newTimeSlot = [
      ...unOverlappingTimeSlots,
      {
        from: currentTimeSlot.from.toISOString(),
        to: currentTimeSlot.to.toISOString(),
      },
    ];

    setValue(newTimeSlot);
    onChange?.(newTimeSlot);
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const y = e.clientY - dragState.columnTop;
      setDragState((prev) =>
        prev
          ? { ...prev, currentMinutes: getMinutesFromY(y, prev.minMinutes) }
          : null,
      );
    };

    const handleMouseUp = () => {
      if (dragState) {
        const fromMin = Math.min(
          dragState.startMinutes,
          dragState.currentMinutes,
        );
        const toMin = Math.max(
          dragState.startMinutes,
          dragState.currentMinutes,
        );
        if (toMin - fromMin >= 15) {
          const from = dragState.currentDay
            .startOf("day")
            .add(fromMin, "minute");
          const to = dragState.currentDay.startOf("day").add(toMin, "minute");
          addNewTimeSlot(from, to);
        }
        setDragState(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState]);

  return (
    <div>
      <div className={styles.weekSelector}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}
          size="large"
        />
        <div className={styles.monthYear}>
          {MONTHS[currentWeek.endOf("week").month()]} {currentWeek.year()}
        </div>
        <Button
          icon={<ArrowRightOutlined />}
          onClick={() => setCurrentWeek(currentWeek.add(1, "week"))}
          size="large"
        />
      </div>
      <div>
        <div className={styles.header}>
          <div className={styles.addAllDayLabel}>{t("all_day")}</div>
          {headers.map((header, index) => {
            const now = dayjs();
            const currentDay = currentWeek.add(index, "day");
            const disabled =
              currentDay.isBefore(dayjs(), "day") ||
              (currentDay.isSame(dayjs(), "day") && dayjs().hour() === 23);

            return (
              <div key={header} className={styles.dayItem}>
                <div className={styles.dayHeader}>{header}</div>
                <div
                  className={classnames(styles.day, {
                    [styles.today]: currentDay.isSame(dayjs(), "day"),
                  })}
                >
                  {currentDay.format("D")}
                </div>
                <div
                  onClick={() => {
                    if (disabled) return;
                    setSelectedDay(currentDay);
                    setIsAddTimeModalOpen(true);
                  }}
                  className={classnames(styles.addTimesButton, {
                    [styles.disabled]: disabled,
                  })}
                >
                  {t("add_times")}
                </div>
                <div
                  className={classnames(styles.addAllDay, {
                    [styles.disabled]: disabled,
                  })}
                  onClick={() => {
                    if (disabled) return;
                    addNewTimeSlot(
                      currentDay.set(
                        "hour",
                        now.isSame(currentDay, "day")
                          ? now.hour() + 1
                          : AVAILABLE_HOURS[0],
                      ),
                      currentDay.add(1, "day").set("hour", 0),
                    );
                  }}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.body}>
          {headers.map((header, index) => {
            const currentDay = currentWeek.add(index, "day");
            const selectedTimeSlots = value.filter((item) =>
              dayjs(item.from).isSame(currentDay, "day"),
            );
            const disabled =
              currentDay.isBefore(dayjs(), "day") ||
              (currentDay.isSame(dayjs(), "day") && dayjs().hour() === 23);
            return (
              <div
                key={header}
                className={styles.weekDay}
                onMouseDown={(e) => {
                  if (disabled) return;
                  e.preventDefault();
                  const now = dayjs();
                  const isToday = currentDay.isSame(now, "day");
                  const minMinutes = isToday ? (now.hour() + 1) * 60 : 0;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const startMinutes = getMinutesFromY(y, minMinutes);
                  setDragState({
                    currentDay,
                    columnTop: rect.top,
                    startMinutes,
                    currentMinutes: startMinutes,
                    minMinutes,
                  });
                }}
              >
                {dragState &&
                  dragState.currentDay.isSame(currentDay, "day") && (
                    <div
                      className={styles.dragPreviewSlot}
                      style={{
                        top:
                          (Math.min(
                            dragState.startMinutes,
                            dragState.currentMinutes,
                          ) *
                            50) /
                          60,
                        height: Math.max(
                          (Math.abs(
                            dragState.currentMinutes - dragState.startMinutes,
                          ) *
                            50) /
                            60,
                          12.5,
                        ),
                        left: 0,
                        right: 4,
                      }}
                    />
                  )}
                {selectedTimeSlots.map((item) => {
                  const endTime = dayjs(item.to).format("HH:mm");
                  return (
                    <div
                      key={item.from}
                      className={styles.selectedTimeSlot}
                      style={{
                        left: 0,
                        right: 4,
                        top:
                          (dayjs(item.from).diff(
                            currentDay.set("hour", AVAILABLE_HOURS[0]),
                            "minute",
                          ) *
                            50) /
                          60,
                        height:
                          (dayjs(item.to).diff(dayjs(item.from), "minute") *
                            50) /
                          60,
                      }}
                    >
                      {dayjs(item.from).format("HH:mm")} ~{" "}
                      {endTime === "00:00" ? "24:00" : endTime}
                    </div>
                  );
                })}
                <div className={styles.timeSlotWrapper}>
                  {AVAILABLE_HOURS.map((hour, hourIndex) => {
                    const startTime = currentDay.set("hour", hour);
                    return (
                      <div
                        key={hour}
                        className={classnames(styles.timeSlot, {
                          [styles.shadow]: startTime.isBefore(dayjs()),
                        })}
                      >
                        {index === 0 && hourIndex > 0 && (
                          <div
                            className={classnames(styles.timeSlotLabel, {
                              [styles.firstHourLabel]: hourIndex === 0,
                            })}
                          >{`${hour}:00`}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={isAddTimeModalOpen}
        onCancel={() => setIsAddTimeModalOpen(false)}
        onOk={() => {
          setIsAddTimeModalOpen(false);
          if (currentTimeRange?.[0] && currentTimeRange?.[1]) {
            addNewTimeSlot(currentTimeRange?.[0], currentTimeRange?.[1]);
          }
          setCurrentTimeRange(null);
        }}
        centered
        title={t("add_time_title")}
      >
        <div style={{ margin: "20px 0" }}>
          <TimePicker.RangePicker
            needConfirm={false}
            style={{ width: "100%" }}
            value={currentTimeRange}
            onChange={(timeRange) => {
              if (
                timeRange &&
                timeRange.length === 2 &&
                selectedDay &&
                timeRange[0] &&
                timeRange[1] &&
                !timeRange[0].isSame(timeRange[1], "minute")
              ) {
                const withSelectedDay = timeRange.map((tm) => {
                  if (!tm) return tm;
                  return selectedDay
                    .hour(tm.hour())
                    .minute(tm.minute())
                    .second(0)
                    .millisecond(0);
                });
                setCurrentTimeRange(
                  withSelectedDay as [dayjs.Dayjs, dayjs.Dayjs],
                );
              }
            }}
            format="HH:mm"
            minuteStep={15}
            inputReadOnly
            disabledTime={() => {
              const isToday = dayjs().isSame(selectedDay, "day");
              return {
                disabledHours: () =>
                  isToday
                    ? AVAILABLE_HOURS.filter((hour) => hour <= dayjs().hour())
                    : [],
              };
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;
