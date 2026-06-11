import { useState } from "react";
import { message } from "antd";

import { Post } from "@/utils/request";

import { EXIT_SURVEY_QUESTIONS } from "../constants";
import styles from "../style.module.less";

type TExitSurveyProps = {
  jobApplyId: number;
  onClose: () => void;
  onDone: () => void;
};

type TSurveyQuestion = (typeof EXIT_SURVEY_QUESTIONS)[number];

const FACE_OPTIONS = [
  { value: "poor", mood: -2, label: "Poor" },
  { value: "fair", mood: -1, label: "Meh" },
  { value: "okay", mood: 0, label: "Okay" },
  { value: "good", mood: 1, label: "Good" },
  { value: "great", mood: 2, label: "Great" },
] as const;

const AGREE_OPTIONS = [
  { value: "not_really", label: "Not really" },
  { value: "somewhat", label: "Somewhat" },
  { value: "definitely", label: "Definitely" },
] as const;

const SurveyFaceIcon: React.FC<{ mood: number; color: string; size?: number }> = ({
  mood,
  color,
  size = 24,
}) => {
  const mouthByMood: Record<string, string> = {
    "-2": "M8 17.5q4 -3 8 0",
    "-1": "M8 16.5q4 -1.5 8 0",
    "0": "M8 16h8",
    "1": "M8 15.5q4 1.5 8 0",
    "2": "M8 15q4 3.4 8 0",
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.4" stroke={color} strokeWidth="1.6" />
      <circle cx="8.8" cy="10" r="1.05" fill={color} />
      <circle cx="15.2" cy="10" r="1.05" fill={color} />
      <path
        d={mouthByMood[String(mood)]}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

const CloseIcon: React.FC = () => (
  <svg
    width={14}
    height={14}
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={styles.assessChatSheetCloseIcon}
  >
    <path d="M12.1956 2.86201C12.4559 2.60166 12.8779 2.60166 13.1383 2.86201C13.3986 3.12236 13.3986 3.54437 13.1383 3.80472L8.94298 8.00003L13.1383 12.1953C13.3986 12.4557 13.3986 12.8777 13.1383 13.1381C12.8779 13.3984 12.4559 13.3984 12.1956 13.1381L8.00028 8.94274L3.80496 13.1381C3.54461 13.3984 3.1226 13.3984 2.86225 13.1381C2.6019 12.8777 2.6019 12.4557 2.86225 12.1953L7.05757 8.00003L2.86225 3.80472C2.6019 3.54437 2.6019 3.12236 2.86225 2.86201C3.1226 2.60166 3.54461 2.60166 3.80496 2.86201L8.00028 7.05732L12.1956 2.86201Z" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width={22} height={22} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.6 7.4l2.8 2.8 6-7"
      stroke="#1B8F4D"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon: React.FC = () => (
  <svg width={16} height={16} viewBox="0 0 17 17" fill="none" aria-hidden="true">
    <path
      d="M3 8.5h10M9 4.5l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type TSurveyQuestionProps = {
  index: number;
  question: TSurveyQuestion;
  value: string;
  onChange: (value: string) => void;
};

const SurveyQuestion: React.FC<TSurveyQuestionProps> = ({
  index,
  question,
  value,
  onChange,
}) => (
  <div>
    <div className={styles.exitSurveyQuestionHead}>
      <span className={styles.exitSurveyQuestionIndex}>
        {String(index).padStart(2, "0")}
      </span>
      <span className={styles.exitSurveyQuestionText}>{question.q}</span>
    </div>

    {question.kind === "face" && (
      <div className={styles.exitSurveyFaceRow}>
        {FACE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.exitSurveyFaceOption} ${
                selected ? styles.exitSurveyFaceOptionSelected : ""
              }`}
              onClick={() => onChange(option.value)}
            >
              <span className={styles.exitSurveyFaceCircle}>
                <SurveyFaceIcon
                  mood={option.mood}
                  color={selected ? "#fff" : "#6e6655"}
                />
              </span>
              <span className={styles.exitSurveyFaceLabel}>{option.label}</span>
            </button>
          );
        })}
      </div>
    )}

    {question.kind === "agree" && (
      <div className={styles.exitSurveyAgreeRow}>
        {AGREE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.exitSurveyAgreeOption} ${
                selected ? styles.exitSurveyAgreeOptionSelected : ""
              }`}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    )}

    {question.kind === "text" && (
      <textarea
        className={styles.exitSurveyTextField}
        rows={3}
        placeholder={question.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </div>
);

type TExitSurveyInnerProps = {
  answers: Record<string, string>;
  thanks: boolean;
  submitting: boolean;
  onAnswerChange: (id: string, value: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
};

const ExitSurveyInner: React.FC<TExitSurveyInnerProps> = ({
  answers,
  thanks,
  submitting,
  onAnswerChange,
  onSubmit,
  onSkip,
}) => {
  if (thanks) {
    return (
      <div className={styles.exitSurveyThanks}>
        <div className={styles.exitSurveyThanksIcon}>
          <CheckIcon />
        </div>
        <div className={styles.exitSurveyThanksTitle}>Thank you</div>
        <p className={styles.exitSurveyThanksText}>
          Your feedback helps me do this better, for you and the next candidate.
        </p>
      </div>
    );
  }

  return (
    <>
      <h3 className={styles.exitSurveyTitle}>Before you go, how did I do?</h3>
      <p className={styles.exitSurveySubtitle}>
        A few quick questions. They help me get better, for you and the next candidate.
      </p>

      <div className={styles.exitSurveyQuestions}>
        {EXIT_SURVEY_QUESTIONS.map((question, index) => (
          <SurveyQuestion
            key={question.id}
            index={index + 1}
            question={question}
            value={answers[question.id] || ""}
            onChange={(nextValue) => onAnswerChange(question.id, nextValue)}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.exitSurveySubmit}
        disabled={submitting}
        onClick={onSubmit}
      >
        Send feedback
        <ArrowIcon />
      </button>
      <button type="button" className={styles.exitSurveySkip} onClick={onSkip}>
        Skip, it&apos;s optional
      </button>
    </>
  );
};

const ExitSurvey: React.FC<TExitSurveyProps> = ({ jobApplyId, onClose, onDone }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [thanks, setThanks] = useState(false);

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

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
      return;
    }
    message.error("Failed to send feedback");
  };

  return (
    <>
      <div
        className={styles.exitSurveyBackdrop}
        onClick={thanks ? onDone : onClose}
      />
      <div className={styles.exitSurveyPanel}>
        {!thanks && <div className={styles.assessChatSheetHandle} />}
        <button
          type="button"
          className={styles.assessChatSheetClose}
          style={{ position: "absolute", top: 14, right: 16, zIndex: 1 }}
          aria-label="Close"
          onClick={thanks ? onDone : onClose}
        >
          <CloseIcon />
        </button>
        <div className={styles.exitSurveyScroll}>
          <ExitSurveyInner
            answers={answers}
            thanks={thanks}
            submitting={submitting}
            onAnswerChange={handleAnswerChange}
            onSubmit={() => void submit()}
            onSkip={onDone}
          />
        </div>
      </div>
    </>
  );
};

export default ExitSurvey;
