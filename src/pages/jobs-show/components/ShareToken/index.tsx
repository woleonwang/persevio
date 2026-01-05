import useCandidate from "@/hooks/useCandidate";
import { Get, Post } from "@/utils/request";
import { useEffect, useReducer, useState } from "react";
import styles from "./style.module.less";
import { Button, Form, Input, message, Spin } from "antd";
import WhatsappContactNumber from "@/components/PhoneWithCountryCode";
import { copy } from "@/utils";
import { useTranslation } from "react-i18next";
import referrerGift from "@/assets/referrer-gift.png";
import referrerLock from "@/assets/referrer-lock.png";
import { TJob } from "../../index";
import Icon from "@/components/Icon";
import Link from "@/assets/icons/link";
import { tokenStorage } from "@/utils/storage";

interface IProps {
  parentShareToken?: string;
  job: TJob;
  onClose: () => void;
}

type TFormValues = {
  name: string;
  phone: {
    countryCode: string;
    phoneNumber: string;
  };
  email: string;
};

// 已登录：
//   已生成：exists
//   未生成：init - copy
// 未登录: init - basicInfo - copy
const ShareToken: React.FC<IProps> = (props) => {
  const { parentShareToken, job, onClose } = props;
  const [status, setStatus] = useState<
    "init" | "basicInfo" | "copy" | "exists"
  >("init");
  const [shareToken, setShareToken] = useState<string>();
  const { candidate, inited } = useCandidate();
  const [form] = Form.useForm<TFormValues>();
  const [_, forceUpdate] = useReducer(() => ({}), {});

  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`jobs_show.${key}`);

  useEffect(() => {
    if (candidate) {
      fetchShareToken();
    }
  }, [candidate]);

  const fetchShareToken = async () => {
    const { code, data } = await Get(`/api/candidate/share_tokens/${job.id}`);
    if (code === 0) {
      setShareToken(data.share_token.token);
      setStatus("exists");
    }
  };

  const createShareToken = async () => {
    const { code, data } = await Post(`/api/candidate/share_tokens`, {
      job_id: job.id,
      parent_token: parentShareToken,
    });
    if (code === 0) {
      setShareToken(data.share_token.token);
      setStatus("copy");
    }
  };

  const canSubmit = () => {
    const { name, phone, email } = form.getFieldsValue();
    return name && phone?.countryCode && phone?.phoneNumber && email;
  };

  const onFinish = async (basicInfo: TFormValues) => {
    const params = {
      email: basicInfo.email,
      name: basicInfo.name,
      country_code: basicInfo.phone.countryCode,
      phone: basicInfo.phone.phoneNumber,
    };
    const { code, data } = await Post(`/api/candidate/register`, params);

    if (code === 0) {
      const { token } = data;
      message.success("Save successful");
      tokenStorage.setToken(token, "candidate");
      createShareToken();
    } else {
      message.error("Save failed");
    }
  };

  const getShareUrl = () => {
    return `${window.location.origin}${window.location.pathname}?share_token=${shareToken}`;
  };

  const introDiv = (
    <>
      <div>
        <img src={referrerGift} alt="avatar" />
      </div>
      <div>
        <div className={styles.title}>
          Refer & <span className={styles.primaryColor}>Earn</span>
          <br />
          Share jobs, grow your chain, and earn when anyone gets hired.
        </div>
        <div className={styles.howItWorks}>
          <div>How it works:</div>
          <div className={styles.howItWorksContent}>
            <div className={styles.howItWorksContentPoints}>
              {new Array(status === "exists" ? 3 : 4)
                .fill(0)
                .map((_, index) => (
                  <div className={styles.point} key={index} />
                ))}
            </div>
            <div className={styles.howItWorksContentText}>
              {status !== "exists" && (
                <div>
                  Generate your <b>unique referral link</b> below.
                </div>
              )}
              <div>
                {status === "exists" ? (
                  <>
                    <b>Share your referral link</b> with anyone who might be a
                    good fit.
                  </>
                ) : (
                  <>
                    <b>Share it</b> with anyone who might be a good fit.
                  </>
                )}
              </div>
              <div>
                <b>Your chain grows</b> — Recipients can create their own link
                to share further, but you stay in the chain.{" "}
              </div>
              <div>
                <b>Everyone gets paid</b> — When someone applies through your
                referral chain and gets hired, all referrers split the reward
                pool.
              </div>
            </div>
          </div>
          <div className={styles.rewardPool}>
            Reward pool: &nbsp; <b>${job.bonus_pool}</b>
          </div>
          <div className={styles.rewardPoolDescription}>
            The further your link spreads, the more chances you have to earn.
          </div>
        </div>
      </div>
    </>
  );

  const copyDiv = (
    <div style={{ marginTop: 30 }}>
      <Input
        value={getShareUrl()}
        readOnly
        prefix={<Icon icon={<Link />} className={styles.linkIcon} />}
        suffix={
          <Button
            type="primary"
            onClick={async (e) => {
              e.stopPropagation();
              if (shareToken) {
                await copy(getShareUrl());
                message.success(t("share_token_copied"));
              }
            }}
            disabled={!shareToken}
          >
            Copy
          </Button>
        }
      />
    </div>
  );

  if (!inited) {
    return (
      <div className="flex-center" style={{ height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      {status === "init" && (
        <>
          {introDiv}
          <div className={styles.buttons}>
            <Button
              color="primary"
              variant="outlined"
              size="large"
              onClick={onClose}
              style={{ width: 210 }}
            >
              Return
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                if (candidate) {
                  createShareToken();
                } else {
                  setStatus("basicInfo");
                }
              }}
              style={{ width: 210 }}
            >
              Get Exclusive Link
            </Button>
          </div>
        </>
      )}
      {status === "basicInfo" && (
        <div className={styles.basicInfo}>
          <div className={styles.basicInfoTitle}>
            Provide Your Basic Information
          </div>
          <div className={styles.basicInfoDescription}>
            We need this information to create your application and keep you
            updated on its progress.
          </div>
          <Form
            form={form}
            layout="vertical"
            onFieldsChange={() => forceUpdate()}
            style={{ marginTop: 48 }}
            className={styles.formContainer}
            initialValues={{
              phone: {
                countryCode: "+65",
              },
            }}
          >
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Please fill in" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <WhatsappContactNumber />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true }]}>
              <Input placeholder="Please fill in" />
            </Form.Item>
          </Form>
          <div style={{ marginTop: 52, textAlign: "center" }}>
            <Button
              size="large"
              style={{ width: "100%", height: 44, borderRadius: 12 }}
              type="primary"
              disabled={!canSubmit()}
              onClick={() => {
                form.validateFields().then(async (values) => {
                  onFinish(values);
                });
              }}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {status === "copy" && (
        <>
          <div>
            <img src={referrerLock} alt="avatar" />
          </div>
          <div>
            <div className={styles.title}>
              Your exclusive referral link has been generated
            </div>
            <div style={{ marginTop: 16 }}>
              Share it with anyone who might be a good fit
            </div>
          </div>
          {copyDiv}
          <div className={styles.buttons}>
            <Button
              size="large"
              style={{ width: 210 }}
              variant="outlined"
              color="primary"
              onClick={() => {
                onClose();
              }}
            >
              Return
            </Button>
          </div>
        </>
      )}
      {status === "exists" && (
        <>
          {introDiv}
          {copyDiv}
          <div className={styles.buttons}>
            <Button
              size="large"
              style={{ width: 210 }}
              variant="outlined"
              color="primary"
              onClick={() => {
                onClose();
              }}
            >
              Return
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareToken;
