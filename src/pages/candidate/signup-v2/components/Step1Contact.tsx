import { useMemo, useState } from "react";
import { Input } from "antd";

import PhoneWithCountryCode from "@/components/PhoneWithCountryCode";

import FlowShell, { FlowShellFooterButton } from "./FlowShell";
import PercyHeader from "./PercyHeader";
import { isValidPhone } from "@/utils/phone";

import { isValidEmail, joinFullName, splitFullName } from "../utils";
import styles from "../style.module.less";

export type TContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
};

type TStep1ContactProps = {
  initValues: IPreRegisterInfo;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  onSubmit: (values: IPreRegisterInfo) => Promise<void>;
};

const Step1Contact: React.FC<TStep1ContactProps> = ({
  initValues,
  jobTitle,
  companyName,
  companyLogo,
  onSubmit,
}) => {
  const initial = splitFullName(initValues.name || "");
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initValues.email || "");
  const [countryCode, setCountryCode] = useState(
    initValues.country_code || "+65",
  );
  const [phone, setPhone] = useState(initValues.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      firstName.trim() &&
      lastName.trim() &&
      isValidEmail(email) &&
      isValidPhone(countryCode, phone)
    );
  }, [countryCode, email, firstName, lastName, phone]);

  const handleSubmit = async () => {
    if (!canSubmit || submitting) {
      if (!isValidPhone(countryCode, phone)) {
        setPhoneError("That number looks incomplete. Please check it.");
      }
      return;
    }
    setPhoneError("");
    setSubmitting(true);
    await onSubmit({
      name: joinFullName(firstName, lastName),
      email: email.trim(),
      country_code: countryCode,
      phone: phone.trim(),
    });
    setSubmitting(false);
  };

  return (
    <FlowShell
      currentStep={1}
      jobTitle={jobTitle}
      companyName={companyName}
      companyLogo={companyLogo}
      footer={
        <FlowShellFooterButton
          disabled={!canSubmit || submitting}
          loading={submitting}
          onClick={handleSubmit}
        >
          Continue
        </FlowShellFooterButton>
      }
    >
      <PercyHeader
        mode="wave"
        speech={
          <>
            Hi, I'm <span className={styles.percyName}>Percy</span>, your AI
            talent consultant for this role. I'll guide you through every step
            of your application from here.
          </>
        }
        title="First, how can I reach you?"
        sub="Just your contact details, so I can keep you posted on your application. They stay private. I only use them to reach you."
      />

      <div className={styles.formSection}>
        <div className={styles.nameRow}>
          <div className={styles.formField}>
            <div className={styles.fieldLabel}>
              First name <span className={styles.requiredMark}>*</span>
            </div>
            <Input
              className={styles.antFieldInput}
              size="large"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Alex"
            />
          </div>
          <div className={styles.formField}>
            <div className={styles.fieldLabel}>
              Last name <span className={styles.requiredMark}>*</span>
            </div>
            <Input
              className={styles.antFieldInput}
              size="large"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Tan"
            />
          </div>
        </div>

        <div className={styles.formField}>
          <div className={styles.fieldLabel}>
            Email <span className={styles.requiredMark}>*</span>
          </div>
          <Input
            className={styles.antFieldInput}
            size="large"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.tan@gmail.com"
            type="email"
          />
        </div>

        <div className={styles.formField}>
          <div className={styles.fieldLabel}>
            Phone <span className={styles.requiredMark}>*</span>
          </div>
          <div className={styles.phoneFieldWrap}>
            <PhoneWithCountryCode
              value={{ countryCode, phoneNumber: phone }}
              onChange={(value) => {
                setCountryCode(value.countryCode ?? "");
                setPhone(value.phoneNumber ?? "");
                if (
                  phoneError &&
                  isValidPhone(value.countryCode ?? "", value.phoneNumber ?? "")
                ) {
                  setPhoneError("");
                }
              }}
            />
          </div>
          {phoneError && (
            <div className={styles.fieldErrorText}>(!) {phoneError}</div>
          )}
        </div>
      </div>
    </FlowShell>
  );
};

export default Step1Contact;
