import { HTMLAttributes, ReactNode } from "react";
import "./style.less";
import classnames from "classnames";

interface IProps extends HTMLAttributes<HTMLSpanElement> {
  icon: ReactNode;
}
const Icon = ({ icon, className, ...restProps }: IProps) => {
  return (
    <span className={classnames(className, "perse-icon")} {...restProps}>
      {icon}
    </span>
  );
};

export default Icon;
