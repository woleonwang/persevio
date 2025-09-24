import styles from "./style.module.less";
import classnames from "classnames";

interface IProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}

const CommunicationLanguage = (props: IProps) => {
  const { value = [], onChange } = props;
  const options = [
    {
      value: "en",
      label: "English",
    },
    {
      value: "zh",
      label: "中文",
    },
  ];
  return (
    <div className={styles.container}>
      {options.map((option) => (
        <div
          key={option.value}
          className={classnames(styles.option, {
            [styles.active]: value.includes(option.value),
          })}
          onClick={() =>
            onChange?.(
              value.includes(option.value)
                ? value.filter((v) => v !== option.value)
                : [...value, option.value]
            )
          }
        >
          {option.label}
        </div>
      ))}
    </div>
  );
};

export default CommunicationLanguage;
