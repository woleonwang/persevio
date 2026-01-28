import classnames from "classnames";
import DragDropCards from "@/components/DragDropCards";
import styles from "./style.module.less";
import Icon from "@/components/Icon";
import Stars from "@/assets/icons/stars";

type CardType = "p0" | "p1" | "p2";
type CardConfig = {
  type: CardType;
  color: "red" | "green" | "yellow";
};

const JrdRealRequirementForm = () => {
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
  return (
    <div className={styles.container}>
      <div className={styles.title}>The Real Requirement</div>
      <DragDropCards<CardType, CardConfig>
        initialData={{
          p0: [
            {
              id: "1",
              title: "1-3年游戏经验",
              description: "必须有至少一个已上线游戏项目，懂完整的研发配合流程",
            },
            {
              id: "2",
              title: "审美风格契合",
              description:
                "作品集需体现年轻化、活力感或UGC/元宇宙风格；拒绝审美陈旧或风格严重不符者",
            },
          ],
          p1: [
            {
              id: "3",
              title: "系统化设计能力",
              description:
                "能够处理复杂的游戏系统 UI（如背包、商店、社交），而非仅做单一页面。",
            },
            {
              id: "4",
              title: "动效落地能力",
              description:
                "熟练使用 AE/Spine 等，能输出可直接交付研发的动效资产（如Lottie)。",
            },
          ],
          p2: [
            {
              id: "5",
              title: "AI 工具应用",
              description: "能够利用SD或MJ辅助出图，提升出片效率。",
            },
            {
              id: "6",
              title: "3D辅助设计",
              description: "具备基础的3D建模或渲染能力，能为 UI 增加质感。",
            },
          ],
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
    </div>
  );
};

export default JrdRealRequirementForm;
