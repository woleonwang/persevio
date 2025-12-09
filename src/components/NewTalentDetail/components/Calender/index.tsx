import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Button, Modal, TimePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import classnames from "classnames";

import styles from "./style.module.less";
import TimeRangePicker from "@/components/TimeRangePicker";

type TValue = {
  from: string;
  to: string;
};

interface IProps {
  timeSlots?: TValue[];
}

const AVAILABLE_WEEKDAYS = [1, 2, 3, 4, 5];
const AVAILABLE_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const Calender: React.FC<IProps> = (props) => {
  const { timeSlots } = props;
  const [value, setValue] = useState<TValue[]>([]);

  const [currentWeek, setCurrentWeek] = useState<Dayjs>(
    dayjs().startOf("week")
  );
  const [isAddTimeModalOpen, setIsAddTimeModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Dayjs>();
  const [currentTimeRange, setCurrentTimeRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >();

  const headers = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

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
        fromDayjs.isAfter(currentTimeSlot.to) ||
        toDayjs.isBefore(currentTimeSlot.from);
      if (isNotOverlapping) {
        unOverlappingTimeSlots.push(item);
      }

      currentTimeSlot = {
        from: fromDayjs.isBefore(currentTimeSlot.from)
          ? fromDayjs
          : currentTimeSlot.from,
        to: toDayjs.isAfter(currentTimeSlot.to) ? toDayjs : currentTimeSlot.to,
      };
    });
    setValue([
      ...unOverlappingTimeSlots,
      {
        from: currentTimeSlot.from.toISOString(),
        to: currentTimeSlot.to.toISOString(),
      },
    ]);
  };

  return (
    <div>
      <div>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => setCurrentWeek(currentWeek.subtract(1, "week"))}
        />
        <div>{currentWeek.format("MM YYYY")}</div>
        <Button
          icon={<ArrowRightOutlined />}
          onClick={() => setCurrentWeek(currentWeek.add(1, "week"))}
        />
      </div>
      <div>
        <div className={styles.header}>
          <div className={styles.addAllDayLabel}>All day</div>
          {headers.map((header, index) => {
            const currentDay = currentWeek.add(index, "day");
            return (
              <div key={header} className={styles.dayItem}>
                <div>{header}</div>
                <div
                  className={classnames(styles.day, {
                    [styles.today]: currentDay.isSame(dayjs(), "day"),
                  })}
                >
                  {currentDay.format("D")}
                </div>
                <div
                  onClick={() => {
                    setSelectedDay(currentDay);
                    setIsAddTimeModalOpen(true);
                  }}
                >
                  Add times
                </div>
                <div
                  className={styles.addAllDay}
                  onClick={() => {
                    addNewTimeSlot(
                      currentDay.set("hour", AVAILABLE_HOURS[0]),
                      currentDay.set(
                        "hour",
                        AVAILABLE_HOURS[AVAILABLE_HOURS.length - 1]
                      )
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
              dayjs(item.from).isSame(currentDay, "day")
            );
            return (
              <div key={header} className={styles.weekDay}>
                {selectedTimeSlots.map((item) => {
                  return (
                    <div
                      key={item.from}
                      className={styles.selectedTimeSlot}
                      style={{
                        top:
                          dayjs(item.from).diff(
                            currentDay.set("hour", AVAILABLE_HOURS[0]),
                            "hour"
                          ) * 50,
                        height:
                          dayjs(item.to).diff(dayjs(item.from), "hour") * 50,
                      }}
                    >
                      {dayjs(item.from).format("HH:mm")} ~{" "}
                      {dayjs(item.to).format("HH:mm")}
                    </div>
                  );
                })}
                <div className={styles.timeSlotWrapper}>
                  {AVAILABLE_HOURS.slice(0, AVAILABLE_HOURS.length - 1).map(
                    (hour, hourIndex) => (
                      <div key={hour} className={styles.timeSlot}>
                        {index === 0 && (
                          <>
                            <div
                              className={classnames(styles.timeSlotLabel, {
                                [styles.firstHourLabel]: hourIndex === 0,
                              })}
                            >{`${hour}:00`}</div>
                            {hourIndex === AVAILABLE_HOURS.length - 2 && (
                              <div className={styles.timeSlotLabelSuffix}>{`${
                                hour + 1
                              }:00`}</div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  )}
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
      >
        <TimePicker.RangePicker
          value={currentTimeRange}
          onChange={(timeRange) => {
            if (timeRange && timeRange.length === 2 && selectedDay) {
              const withSelectedDay = timeRange.map((tm) => {
                if (!tm) return tm;
                return selectedDay
                  .hour(tm.hour())
                  .minute(tm.minute())
                  .second(0)
                  .millisecond(0);
              });
              setCurrentTimeRange(
                withSelectedDay as [dayjs.Dayjs, dayjs.Dayjs]
              );
            }
          }}
          format="HH:mm"
          minuteStep={30}
          inputReadOnly
        />
      </Modal>
    </div>
  );
};

export default Calender;
