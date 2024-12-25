import styles from './style.module.less';
import block1 from '../../assets/block-1.png';
const Home = () => {
  return (
    <div className={styles.container}>
      <div>
        <div>Logo</div>
        <div>Join the waitlist</div>
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
          cycle from open to offer. She helps your recruitment teams 10X
          productivity at a fraction of the cost.
        </div>
        <div className={styles.greenBtn}>
          Hire Viona Today
          <div className={styles.icon}>→</div>
        </div>
        <div className={`${styles.talk_1} ${styles.talk}`}>
          Manage roles from open to offer
        </div>
        <div className={`${styles.talk_2} ${styles.talk}`}>Expert-trained</div>
        <div className={`${styles.talk_3} ${styles.talk}`}>Work 24/7</div>
      </div>
      <div className={`${styles.bgContainer} ${styles.block1}`}>
        <div className={styles.innerContainer}>
          <div className={styles.blockTitle}>
            talk to Viona as you would to a human recruiter—then sit back and
            watch as interviews with qualified candidates booked on your
            calendar
          </div>
          <img className={styles.image} src={block1} alt='block1' />
        </div>
      </div>
    </div>
  );
};

export default Home;
