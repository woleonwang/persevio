import { Button, Input, message, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { v4 as uuidV4 } from "uuid";
import { Get, Post } from "../../../../../../utils/request";
import { useTranslation } from "react-i18next";
import styles from "./style.module.less";

export type TValue = {
  cityId?: number;
  cityName?: string;
  addressId?: number;
  addressName?: string;
};

export type TCity = {
  id: number;
  name: string;
  addresses: {
    id: number;
    name: string;
  }[];
};

export interface IProps {
  cities: TCity[];
  isCoworker?: boolean;
  value?: TValue;
  canDelete?: boolean;
  onChange?: (val: TValue) => void;
  onCreateRecord: () => void;
  onDeleteRecord: () => void;
}

export type TValueWithKey = {
  key: string;
  cityId?: number;
  cityName?: string;
  addressId?: number;
  addressName?: string;
};

export interface IMultiProps {
  isCoworker?: boolean;
  value?: TValueWithKey[];
  onChange?: (val: TValueWithKey[]) => void;
}
const MultipleCityAndAddressSelect = (props: IMultiProps) => {
  const { value, isCoworker = false, onChange } = props;
  const [cities, setCities] = useState<TCity[]>([]);
  const { t: originalT } = useTranslation();
  // const t = (key: string, params?: Record<string, string>): string => {
  //   return originalT(`city_and_address_select.${key}`, params);
  // };

  useEffect(() => {
    fetchCityAndAddress();
  }, []);

  useEffect(() => {
    if (!(value && value.length > 0)) {
      onChange?.([{ key: uuidV4() }]);
    }
  }, [value]);

  const formatUrl = (url: string) => {
    return isCoworker ? url.replace("/api", "/api/coworker") : url;
  };

  const fetchCityAndAddress = async () => {
    const { code, data } = await Get(formatUrl("/api/city_and_address"));
    if (code === 0) {
      setCities(data.cities);
    }
  };

  const onSingleChange = (key: string, newValue: TValue) => {
    onChange?.(
      (value ?? []).map((item) =>
        item.key === key ? { ...item, ...newValue } : item
      )
    );
  };

  const deleteRecord = (key: string) => {
    onChange?.((value ?? []).filter((item) => item.key !== key));
  };

  if (!value || value.length === 0) return null;

  return (
    <div>
      {value.map((item) => {
        return (
          <CityAndAddressSelect
            key={item.key}
            cities={cities}
            isCoworker={isCoworker}
            value={item}
            canDelete={value.length > 1}
            onChange={(value) => onSingleChange(item.key, value)}
            onCreateRecord={() => fetchCityAndAddress()}
            onDeleteRecord={() => deleteRecord(item.key)}
          />
        );
      })}
      <Button onClick={() => onChange?.([...value, { key: uuidV4() }])}>
        {originalT("add")}
      </Button>
    </div>
  );
};

const CityAndAddressSelect = (props: IProps) => {
  const {
    cities,
    value: { cityId, addressId } = {},
    isCoworker = false,
    canDelete = false,
    onChange,
    onCreateRecord,
    onDeleteRecord,
  } = props;
  const [isCreateCity, setIsCreateCity] = useState(false);
  const [isCreateAddress, setIsCreateAddress] = useState(false);
  const [inputCityName, setInputCityName] = useState("");
  const [inputAddressName, setInputAddressName] = useState("");
  const selectCityRef = useRef<number>();
  const selectAddressRef = useRef<number>();

  const { t: originalT } = useTranslation();
  const t = (key: string, params?: Record<string, string>): string => {
    return originalT(`city_and_address_select.${key}`, params);
  };

  useEffect(() => {
    if (selectCityRef.current) {
      onCityChange(selectCityRef.current);
      selectCityRef.current = undefined;
    }
    if (selectAddressRef.current) {
      onAddressChange(selectAddressRef.current);
      selectAddressRef.current = undefined;
    }
  }, [cities]);

  const formatUrl = (url: string) => {
    return isCoworker ? url.replace("/api", "/api/coworker") : url;
  };

  const onCityChange = (cityId: number) => {
    onChange?.({
      cityId,
      cityName: cities.find((item) => item.id === cityId)?.name ?? "",
      addressId: undefined,
      addressName: undefined,
    });
  };

  const onAddressChange = (addressId: number) => {
    const city = cities.find((item) => item.id === cityId);
    if (!city) return;

    const address = city.addresses.find((item) => item.id === addressId);
    if (!address) return;

    onChange?.({
      cityId,
      cityName: city.name,
      addressId: addressId,
      addressName: address.name,
    });
  };

  const createCity = async () => {
    if (!inputCityName) return;

    const { code, data } = await Post(formatUrl("/api/cities"), {
      name: inputCityName,
    });

    if (code === 0) {
      message.success(originalT("create_succeed"));
      selectCityRef.current = data.city.id;
      setInputCityName("");
      setIsCreateCity(false);
      onCreateRecord();
    }
  };

  const createAddress = async () => {
    if (!cityId || !inputAddressName) return;

    const { code, data } = await Post(formatUrl("/api/addresses"), {
      city_id: cityId,
      name: inputAddressName,
    });

    if (code === 0) {
      message.success(originalT("create_succeed"));
      selectAddressRef.current = data.address.id;
      setInputAddressName("");
      setIsCreateAddress(false);
      onCreateRecord();
    }
  };

  return (
    <div className={styles.container}>
      <Select
        options={cities.map((city) => ({ label: city.name, value: city.id }))}
        value={cityId}
        style={{ width: 200, flex: "none" }}
        onChange={onCityChange}
        placeholder={t("city")}
        dropdownRender={(list) => {
          return (
            <div>
              {list}
              <div className={styles.footer}>
                {isCreateCity ? (
                  <>
                    <Input
                      value={inputCityName}
                      onChange={(e) => setInputCityName(e.target.value)}
                      size="small"
                      onPressEnter={() => createCity()}
                    />
                    <Button
                      type="primary"
                      onClick={() => createCity()}
                      size="small"
                      icon={<CheckOutlined />}
                      shape="circle"
                    />
                    <Button
                      onClick={() => setIsCreateCity(false)}
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined />}
                    />
                  </>
                ) : (
                  <Button
                    onClick={() => setIsCreateCity(true)}
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
      <Select
        disabled={!cityId}
        options={(
          cities.find((city) => city.id === cityId)?.addresses ?? []
        ).map((address) => ({ label: address.name, value: address.id }))}
        value={addressId}
        onChange={onAddressChange}
        placeholder={t("address")}
        className={styles.addressSelect}
        dropdownRender={(list) => {
          return (
            <div>
              {list}
              <div className={styles.footer}>
                {isCreateAddress ? (
                  <>
                    <Input
                      value={inputAddressName}
                      onChange={(e) => setInputAddressName(e.target.value)}
                      size="small"
                      onPressEnter={() => createAddress()}
                    />
                    <Button
                      type="primary"
                      onClick={() => createAddress()}
                      size="small"
                      icon={<CheckOutlined />}
                      shape="circle"
                    />
                    <Button
                      onClick={() => setIsCreateAddress(false)}
                      size="small"
                      shape="circle"
                      icon={<CloseOutlined />}
                    />
                  </>
                ) : (
                  <Button
                    onClick={() => setIsCreateAddress(true)}
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
      {canDelete && (
        <Button
          style={{ flex: "none" }}
          icon={<DeleteOutlined />}
          onClick={() => onDeleteRecord()}
        />
      )}
    </div>
  );
};

export default MultipleCityAndAddressSelect;
