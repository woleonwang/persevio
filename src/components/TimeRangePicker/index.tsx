import { Button, DatePicker, TimePicker } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { useState } from "react";

interface IProps {
  value?: { from: string; to: string }[];
  onChange?: (value: { from: string; to: string }[]) => void;
}

const TimeRangePicker = (props: IProps) => {
  const { value, onChange } = props;
  const [currentDate, setCurrentDate] = useState<Dayjs>();
  const [currentTimeRange, setCurrentTimeRange] = useState<
    [Dayjs | null, Dayjs | null] | null
  >();

  return (
    <div>
      <div style={{ display: "flex", alignContent: "center" }}>
        <DatePicker
          value={currentDate}
          onChange={(date) => setCurrentDate(date)}
        />
        <TimePicker.RangePicker
          value={currentTimeRange}
          onChange={(timeRange) => setCurrentTimeRange(timeRange)}
          format="HH:mm"
          minuteStep={30}
          inputReadOnly
        />
        <Button
          onClick={() => {
            if (
              !currentDate ||
              !currentTimeRange?.[0] ||
              !currentTimeRange?.[1]
            ) {
              return;
            }

            const from = currentDate
              .hour(currentTimeRange[0]?.hour())
              .minute(currentTimeRange[0]?.minute())
              .toISOString();

            const to = currentDate
              .hour(currentTimeRange[1]?.hour())
              .minute(currentTimeRange[1]?.minute())
              .toISOString();

            const newValue = [...(value ?? []), { from, to }];
            onChange?.(newValue);

            setCurrentDate(undefined);
            setCurrentTimeRange(undefined);
          }}
          disabled={!currentDate || !currentTimeRange}
          type="primary"
        >
          Add
        </Button>
      </div>

      <div>
        {value?.map((range, index) => (
          <div
            key={index}
            style={{
              display: "inline-flex",
              backgroundColor: "rgba(229, 247, 247, 1)",
              color: "rgba(31, 172, 106, 1)",
              padding: "8px 16px",
              marginTop: 8,
              borderRadius: 12,
              alignContent: "center",
              justifyItems: "center",
              gap: 20,
            }}
          >
            <div>
              {dayjs(range.from).format("YYYY/MM/DD HH:mm")} ~{" "}
              {dayjs(range.to).format("HH:mm")}
            </div>
            <CloseOutlined
              style={{ cursor: "pointer" }}
              onClick={() => {
                onChange?.((value ?? []).filter((item) => item !== range));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimeRangePicker;
