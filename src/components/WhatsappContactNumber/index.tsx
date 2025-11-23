import { Input, Select } from "antd";
import countryCodeOptions from "./countryCode";
import styles from "./style.module.less";

interface IValue {
  whatsappCountryCode?: string;
  whatsappPhoneNumber?: string;
}

interface IProps {
  value?: IValue;
  onChange?: (value: IValue) => void;
}
const WhatsappContactNumber = (props: IProps) => {
  const { value, onChange } = props;

  const handleCountryCodeChange = (countryCode: string) => {
    onChange?.({ ...value, whatsappCountryCode: countryCode });
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    onChange?.({ ...value, whatsappPhoneNumber: phoneNumber });
  };

  return (
    <div className={styles.container}>
      <Select
        options={countryCodeOptions.map((item) => ({
          label: `${item.name} (${item.dial_code})`,
          value: item.dial_code,
          key: `${item.name}`,
        }))}
        value={value?.whatsappCountryCode}
        onChange={handleCountryCodeChange}
        size="large"
        className={styles.countryCodeSelect}
        placeholder="Country Code"
        optionFilterProp="label"
        showSearch
      />
      <Input
        value={value?.whatsappPhoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        size="large"
        className={styles.phoneNumberInput}
        placeholder="Phone Number"
      />
    </div>
  );
};

export default WhatsappContactNumber;
