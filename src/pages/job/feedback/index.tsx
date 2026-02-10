import StaffChat from "@/components/StaffChat";

const Feedback = () => {
  return (
    <div>
      <StaffChat
        chatType="jobTalentEvaluateFeedback"
        jobId={59}
        talentId={40}
      />
    </div>
  );
};

export default Feedback;
