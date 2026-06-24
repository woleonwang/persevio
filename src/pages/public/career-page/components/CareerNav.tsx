import { getCompanyLogo } from "@/utils";
import { getLoginUrl } from "../utils";
import { useNavScroll } from "../useNavScroll";
import ArrowRight from "@/assets/icons/arrow-right";
import Icon from "@/components/Icon";

type TProps = {
  logo: string;
  companyName: string;
  website: string;
  domain: string;
};

const CareerNav = ({ logo, companyName, website, domain }: TProps) => {
  const navRef = useNavScroll();

  return (
    <div className="navShell">
      <header className="nav" ref={navRef}>
        <a
          className="navLogo"
          href={website || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={companyName}
        >
          <img src={getCompanyLogo(logo)} alt={companyName} />
        </a>
        <button
          className="navLogin"
          type="button"
          onClick={() => {
            window.open(getLoginUrl(domain), "_blank", "noopener");
          }}
        >
          <span>login</span>
          <Icon icon={<ArrowRight />} style={{ fontSize: 20 }} />
        </button>
      </header>
    </div>
  );
};

export default CareerNav;
