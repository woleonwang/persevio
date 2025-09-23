const DefaultAvatar = (props: { style?: React.CSSProperties }) => {
  const { style } = props;

  return <img src="/default-avatar.png" alt="avatar" style={style} />;
};

export default DefaultAvatar;
