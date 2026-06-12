import { useRef, useState } from "react";
import { Button, message } from "antd";

import UploadIcon from "@/assets/icons/upload";
import Icon from "@/components/Icon";
import { PostFormData } from "@/utils/request";

import FlowShell, { FlowShellFooterButton } from "./FlowShell";
import PercyHeader from "./PercyHeader";
import {
  formatFileSize,
  formatResumeFileName,
  splitFullName,
} from "../utils";
import styles from "../style.module.less";

const FileGlyph = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path
      d="M5 2h7l4 4v12a0 0 0 01 0 0H5a1 1 0 01-1-1V3a1 1 0 011-1z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path
      d="M12 2v4h4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckGlyph = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 7.5l3 3 6-7"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type TStep2ResumeProps = {
  firstName: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  initialResumePath: string;
  isSubmitting: boolean;
  onFinish: (resumePath: string) => Promise<void>;
};

const Step2Resume: React.FC<TStep2ResumeProps> = ({
  firstName,
  jobTitle,
  companyName,
  companyLogo,
  initialResumePath,
  isSubmitting,
  onFinish,
}) => {
  const [resumePath, setResumePath] = useState(initialResumePath);
  const [fileName, setFileName] = useState(
    initialResumePath ? formatResumeFileName(initialResumePath) : "",
  );
  const [fileSize, setFileSize] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    const timer = window.setInterval(() => {
      setUploadProgress((value) => {
        if (value === null || value >= 90) {
          return value;
        }
        return value + 10;
      });
    }, 120);

    const { code, data } = await PostFormData("/api/upload_resume", formData);
    window.clearInterval(timer);

    if (code === 0) {
      setResumePath(data.resume);
      setFileName(file.name);
      setFileSize(file.size);
      setUploadProgress(100);
      message.success("Upload successful");
      window.setTimeout(() => setUploadProgress(null), 400);
    } else {
      setUploadProgress(null);
      message.error(data.message || "Upload failed");
    }
  };

  const handleFileChange = async (file?: File | null) => {
    if (!file) {
      return;
    }
    await uploadFile(file);
  };

  return (
    <FlowShell
      currentStep={2}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      footer={
        <FlowShellFooterButton
          disabled={!resumePath || isSubmitting || uploadProgress !== null}
          loading={isSubmitting || uploadProgress !== null}
          onClick={() => onFinish(resumePath)}
        >
          Continue
        </FlowShellFooterButton>
      }
    >
      <PercyHeader
        speech={
          <>
            Perfect. Thanks,{" "}
            <span className={styles.variableToken}>
              {firstName || splitFullName("").firstName}
            </span>
            .
            I've got what I need to reach you.
          </>
        }
        title="Next, may I have your resume?"
        sub="I'll read it before we talk, so our first conversation already has the full picture of your experience."
      />

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          void handleFileChange(file);
          event.target.value = "";
        }}
      />

      <div style={{ marginTop: 24 }}>
        {!resumePath ? (
          <div
            className={`${styles.uploadZone} ${isDragOver ? styles.uploadZoneDragOver : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragOver(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragOver(false);
              void handleFileChange(event.dataTransfer.files?.[0]);
            }}
          >
            <div className={styles.uploadZoneIconWrap}>
              <Icon icon={<UploadIcon />} className={styles.uploadZoneIcon} />
            </div>
            <div className={styles.uploadZoneTitle}>Upload your resume</div>
            <div className={styles.uploadZoneHint}>
              Tap to browse or drag a file here
            </div>
            <div className={styles.uploadZoneHint}>PDF · DOC · DOCX · up to 10 MB</div>
          </div>
        ) : (
          <div className={styles.uploadedFileCard}>
            <div className={styles.uploadedFileMain}>
              <div className={styles.uploadedFileIconWrap}>
                <FileGlyph />
              </div>
              <div className={styles.uploadedFileMeta}>
                <div className={styles.uploadedFileName}>{fileName}</div>
                <div className={styles.uploadedFileStatus}>
                  {uploadProgress !== null
                    ? `Uploading… ${uploadProgress}%`
                    : fileSize > 0
                      ? `${formatFileSize(fileSize)} · Ready`
                      : "Ready"}
                </div>
              </div>
              {uploadProgress === null && (
                <div className={styles.uploadedFileCheck}>
                  <CheckGlyph />
                </div>
              )}
            </div>

            {uploadProgress !== null && (
              <div className={styles.uploadedProgressBar}>
                <div
                  className={styles.uploadedProgressFill}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {uploadProgress === null && (
              <div className={styles.uploadedFileActions}>
                <Button
                  type="link"
                  className={styles.replaceLink}
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
                <Button
                  type="link"
                  className={styles.removeLink}
                  onClick={() => {
                    setResumePath("");
                    setFileName("");
                    setFileSize(0);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        )}

        {resumePath && uploadProgress === null && (
          <div className={styles.uploadedNote}>
            <span className={styles.uploadedNoteCheck}>
              <CheckGlyph />
            </span>
            <span className={styles.bodyText} style={{ fontSize: 12.5 }}>
              Percy will read this before your conversation, so nothing gets repeated.
              You can replace it any time.
            </span>
          </div>
        )}
      </div>
    </FlowShell>
  );
};

export default Step2Resume;
