import Logo from "@/assets/logo.png";
const CareerFooter = () => {
  return (
    <footer className="footer">
      <div className="footerInner">
        <p className="footerPowered">Powered By</p>
        <a
          className="footerLogo"
          href="https://www.persevio.ai"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Persevio"
        >
          <img src={Logo} alt="Persevio" />
        </a>
      </div>
    </footer>
  );
};

export default CareerFooter;
