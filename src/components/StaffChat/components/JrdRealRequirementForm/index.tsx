import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "antd";
import classnames from "classnames";
import { v4 as uuidv4 } from "uuid";

import DragDropCards, { DragDropRecord } from "@/components/DragDropCards";
import { parseJSON } from "@/utils";
import Icon from "@/components/Icon";
import VionaAvatar from "@/assets/viona-avatar.png";

import Stars from "@/assets/icons/stars";
import styles from "./style.module.less";

type CardType = "p0" | "p1" | "p2";
type CardConfig = {
  type: CardType;
  color: "red" | "green" | "yellow";
};

interface JrdRealRequirementFormProps {
  initialValue: string;
  onSubmit: (value: string) => void;
  onBack: () => void;
  onAgree: () => void;
}

type TValue = {
  [key in CardType]: DragDropRecord[];
};

const JrdRealRequirementForm = ({
  initialValue,
  onSubmit,
  onBack,
  onAgree,
}: JrdRealRequirementFormProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`jrdRealRequirementForm.${key}`);

  const [value, setValue] = useState<TValue>();

  useEffect(() => {
    if (initialValue) {
      const parsedValue: TValue = parseJSON(initialValue);
      Object.values(parsedValue).forEach((records) => {
        records.forEach((record) => {
          record.id = uuidv4();
        });
      });
      setValue(parsedValue);
    }
  }, []);

  const cardTextMap: Record<
    CardType,
    {
      title: string;
      subTitle: string;
      hint: string;
      note?: string;
      color: "red" | "green" | "yellow";
    }
  > = {
    p0: {
      title: t("p0_title"),
      subTitle: t("p0_subTitle"),
      hint: t("p0_hint"),
      note: t("p0_note"),
      color: "red",
    },
    p1: {
      title: t("p1_title"),
      subTitle: t("p1_subTitle"),
      hint: t("p1_hint"),
      color: "green",
    },
    p2: {
      title: t("p2_title"),
      subTitle: t("p2_subTitle"),
      hint: t("p2_hint"),
      color: "yellow",
    },
  };

  if (!value) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t("title")}</div>
      <div style={{ display: "flex", gap: 8, margin: "12px 0", color: "#999" }}>
        <img src={VionaAvatar} style={{ width: 24, height: 24 }} />
        <span>{t("hint")}</span>
      </div>
      <DragDropCards<CardType, CardConfig>
        value={value}
        onChange={(value) => {
          setValue(value);
        }}
        cardConfigs={[
          {
            type: "p0",
            color: "red",
          },
          {
            type: "p1",
            color: "green",
          },
          {
            type: "p2",
            color: "yellow",
          },
        ]}
        renderHeader={(config) => {
          const cardText = cardTextMap[config.type];
          return (
            <div
              className={classnames(styles.cardHeader, styles[config.color])}
            >
              <div className={styles.cardTitleContainer}>
                <div className={styles.cardTitle}>{cardText.title}</div>
                <div className={styles.cardTitleSeparator} />
                <div className={styles.cardSubTitle}>{cardText.subTitle}</div>
              </div>
              <div className={styles.cardHint}>{cardText.hint}</div>
              {cardText.note && (
                <div className={styles.cardNote}>
                  <Icon icon={<Stars />} />
                  {cardText.note}
                </div>
              )}
            </div>
          );
        }}
      />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button type="primary" onClick={() => onAgree()}>
          {t("agree")}
        </Button>
        <Button
          type="primary"
          onClick={() => {
            let result = `I have modified your proposed job requirements, please review carefully and make sure you capture my modifications.

| Priority | Requirement | Notes |
|----------|-------------|-------|`;
            Object.entries(value).forEach(([key, records]) => {
              records.forEach((record) => {
                result += `
| ${cardTextMap[key as CardType].title} (${
                  cardTextMap[key as CardType].subTitle
                }) | ${record.title} | ${record.description} |`;
              });
            });
            onSubmit(result);
          }}
        >
          {t("submit")}
        </Button>
        <Button
          onClick={() => {
            onBack();
          }}
        >
          {t("back")}
        </Button>
      </div>
    </div>
  );
};

export default JrdRealRequirementForm;
