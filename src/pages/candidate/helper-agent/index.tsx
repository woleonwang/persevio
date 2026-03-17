import CandidateChat from "@/components/CandidateChat";

const CandidateHelperAgentPage = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        flex: 1,
      }}
    >
      <CandidateChat chatType="helper_agent" />
    </div>
  );
};

export default CandidateHelperAgentPage;
