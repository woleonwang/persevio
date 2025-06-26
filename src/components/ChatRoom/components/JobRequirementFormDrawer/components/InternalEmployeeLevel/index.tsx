import { Button, Input, message, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { Get, Post } from "../../../../../../utils/request";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

export type TInternalEmployeeLevelValue = {
  id?: number;
  name?: string;
};

export interface IProps {
  isCoworker?: boolean;
  value?: TInternalEmployeeLevelValue;
  onChange?: (val: TInternalEmployeeLevelValue) => void;
}
const InternalEmployeeLevel = (props: IProps) => {
  const { value: { id } = {}, isCoworker = false, onChange } = props;
  const [internalEmployeeLevels, setInternalEmployeeLevels] = useState<
    { id: number; name: string }[]
  >([]);
  const [isCreate, setIsCreate] = useState(false);
  const [inputName, setInputName] = useState("");

  const selectRef = useRef<number>();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`internal_employee_level.${key}`, params);
  };

  useEffect(() => {
    fetchInternalEmployeeLevels();
  }, []);

  useEffect(() => {
    if (selectRef.current) {
      onValueChange(selectRef.current);
      selectRef.current = undefined;
    }
  }, [internalEmployeeLevels]);

  const formatUrl = (url: string) => {
    return isCoworker ? url.replace("/api", "/api/coworker") : url;
  };

  const fetchInternalEmployeeLevels = async () => {
    const { code, data } = await Get(
      formatUrl("/api/internal_employee_levels")
    );
    if (code === 0) {
      setInternalEmployeeLevels(data.internal_employee_levels);
    }
  };

  const onValueChange = (id: number) => {
    onChange?.({
      id,
      name: internalEmployeeLevels.find((item) => item.id === id)?.name ?? "",
    });
  };

  const create = async () => {
    if (!inputName) return;

    const { code, data } = await Post(
      formatUrl("/api/internal_employee_levels"),
      {
        name: inputName,
      }
    );

    if (code === 0) {
      message.success(originalT("create_succeed"));
      selectRef.current = data.internal_employee_level.id;
      await fetchInternalEmployeeLevels();
      setInputName("");
      setIsCreate(false);
    }
  };

  return (
    <div className={styles.container}>
      <Select
        options={internalEmployeeLevels.map((item) => ({
          label: item.name,
          value: item.id,
        }))}
        value={id}
        style={{ flex: "auto" }}
        onChange={onValueChange}
        dropdownRender={(list) => {
          return (
            <div>
              {list}
              <div className={styles.footer}>
                {isCreate ? (
                  <>
                    <Input
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      size="small"
                      onPressEnter={() => create()}
                    />
                    <Button
                      type="primary"
                      onClick={() => create()}
                      size="small"
                      icon={<CheckOutlined />}
                      shape="circle"
                    />
                    <Button
                      onClick={() => setIsCreate(false)}
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined />}
                    />
                  </>
                ) : (
                  <Button
                    onClick={() => setIsCreate(true)}
                    size="small"
                    type="primary"
                  >
                    {originalT("create")}
                  </Button>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};

export default InternalEmployeeLevel;
