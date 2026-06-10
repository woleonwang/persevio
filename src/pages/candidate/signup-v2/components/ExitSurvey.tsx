import { useState } from "react";
import { Button, Input, message } from "antd";

import { Post } from "@/utils/request";

import { SignupPrimaryButton } from "./FlowShell";
import { EXIT_SURVEY_QUESTIONS } from "../constants";
import styles from "../style.module.less";

type TExitSurveyProps = {
  jobApplyId: number;
  onDone: () => void;
};

const FACE_LABELS: Record<string, string> = {
  poor: "Poor",
  fair: "Fair",
  okay: "Okay",
  good: "Good",
  great: "Great",
};

const AGREE_LABELS: Record<string, string> = {
  not_really: "Not really",
  somewhat: "Somewhat",
  definitely: "Definitely",
};

const ExitSurvey: React.FC<TExitSurveyProps> = ({ jobApplyId, onDone }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const { code } = await Post(`/api/candidate/job_applies/${jobApplyId}/survey`, {
      overall_experience: answers.overall,
      questions_relevant: answers.relevant,
      experience_accurate: answers.accurate,
      improvement_feedback: answers.dislike,
    });
    setSubmitting(false);

    if (code === 0) {
      setThanks(true);
      window.setTimeout(onDone, 1200);
      return;
    }
    message.error("Failed to send feedback");
  };

  if (thanks) {
    return (
      <>
        <div className={styles.sheetBackdrop} />
        <div className={styles.sheetPanel}>
          <h3 className={styles.serifTitle} style={{ fontSize: 22 }}>
            Thank you
          </h3>
          <p className={styles.bodyText} style={{ marginTop: 8 }}>
            Your feedback helps me do this better for you and the next candidate.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.sheetBackdrop} />
      <div className={styles.sheetPanel}>
        <h3 className={styles.serifTitle} style={{ fontSize: 22 }}>
          Before you go, how did I do?
        </h3>
        <p className={styles.bodyText} style={{ marginTop: 8 }}>
          A few quick questions. They help me get better, for you and the next candidate.
        </p>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
          {EXIT_SURVEY_QUESTIONS.map((question) => (
            <div key={question.id}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{question.q}</div>
              {question.kind === "text" ? (
                <Input.TextArea
                  rows={3}
                  placeholder={question.placeholder}
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                  }
                />
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {question.options.map((option) => {
                    const labels =
                      question.kind === "face" ? FACE_LABELS : AGREE_LABELS;
                    return (
                      <Button
                        key={option}
                        type={answers[question.id] === option ? "primary" : "default"}
                        className={styles.optionButton}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option }))
                        }
                      >
                        {labels[option] || option}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <SignupPrimaryButton
          style={{ marginTop: 20 }}
          loading={submitting}
          onClick={submit}
        >
          Send feedback →
        </SignupPrimaryButton>
        <Button
          type="link"
          className={styles.inlineLink}
          style={{ display: "block", margin: "12px auto 0" }}
          onClick={onDone}
        >
          Skip, it's optional
        </Button>
      </div>
    </>
  );
};

export default ExitSurvey;
