import classnames from "classnames";
import { PlusOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import DragDropCards, { DragDropRecord } from "@/components/DragDropCards";
import styles from "./style.module.less";
import Item from "./components/Item";
import { useEffect, useState } from "react";
import { parseJSON } from "@/utils";
import { Button } from "antd";
import VionaAvatar from "@/assets/viona-avatar.png";

type CardType =
  | "ideal_candidate"
  | "good_fit"
  | "recommend_with_reservations"
  | "not_a_fit";

type CardConfig = {
  type: CardType;
  color: "red" | "green" | "yellow" | "blue";
};

interface IProps {
  initialValue: string;
  onSubmit: (value: string) => void;
  onBack: () => void;
}

type TOriginalValue = {
  [key in CardType]: {
    features: string[];
    profiles: { title: string; description: string }[];
  };
};

type TFeatures = {
  [key in CardType]: { id: string; content: string }[];
};

const JrdRealRequirementForm = ({ initialValue, onSubmit, onBack }: IProps) => {
  const { t: originalT } = useTranslation();
  const t = (key: string) => originalT(`jrdTargetCandidateProfileForm.${key}`);

  const [value, setValue] = useState<Record<CardType, DragDropRecord[]>>();
  const [features, setFeatures] = useState<TFeatures>();

  useEffect(() => {
    if (initialValue) {
      const parsedValue: TOriginalValue = parseJSON(initialValue);

      const formValue = {} as Record<
        CardType,
        { id: string; title: string; description: string }[]
      >;
      const featuresValue = {} as Record<
        CardType,
        { id: string; content: string }[]
      >;

      Object.entries(parsedValue).forEach(([key, value]) => {
        formValue[key as CardType] = value.profiles.map((profile) => ({
          id: uuidv4(),
          ...profile,
        }));
        featuresValue[key as CardType] = value.features.map((feature) => ({
          id: uuidv4(),
          content: feature,
        }));
      });
      setValue(formValue);
      setFeatures(featuresValue);
    }
  }, []);

  const cardConfigsMap: Record<
    CardType,
    {
      title: string;
      hint: string;
      note?: string;
      color: "red" | "green" | "yellow" | "blue";
    }
  > = {
    ideal_candidate: {
      title: t("ideal_candidate_title"),
      hint: t("ideal_candidate_hint"),
      color: "green",
    },
    good_fit: {
      title: t("good_fit_title"),
      hint: t("good_fit_hint"),
      color: "blue",
    },
    recommend_with_reservations: {
      title: t("recommend_with_reservations_title"),
      hint: t("recommend_with_reservations_hint"),
      color: "yellow",
    },
    not_a_fit: {
      title: t("not_a_fit_title"),
      hint: t("not_a_fit_hint"),
      color: "red",
    },
  };

  if (!value || !features) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t("title")}</div>
      <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
        <img
          src={VionaAvatar}
          style={{ width: 24, height: 24, color: "#999" }}
        />
        <span>
          From what you shared, I’ve drafted what I believe are the kind of
          candidate profiles we should target in our search. Feel free to add,
          delete, or revise items—and drag and drop to adjust the fit levels.
        </span>
      </div>
      <DragDropCards<CardType, CardConfig>
        value={value}
        onChange={(value) => {
          setValue(value);
        }}
        cardConfigs={[
          {
            type: "ideal_candidate",
            color: "green",
          },
          {
            type: "good_fit",
            color: "blue",
          },
          {
            type: "recommend_with_reservations",
            color: "yellow",
          },
          {
            type: "not_a_fit",
            color: "red",
          },
        ]}
        renderExtraHeader={(config) => {
          const cardText = cardConfigsMap[config.type];
          const color = cardText.color;
          const cardFeatures = features[config.type];
          return (
            <div
              className={classnames(styles.cardHeader, styles[config.color])}
            >
              <div className={styles.cardTitleContainer}>
                <div className={styles.cardTitle}>{cardText.title}</div>
              </div>
              <div className={styles.cardHint}>{cardText.hint}</div>
              <div className={styles.cardFeatures}>
                <div
                  className={styles.cardAddButton}
                  onClick={() => {
                    setFeatures((features) => {
                      const newFeatures = { ...features } as TFeatures;
                      newFeatures[config.type] = [
                        ...newFeatures[config.type],
                        { id: uuidv4(), content: "" },
                      ];
                      return newFeatures;
                    });
                  }}
                >
                  <PlusOutlined />
                </div>
                <div className={classnames(styles.cardTitle, styles.subTitle)}>
                  {t("featuresLabel")}
                </div>

                {cardFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className={classnames(styles.recordDescriptionContainer)}
                  >
                    <Item
                      value={feature.content}
                      color={color}
                      onChange={(value) => {
                        setFeatures((features) => {
                          const newFeatures = { ...features } as TFeatures;
                          newFeatures[config.type] = newFeatures[
                            config.type
                          ].map((f) =>
                            f.id === feature.id ? { ...f, content: value } : f
                          );
                          return newFeatures;
                        });
                      }}
                      onDelete={() => {
                        setFeatures((features) => {
                          const newFeatures = { ...features } as TFeatures;
                          newFeatures[config.type] = newFeatures[
                            config.type
                          ].filter((f) => f.id !== feature.id);
                          return newFeatures;
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        }}
        renderHeader={(config) => {
          return (
            <div
              className={classnames(styles.cardHeader, styles[config.color])}
            >
              <div className={classnames(styles.cardTitle, styles.subTitle)}>
                {t("profileLabel")}
              </div>
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
          {t("back")}
        </Button>
        <Button
          type="primary"
          onClick={() => {
            let result = ``;
            Object.entries(cardConfigsMap).forEach(([key, records]) => {
              result += `### ${records.title}\n\n`;
              const currentFeatures = features[key as CardType];
              if (currentFeatures.length > 0) {
                result += `**${t("description")}:**`;
                currentFeatures.forEach((feature) => {
                  result += `\n- ${feature.content}`;
                });
                result += `\n\n`;
              }
              const currentProfiles = value[key as CardType];
              if (currentProfiles.length > 0) {
                result += `**${t("exampleProfiles")}**

| ${t("profile")} | ${t("description")} |
|---------|-------------|
`;
                currentProfiles.forEach((profile) => {
                  result += `| ${profile.title} | ${profile.description} |\n`;
                });
                result += `\n\n`;
              }
            });
            onSubmit(result);
          }}
        >
          {t("submit")}
        </Button>
      </div>
    </div>
  );
};

export default JrdRealRequirementForm;
