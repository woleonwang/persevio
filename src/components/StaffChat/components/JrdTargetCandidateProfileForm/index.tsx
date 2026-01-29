import classnames from "classnames";
import { PlusOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import DragDropCards, { DragDropRecord } from "@/components/DragDropCards";
import styles from "./style.module.less";
import Item from "./components/Item";
import { useEffect, useState } from "react";
import { parseJSON } from "@/utils";
import { Button } from "antd";

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
      title: "Ideal Candidate",
      hint: "Has successfully done this exact role before. Ready to perform on Day 1 with minimal risk.",
      color: "green",
    },
    good_fit: {
      title: "Good Fit",
      hint: "Strong match with minor gaps solvable during onboarding.",
      color: "blue",
    },
    recommend_with_reservations: {
      title: "Recommend with Reservations",
      hint: `High potential with adjacent experience. A "bet on growth" that requires a longer ramp-up.`,
      color: "yellow",
    },
    not_a_fit: {
      title: "Not a Fit",
      hint: "Misses Dealbreakers or has patterns that predict failure in this specific context, even if their background looks relevant on paper.",
      color: "red",
    },
  };

  if (!value || !features) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>The Candidate Profile</div>
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
                  特征描述
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
                典型画像
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
          Back
        </Button>
        <Button
          type="primary"
          onClick={() => {
            let result = ``;
            Object.entries(cardConfigsMap).forEach(([key, records]) => {
              result += `### ${records.title}\n\n`;
              const currentFeatures = features[key as CardType];
              if (currentFeatures.length > 0) {
                result += `**Description:**`;
                currentFeatures.forEach((feature) => {
                  result += `\n- ${feature.content}`;
                });
                result += `\n\n`;
              }
              const currentProfiles = value[key as CardType];
              if (currentProfiles.length > 0) {
                result += `**Example Profiles:**

| Profile | Description |
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
          Submit
        </Button>
      </div>
    </div>
  );
};

export default JrdRealRequirementForm;
