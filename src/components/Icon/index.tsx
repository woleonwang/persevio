import { HTMLAttributes, ReactNode } from "react";
import "./style.less";

interface IProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
}
const Icon = ({ icon, className, ...restProps }: IProps) => {
  return (
    <span className={`${className} perse-icon`} {...restProps}>
      {icon}
    </span>
  );
};

export default Icon;
