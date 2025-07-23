import React, { useEffect, useState } from "react";
import { Tabs, Button, Typography, Space, Tooltip, message, Empty } from "antd";
import {
  DownloadOutlined,
  ShareAltOutlined,
  CopyOutlined,
  EditOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import VionaAvatar from "@/assets/viona-avatar.png";
import useJob from "@/hooks/useJob";
import useTalent from "@/hooks/useTalent";
import { Get, Post } from "@/utils/request";
import MarkdownContainer from "@/components/MarkdownContainer";
import MarkdownEditor from "@/components/MarkdownEditor";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const scoreCardContent = `
# 面试评分卡

| 维度         | 评分（1-5） | 评语           |
| ------------ | ----------- | -------------- |
| 专业能力     |             |                |
| 沟通表达     |             |                |
| 团队协作     |             |                |
| 解决问题能力 |             |                |
| 综合评价     |             |                |
`;

const TalentDetail: React.FC = () => {
  const { job } = useJob();
  const { talent } = useTalent();

  const [tabKey, setTabKey] = useState<TTalentChatType>();
  const [roundKey, setRoundKey] = useState("");
  const [interviewDesigner, setInterviewDesigner] =
    useState<TInterviewDesigner>();
  const [isEditingInterviewDesigner, setIsEditingInterviewDesigner] =
    useState(false);
  const [editingInterviewDesignerValue, setEditingInterviewDesignerValue] =
    useState("");

  useEffect(() => {
    // 初始化
    if (job && talent) {
      setTabKey("interview_designer");
      setRoundKey("1");
    }
  }, [job, talent]);

  useEffect(() => {
    if (tabKey === "interview_designer") {
      fetchInterviewDesignerDetail();
    }
  }, [tabKey, roundKey]);

  const fetchInterviewDesignerDetail = async () => {
    if (!job || !talent) return;

    const { code, data } = await Get(
      `/api/jobs/${job.id}/talents/${talent.id}/interview_designer?round=${roundKey}`
    );
    if (code === 0) {
      setInterviewDesigner(data.interview_designer);
    } else {
      setInterviewDesigner(undefined);
    }
  };

  const updateInterviewDesignerDoc = async () => {
    if (!job || !interviewDesigner) return;

    const { code } = await Post(
      `/api/jobs/${job.id}/interview_designers/${interviewDesigner.id}/doc`,
      {
        content: editingInterviewDesignerValue,
      }
    );

    if (code === 0) {
      fetchInterviewDesignerDetail();
      setIsEditingInterviewDesigner(false);
      message.success("Update succeed");
    } else {
      message.success("Update failed");
    }
  };

  const handleDownload = () => {
    const blob = new Blob(
      [
        tabKey === "interview_designer"
          ? interviewDesigner?.interview_game_plan_doc || ""
          : scoreCardContent,
      ],
      { type: "text/markdown" }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      tabKey === "interview_designer"
        ? `Round ${roundKey} - 推荐面试问题.md`
        : "面试评分卡.md";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        tabKey === "interview_designer"
          ? interviewDesigner?.interview_game_plan_doc || ""
          : scoreCardContent
      );
      message.success("已复制到剪贴板");
    } catch {
      message.error("复制失败");
    }
  };

  const handleShare = () => {
    message.info("分享功能待实现");
  };

  const handleEdit = () => {
    if (!interviewDesigner) return;

    setIsEditingInterviewDesigner(true);
    setEditingInterviewDesignerValue(interviewDesigner.interview_game_plan_doc);
  };

  const handleChat = () => {
    message.info("与 Viona 对话功能待实现");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#fff" }}>
      {/* 左侧垂直Tab */}
      <div
        style={{
          width: 180,
          borderRight: "1px solid #f0f0f0",
          paddingTop: 32,
          background: "#fafbfc",
        }}
      >
        <Tabs
          tabPosition="left"
          activeKey={tabKey}
          onChange={(type) => setTabKey(type as TTalentChatType)}
          items={[
            {
              key: "interview_designer",
              label: "推荐面试问题",
            },
            {
              key: "interview_feedback",
              label: "面试评分卡",
            },
          ]}
        />
      </div>
      {/* 右侧内容区 */}
      <div style={{ flex: 1, padding: "40px 48px", overflow: "auto" }}>
        {tabKey === "interview_designer" ? (
          <>
            <Title level={4} style={{ marginBottom: 24 }}>
              推荐面试问题
            </Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              {/* 横向Tab */}
              <Tabs
                activeKey={roundKey}
                onChange={setRoundKey}
                items={new Array(4).fill(0).map((_, index) => ({
                  key: `${index + 1}`,
                  label: `Round ${index + 1}`,
                }))}
                style={{ flex: "none" }}
              />
              {/* 更新时间 */}
              <Text
                type="secondary"
                style={{
                  marginLeft: 16,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                更新时间：
                {!!interviewDesigner &&
                  dayjs(interviewDesigner.updated_at).format(
                    "YYYY-MM-DD HH:mm:ss"
                  )}
              </Text>
              {!!interviewDesigner && (
                <>
                  <Space size="middle" style={{ marginLeft: "auto" }}>
                    <Tooltip title="下载">
                      <Button
                        type="text"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                      />
                    </Tooltip>
                    <Tooltip title="分享">
                      <Button
                        type="text"
                        icon={<ShareAltOutlined />}
                        onClick={handleShare}
                      />
                    </Tooltip>
                    <Tooltip title="复制">
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                      />
                    </Tooltip>
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={handleEdit}
                      />
                    </Tooltip>
                  </Space>
                  <Button
                    type="primary"
                    style={{
                      marginLeft: 24,
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={handleChat}
                  >
                    <img
                      src={VionaAvatar}
                      alt="Viona"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        marginRight: 8,
                      }}
                    />
                    与 Viona 对话
                  </Button>
                </>
              )}
            </div>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 24,
                background: "#fcfcfc",
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              {!!interviewDesigner ? (
                isEditingInterviewDesigner ? (
                  <div>
                    <MarkdownEditor
                      value={editingInterviewDesignerValue}
                      onChange={(val) => setEditingInterviewDesignerValue(val)}
                    />
                    <div>
                      <Button
                        onClick={() => setIsEditingInterviewDesigner(false)}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={() => updateInterviewDesignerDoc()}
                        type="primary"
                      >
                        保存
                      </Button>
                    </div>
                  </div>
                ) : (
                  <MarkdownContainer
                    content={interviewDesigner.interview_game_plan_doc}
                  />
                )
              ) : (
                <Empty />
              )}
            </div>
          </>
        ) : (
          <>
            <Title level={4} style={{ marginBottom: 24 }}>
              面试评分卡
            </Title>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  whiteSpace: "nowrap",
                  flex: "none",
                }}
              >
                更新时间：2024-06-05 11:00
              </Text>
              <Space size="middle" style={{ marginLeft: "auto" }}>
                <Tooltip title="下载">
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                  />
                </Tooltip>
                <Tooltip title="分享">
                  <Button
                    type="text"
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                  />
                </Tooltip>
                <Tooltip title="复制">
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={handleCopy}
                  />
                </Tooltip>
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  />
                </Tooltip>
              </Space>
              <Button
                type="primary"
                style={{
                  marginLeft: 24,
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={handleChat}
              >
                <img
                  src={VionaAvatar}
                  alt="Viona"
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    marginRight: 8,
                  }}
                />
                与 Viona 对话
              </Button>
            </div>
            <div
              style={{
                border: "1px solid #f0f0f0",
                borderRadius: 8,
                padding: 24,
                background: "#fcfcfc",
                maxHeight: "60vh",
                overflow: "auto",
              }}
            >
              <ReactMarkdown>{scoreCardContent}</ReactMarkdown>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TalentDetail;
