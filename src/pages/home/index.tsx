import styles from "./style.module.less";
import logo from "../../assets/logo.png";
import block1 from "../../assets/block-1.png";
import calendarCheck from "../../assets/calendar-check.png";
import check from "../../assets/check.png";
import medal from "../../assets/medal.png";
import tie from "../../assets/tie.png";
import bottomCard1 from "../../assets/bottom-card-1.png";
import bottomCard2 from "../../assets/bottom-card-2.png";
import bottomCard3 from "../../assets/bottom-card-3.png";
import targetArrow from "../../assets/target-arrow.png";
import skill from "../../assets/videos/skill.mp4";
import sourcing from "../../assets/videos/sourcing.mp4";
import screening from "../../assets/videos/screening.mp4";
import interview from "../../assets/videos/interview.mp4";
import driving from "../../assets/videos/driving.mp4";
import { CSSProperties } from "react";
import { useNavigate } from "react-router";

interface CardProps {
  title: string;
  description: string;
  image: string;
  color: string;
  backgroundColor: string;
}

interface GreenBtnProps {
  title: string;
  onClick?: () => void;
  style?: CSSProperties;
}

interface BottomCardProps {
  image: string;
  title: string;
  description: string;
}

interface PowerCardProps {
  title: string;
  list: string[];
  noBorder?: boolean;
}

const GreenBtn = (props: GreenBtnProps) => {
  const { title, onClick, style } = props;

  return (
    <div className={styles.greenBtn} onClick={onClick} style={style}>
      {title}
      <div className={styles.icon}>→</div>
    </div>
  );
};

const WhiteBtn = (props: GreenBtnProps) => {
  const { title, onClick } = props;

  return (
    <div
      className={styles.greenBtn}
      onClick={onClick}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.8)",
      }}
    >
      {title}
      <div
        className={styles.icon}
        style={{
          color: "rgba(31, 172, 106, 1)",
          backgroundColor: "rgba(255, 255, 255, 1)",
        }}
      >
        →
      </div>
    </div>
  );
};

const Card = (props: CardProps) => {
  const { title, description, image, color, backgroundColor } = props;
  return (
    <div
      style={{
        backgroundColor,
        borderRadius: 24,
        padding: 24,
        position: "relative",
        height: 250,
      }}
    >
      <div
        style={{ color, fontSize: 32, fontWeight: "bold", lineHeight: "42px" }}
      >
        {title}
      </div>
      <div style={{ marginTop: 14, fontSize: 16, lineHeight: "21px" }}>
        {description}
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 24,
          backgroundColor: color,
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img src={check} style={{ width: 20 }} />
      </div>
      <img
        style={{ position: "absolute", right: 24, bottom: 24, width: 96 }}
        src={image}
      />
    </div>
  );
};

const BottomCard = (props: BottomCardProps) => {
  const { title, description, image } = props;
  return (
    <div
      style={{
        backgroundColor: "rgba(248, 248, 249, 1)",
        borderRadius: 24,
        padding: "50px 30px",
        height: 332,
      }}
    >
      <img style={{ width: 75 }} src={image} />
      <div
        style={{
          color: "rgba(31, 172, 106, 1)",
          fontSize: 24,
          fontWeight: "bold",
          lineHeight: "36px",
          marginTop: 32,
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 14, fontSize: 16, lineHeight: "21px" }}>
        {description}
      </div>
    </div>
  );
};

