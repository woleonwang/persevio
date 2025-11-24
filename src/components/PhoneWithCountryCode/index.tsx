import { Input, Select } from "antd";
import countryCodeOptions from "./countryCode";
import styles from "./style.module.less";

interface IValue {
  countryCode?: string;
  phoneNumber?: string;
  readonly?: boolean;
}

interface IProps {
  value?: IValue;
  readonly?: boolean;
  onChange?: (value: IValue) => void;
}
const PhoneWithCountryCode = (props: IProps) => {
  const { value, onChange, readonly } = props;

  const handleCountryCodeChange = (countryCode: string) => {
    onChange?.({ ...value, countryCode: countryCode });
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    onChange?.({ ...value, phoneNumber: phoneNumber });
  };

  return (
    <div className={styles.container}>
      <Select
        options={countryCodeOptions.map((item) => ({
          label: `${item.name} (${item.dial_code})`,
          value: item.dial_code,
          key: `${item.name}`,
        }))}
        value={value?.countryCode}
        onChange={handleCountryCodeChange}
        size="large"
        className={styles.countryCodeSelect}
        placeholder="Country Code"
        optionFilterProp="label"
        showSearch
        disabled={readonly}
      />
      <Input
        value={value?.phoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        size="large"
        className={styles.phoneNumberInput}
        placeholder="Phone Number"
        disabled={readonly}
      />
    </div>
  );
};

export default PhoneWithCountryCode;
