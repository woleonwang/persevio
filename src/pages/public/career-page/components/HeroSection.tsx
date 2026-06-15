import { useRef } from "react";
import MarkdownContainer from "@/components/MarkdownContainer";
import { useLiquidGradientBackground } from "../useLiquidGradientBackground";
import styles from "../aboutMarkdown.module.less";

type TProps = {
  introduction: string;
};

const HeroSection = ({ introduction }: TProps) => {
  const heroRef = useRef<HTMLElement>(null);
  const liquidBgRef = useRef<HTMLDivElement>(null);

  useLiquidGradientBackground(liquidBgRef, heroRef);

  return (
    <>
      <div className="heroLiquidBg" ref={liquidBgRef} />
      <section className="hero" aria-label="Career page hero" ref={heroRef}>
        <div className="heroBgStage" aria-hidden="true">
          <div className="heroBgLight" />
          <div className="heroBgSheen" />
        </div>
        <section className="about">
          <div className="aboutInner">
            <h1 className="aboutTitle">About Us</h1>
            <div className={`aboutDescription ${styles.aboutMarkdown}`}>
              <MarkdownContainer content={introduction} />
            </div>
          </div>
        </section>
      </section>
    </>
  );
};

export default HeroSection;
