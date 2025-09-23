import { Button, Input } from "antd";
import { EditOutlined } from "@ant-design/icons";
import classnames from "classnames";
import styles from "./style.module.less";
import { useEffect, useState } from "react";
import VionaAvatar from "@/assets/viona-avatar.png";

interface IProps {
  value: string;
  onChange: (value: string[]) => void;
}

export const targetsOptions = [
  {
    key: "explore_new_job_opportunities",
    title: "探索新的职业机会",
    description:
      "我可以给您介绍您感兴趣的公司或行业的人进行交流或者直接给您推荐合适的工作机会。",
  },

  {
    key: "i_am_hiring",
    title: "我正在招聘",
    description: "我可以给您推荐潜在合适的候选人。",
  },

  {
    key: "consult_with_others",
    title: "向他人就某个主题发起咨询/学习/讨论",
    description: "我可以给您介绍相关领域的专家。",
  },
  {
    key: "seek_funding",
    title: "寻求融资",
    description: "我可以给您介绍可能对您项目感兴趣的投资人",
  },
  {
    key: "seek_investment_target",
    title: "寻求投资标的",
    description: "我可以给您介绍潜在的投资标的。",
  },
  {
    key: "become_expert_network_expert",
    title: "成为专家网络的专家",
    description: "您可以加入我们的专家网络，向别人提供付费的或者免费的咨询。",
  },
];

const EditableTargets = ({ value, onChange }: IProps) => {
  const [originalTargets, setOriginalTargets] = useState<string[]>([]);
  const [editTargets, setEditTargets] = useState<string[]>([]);
  const [isEdit, setIsEdit] = useState(false);
  const [isOtherTargetShow, setIsOtherTargetShow] = useState(false);
  const [otherTarget, setOtherTarget] = useState<string>("");

  useEffect(() => {
    try {
      setOriginalTargets(JSON.parse(value));
    } catch (error) {
      setOriginalTargets([value]);
    }
  }, [value]);

  const resetEditTargets = () => {
    const newEditTargets: string[] = [];
    setIsOtherTargetShow(false);
    originalTargets.forEach((target: string) => {
      if (targetsOptions.find((option) => option.key === target)) {
        newEditTargets.push(target);
      } else {
        setOtherTarget(target);
        setIsOtherTargetShow(true);
      }
    });
    setEditTargets(newEditTargets);
  };

  return (
    <div>
      <div className={styles.title}>
        想通过networking来达成什么目标？
        {!isEdit && (
          <EditOutlined
            style={{ marginLeft: 10 }}
            onClick={() => {
              resetEditTargets();
              setIsEdit(!isEdit);
            }}
          />
        )}
      </div>
      {isEdit ? (
        <div className={styles.form}>
          <div>
            {targetsOptions.map((option) => (
              <div
                key={option.key}
                className={classnames(styles.targetOption, {
                  [styles.active]: editTargets?.includes(option.key),
                })}
                onClick={() =>
                  setEditTargets(
                    editTargets?.includes(option.key)
                      ? editTargets?.filter((key) => key !== option.key)
                      : [...(editTargets ?? []), option.key]
                  )
                }
              >
                <div className={styles.targetTitle}>{option.title}</div>
                <div className={styles.description}>
                  <img src={VionaAvatar} className={styles.avatar} />
                  {option.description}
                </div>
              </div>
            ))}
            {isOtherTargetShow ? (
              <div>
                <Input.TextArea
                  placeholder={`您可以添加多个意向目标，以帮助Viona了解您的需求。目标示例:
1.我正在为我的开发者工具创业公司进行种子轮融资，希望能认识在这个领域有成功投资经验的风险投资人。
2.我最近刚搬到新加坡，希望能认识一些在fintech行业的朋友，拓展一些专业人脉。
3.我正在为我的团队招聘一名资深全栈工程师，要求有TypeScript和AWS的实战经验。
4.我正在为我的B2B SaaS新产品寻找3-5名种子用户。理想的用户是在50-200人规模的科技公司担任销售总监。
5.我刚来新加坡工作，想找喜欢打网球的朋友业余一起打网球。`}
                  value={otherTarget}
                  onChange={(e) => setOtherTarget(e.target.value)}
                  rows={10}
                />
              </div>
            ) : (
              <div
                className={styles.addOtherTarget}
                onClick={() => setIsOtherTargetShow(true)}
              >
                + 添加其它目标
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Button
              type="primary"
              onClick={() => {
                setIsEdit(false);
                onChange([...(editTargets ?? []), otherTarget].filter(Boolean));
              }}
            >
              保存
            </Button>
            <Button onClick={() => setIsEdit(false)}>取消</Button>
          </div>
        </div>
      ) : (
        <div className={styles.content}>
          <ol>
            {originalTargets.map((optionKey) => (
              <li>
                {targetsOptions.find((option) => option.key === optionKey)
                  ?.title ?? optionKey}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default EditableTargets;
