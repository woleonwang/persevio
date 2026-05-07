import MarkdownContainer from "@/components/MarkdownContainer";
import terms from "@/utils/terms";

const TermsOfService = () => {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <MarkdownContainer content={terms.replaceAll("\n", "\n\n")} />
    </div>
  );
};

export default TermsOfService;
