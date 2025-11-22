import MarkdownContainer from "@/components/MarkdownContainer";
import privacyAgreement from "../candidate/apply-job/components/Waiting/privacyAgreement";

const PrivacyPolicy = () => {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <MarkdownContainer content={privacyAgreement.replaceAll("\n", "\n\n")} />
    </div>
  );
};

export default PrivacyPolicy;
