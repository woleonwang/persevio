import logo from '../../assets/logo.png';
import menuChat from '../../assets/menu-chat.png';
import styles from './style.module.less';
import ChatRoom from './components/ChatRoom';
const Agent = () => {
  // const [params] = useSearchParams();
  // const agentId =
  //   params.get('agent_id') ?? '34245a7f-2376-4d17-bb4e-0cb08ade5a35';
  // const src = `https://chat.lindy.ai/embedded/lindyEmbed/${agentId}`;
  return (
    <div className={styles.container}>
      <div className={styles.menu}>
        <img src={logo} style={{ width: '100%' }} />
        <div className={styles.menuItemWrapper}>
          <div className={`${styles.menuItem} ${styles.active}`}>
            <img src={menuChat} style={{ width: 24 }} />
            <span style={{ marginLeft: 16 }}>Chat with Viona</span>
          </div>
        </div>
      </div>
      <div className={styles.main}>
        <ChatRoom />
      </div>
    </div>
  );
};

export default Agent;
