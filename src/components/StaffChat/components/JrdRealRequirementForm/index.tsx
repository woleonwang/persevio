import DragDropCards from "@/components/DragDropCards";
import styles from "./style.module.less";

type CardType = "p0" | "p1" | "p2";
type CardConfig = {
  type: CardType;
  title: string;
  hint: string;
};

const JrdRealRequirementForm = () => {
  return (
    <div className={styles.container}>
      <div>The Real Requirement</div>
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
            title: "P0",
            hint: "Dealbreaker",
          },
          {
            type: "p1",
            title: "P1",
            hint: "Important",
          },
          {
            type: "p2",
            title: "P2",
            hint: "Nice to Have",
          },
        ]}
        renderHeader={(config) => (
          <div>
            {config.title} ({config.hint})
          </div>
        )}
      />
    </div>
  );
};

export default JrdRealRequirementForm;
