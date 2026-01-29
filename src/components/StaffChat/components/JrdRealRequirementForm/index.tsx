import { useEffect, useState } from "react";
import { Button } from "antd";
import classnames from "classnames";
import { v4 as uuidv4 } from "uuid";

import DragDropCards, { DragDropRecord } from "@/components/DragDropCards";
import { parseJSON } from "@/utils";
import Icon from "@/components/Icon";

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
}

type TValue = {
  [key in CardType]: DragDropRecord[];
};

const JrdRealRequirementForm = ({
  initialValue,
  onSubmit,
  onBack,
}: JrdRealRequirementFormProps) => {
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
      title: "P0",
      subTitle: "Dealbreaker",
      hint: "The candidate must possess these on Day 1. Even if only one is not met, the candidate is immediately disqualified. ",
      note: "Keep this list short to avoid shrinking your talent pool.",
      color: "red",
    },
    p1: {
      title: "P1",
      subTitle: "Highly Desired",
      hint: `Important skills that separate a "capable" candidate from a "top" choice. These significantly boost a candidate’s rank but are not pass/fail.`,
      color: "green",
    },
    p2: {
      title: "P2",
      subTitle: "Nice-to-have",
      hint: `Useful skills that can be easily learned on the job. These are "bonuses" and should never be used to screen a candidate out.`,
      color: "yellow",
    },
  };

  if (!value) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>The Real Requirement</div>
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
        <Button
          onClick={() => {
            onBack();
          }}
        >
          Back
        </Button>
        <Button
          type="primary"
          onClick={() => {
            let result = `| Priority | Requirement | Notes |
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
          Submit
        </Button>
      </div>
    </div>
  );
};

export default JrdRealRequirementForm;
