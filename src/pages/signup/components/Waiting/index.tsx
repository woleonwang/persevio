interface IProps {
  status: string;
}
const Waiting: React.FC<IProps> = (props) => {
  const { status } = props;

  return <div>{status}</div>;
};

export default Waiting;