const PowerCard = (props: PowerCardProps) => {
  const { title, list, noBorder = false } = props;
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        borderRight: `${noBorder ? 0 : 1}px solid rgba(234, 234, 234, 1)`,
        padding: "0 30px",
      }}
    >
      <div style={{ width: "fit-content" }}>
        <div style={{ fontSize: 24, lineHeight: "36px", fontWeight: "bold" }}>
          {title}
        </div>
        <div>
          {list.map((item) => {
            return (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <img
                  src={targetArrow}
                  style={{ flex: "none", width: 24, marginRight: 12 }}
                />
                <div
                  key={item}
                  style={{ flex: 1, fontSize: 16, lineHeight: "24px" }}
                >
                  {item}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const VideoContainer = (props: { src: string; withBg?: boolean }) => {
  const { src, withBg = false } = props;
  return (
    <div
      style={{
        flex: 1,
        ...(withBg && {
          padding: "73px 49px",
          background:
            "linear-gradient(125.62deg, #FBFAF1 15.1%, #EEEEFF 57.89%, #F4D7FE 94.28%),radial-gradient(38.81% 38.81% at 68.18% 0%, rgba(254, 255, 237, 0.8) 0%, rgba(255, 251, 234, 0) 100%)",
          borderRadius: 24,
        }),
      }}
    >
      <div
        style={{
          borderRadius: 12,
          backgroundColor: "white",
          padding: 12,
        }}
      >
        <video
          src={src}
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid rgba(234, 234, 234, 1)",
          }}
          autoPlay
          muted
          loop
        />
      </div>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} style={{ width: 220 }} />
        <div className={styles.joinBtn} onClick={() => navigate("/signin")}>
          <span>Join the waitlist</span>
          <span style={{ marginLeft: 17 }}>→</span>
        </div>
      </div>

      <div className={styles.bannerContainer}>
        <div className={styles.title}>
          <div>
            <span className={styles.green}>Hi,</span> I am Viona.
          </div>
          <div>
            Your <span className={styles.green}>autonomous</span>
          </div>
          <div>AI recruitment associate</div>
        </div>
        <div className={styles.bannerHint}>
          Viona is the world's first AI associate who manages your recruitment
          cycle from open to offer.
        </div>
        <div className={styles.bannerGreenBtn}>
          <GreenBtn title="Hire Viona Today" />
        </div>
        <div className={`${styles.talk_1} ${styles.talk}`}>
          Manage roles from open to offer
        </div>
        <div className={`${styles.talk_2} ${styles.talk}`}>Expert-trained</div>
        <div className={`${styles.talk_3} ${styles.talk}`}>Work 24/7</div>
      </div>

      <div className={`${styles.bgContainer} ${styles.block1}`}>
        <div className={styles.innerContainer}>
          <div className={styles.blockDesc}>
            Discuss with Viona as you would with a human recruiter—then sit back
            and watch as interviews with qualified candidates booked on your
            calendar
          </div>
          <img className={styles.image} src={block1} alt="block1" />

          <div className={styles.cardContainer}>
            <Card
              title="Expertise"
              description="Viona was trained by the world’s top recruiters and hiring managers."
              color="rgba(31, 172, 106, 1)"
              backgroundColor="rgba(236, 246, 236, 1)"
              image={tie}
            />
            <Card
              title="Independent"
              description="Viona partners with with recruitment teams or works directly with hiring managers."
              color="rgba(49, 101, 203, 1)"
              backgroundColor="rgba(236, 239, 244, 1)"
              image={medal}
            />
            <Card
              title="Always-on"
              description="Viona works 24/7 to drive recruitment forward by sourcing candidates, scheduling meetings, and following up with stakeholders."
              color="rgba(176, 70, 200, 1)"
              backgroundColor="rgba(250, 239, 248, 1)"
              image={calendarCheck}
            />
          </div>
          <div className={styles.block1GreenBtn}>
            <GreenBtn title="Hire Viona Today" />
          </div>
        </div>
      </div>

      <div className={`${styles.innerContainer} ${styles.block2}`}>
        <div className={styles.blockTitle}>
          Viona's <span className={styles.green}>Core Skills</span>
        </div>
        <div className={styles.blockDesc} style={{ marginTop: 16 }}>
          Viona helps you focus on important tasks that actually matter -
          pitching, evaluating and aligning.
        </div>
        <div
          className={styles.flexContainerLeftImage}
          style={{ marginTop: 120 }}
        >
          <VideoContainer src={skill} withBg />
          <div style={{ flex: 1, marginLeft: 56, paddingTop: 100 }}>
            <div className={styles.blockSubTitle}>Requirement Gathering</div>
            <div className={styles.blockSubDesc}>
              Viona collects and qualifies job requirements, creating
              professional job descriptions, outreach messages, and more.
            </div>
            <GreenBtn title="Hire Viona Today" style={{ marginTop: 64 }} />
          </div>
        </div>
      </div>

      <div
        className={`${styles.innerContainer} ${styles.flexContainerRightImage}`}
        style={{ marginTop: 210 }}
      >
        <div style={{ flex: 1, marginRight: 56, paddingTop: 100 }}>
          <div className={styles.blockSubTitle}>Sourcing</div>
          <div className={styles.blockSubDesc}>
            Viona autonomously sources and engages candidates, ensuring they’re
            ready to meet you and book them in on your calendar.
          </div>
          <GreenBtn title="Hire Viona Today" style={{ marginTop: 64 }} />
        </div>
        <VideoContainer src={sourcing} />
      </div>

      <div
        className={`${styles.flexContainerLeftImage} ${styles.innerContainer}`}
        style={{ marginTop: 210 }}
      >
        <VideoContainer src={screening} withBg />
        <div style={{ flex: 1, marginLeft: 56, paddingTop: 100 }}>
          <div className={styles.blockSubTitle}>Screening</div>
          <div className={styles.blockSubDesc}>
            Viona screens hundreds of applications in seconds, ensuring your
            time is only spent on the most promising candidates.
          </div>
          <GreenBtn title="Hire Viona Today" style={{ marginTop: 64 }} />
        </div>
      </div>

      <div
        className={`${styles.innerContainer} ${styles.flexContainerRightImage}`}
        style={{ marginTop: 210 }}
      >
        <div style={{ flex: 1, marginRight: 56, paddingTop: 100 }}>
          <div className={styles.blockSubTitle}>
            Interview planning & Interviewing
          </div>
          <div className={styles.blockSubDesc}>
            Viona designs interview plans, suggests interview questions, takes
            notes and creates comprehensive summaries and reports for all
            stakeholders
          </div>
          <GreenBtn title="Hire Viona Today" style={{ marginTop: 64 }} />
        </div>
        <VideoContainer src={interview} />
      </div>

      <div
        className={`${styles.flexContainerLeftImage} ${styles.innerContainer}`}
        style={{ marginTop: 210 }}
      >
        <VideoContainer src={driving} withBg />
        <div style={{ flex: 1, marginLeft: 56, paddingTop: 100 }}>
          <div className={styles.blockSubTitle}>Driving</div>
          <div className={styles.blockSubDesc}>
            Viona drives the full recruitment process forward by proactively
            scheduling meetings, providing context and following up with
            relevant parties.
          </div>
          <GreenBtn title="Hire Viona Today" style={{ marginTop: 64 }} />
        </div>
      </div>

      {/* <div
        style={{
          backgroundColor: 'rgba(248, 248, 249, 1)',
          marginTop: 210,
          padding: '50px 0',
        }}
      >
        <div className={styles.innerContainer}>
          <div className={styles.blockTitle}>Work experience</div>
          <div className={styles.blockDesc}>
            Viona helps both agencies and companies grow.
          </div>
          <div
            style={{ display: 'flex', marginTop: 60, justifyContent: 'center' }}
          >
            {[1, 2, 3, 4, 5, 6].map((index) => {
              return (
                <img
                  src={previewLogo}
                  style={{ width: 196 }}
                  key={`${index}-preivew`}
                />
              );
            })}
          </div>
        </div>
      </div> */}

      <div className={styles.innerContainer} style={{ marginTop: 120 }}>
        <div className={styles.blockTitle}>
          <span className={styles.green}>Viona</span> is
        </div>
        <div className={styles.cardContainer} style={{ marginTop: 32 }}>
          <BottomCard
            image={bottomCard1}
            title="Conversational"
            description="No complex systems—interact with Viona as naturally as you would with a human colleague."
          />
          <BottomCard
            image={bottomCard2}
            title="Reliable"
            description="Viona never misses a beat, ensuring every task is completed on time and the process stays on track."
          />
          <BottomCard
            image={bottomCard3}
            title="Alway-on"
            description="Viona works 24/7 on autopilot to deliver exceptional recruitment results and candidate experience."
          />
        </div>
      </div>

      <div className={styles.innerContainer} style={{ marginTop: 132 }}>
        <div className={styles.blockTitle}>
          <div>Recruit with Viona to unleash the power of</div>
          <div className={styles.green}>AI in recruitment</div>
        </div>
        <div className={styles.cardContainer} style={{ marginTop: 32 }}>
          <PowerCard
            title="Faster time-to-hire"
            list={[
              "Instantly available to start work",
              "Works 24/7 on autopilot",
            ]}
          />
          <PowerCard
            title="Better candidate experience"
            list={[
              "Always available to assist candidates at any time",
              "Infinitely patient and knowledgeable",
            ]}
          />
          <PowerCard
            title="A fraction of the cost"
            list={[
              "10X your productivity",
              "A fraction of the cost of traditional recruitment solutions",
            ]}
            noBorder
          />
        </div>
      </div>

      <div
        style={{
          backgroundColor: "rgba(58, 147, 118, 0.79)",
          marginTop: 120,
          padding: "100px 0",
          // backgroundImage: 'url("/hands.png")',
          // backgroundSize: 'contain',
          // backgroundRepeat: 'no-repeat',
          // backgroundPosition: 'center',
        }}
      >
        <div className={styles.innerContainer}>
          <div
            className={styles.blockTitle}
            style={{ color: "white", fontSize: 32 }}
          >
            Hey, I am Viona. Ready to experience the future of recruiting with
            me?
          </div>
          <div style={{ marginTop: 50, textAlign: "center" }}>
            <WhiteBtn title="Hire Viona Today" />
          </div>
        </div>
      </div>

      <div className={`${styles.innerContainer} ${styles.footer}`}>
        <img src={logo} style={{ width: 188 }} />
        <div className={styles.footerLinksContainer}>
          <div>
            <div className={styles.footerTitle}>Products</div>
            <div className={styles.footerLink}>For Agency Recruiters</div>
            <div className={styles.footerLink}>For Inhouse Recruiters</div>
          </div>
          <div>
            <div className={styles.footerTitle}>Company</div>
            <div className={styles.footerLink}>About Us</div>
            <div className={styles.footerLink}>Privacy Policy</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
