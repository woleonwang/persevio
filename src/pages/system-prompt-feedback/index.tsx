import { useEffect, useState } from "react";
import { Get, Post } from "../../utils/request";
import { Button, Input, message, Modal, Table } from "antd";
import { copy } from "../../utils";
import MarkdownContainer from "../../components/MarkdownContainer";

type TRawMessage = {
  id: number;
  content: string;
  role: "user" | "llm";
  system_prompt?: string;
  request_message: TRawMessage;
};

const PageSize = 2;
const SystemPromptFeedback = () => {
  const [page, setPage] = useState(1);
  const [messages, setMessages] = useState<TRawMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<TRawMessage>();
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRawMessages();
  }, [page]);

  const fetchRawMessages = async () => {
    const { code, data } = await Get(
      `/api/raw_messages?page=${page}&size=${PageSize}`
    );
    if (code === 0) {
      setMessages(data.messages);
      setTotal(data.total);
    }
  };

  const columns = [
    {
      title: "id",
      dataIndex: "id",
      width: "10%",
    },
    {
      title: "system prompt",
      key: "system_prompt",
      render: (_: string, message: TRawMessage) => (
        <div>{message.request_message.system_prompt}</div>
      ),
      width: "45%",
    },
    {
      title: "response",
      dataIndex: "content",
      width: "45%",
    },
  ];

  const getMessages = () => {
    if (!selectedMessage?.request_message?.content) return [];

    const messages: { role: "user" | "llm"; content: string }[] = JSON.parse(
      selectedMessage.request_message.content
    );
    messages.push({
      role: "llm",
      content: selectedMessage.content,
    });

    return messages;
  };

  return (
    <div style={{ padding: 24, width: "100%" }}>
      <Table
        style={{ height: "100%", overflow: "auto" }}
        columns={columns}
        dataSource={messages}
        onRow={(message) => {
          return {
            onClick: () => {
              setSelectedMessage(message);
            },
          };
        }}
        rowKey={(message) => message.id}
        pagination={{
          pageSize: PageSize,
          current: page,
          onChange: (page) => {
            setPage(page);
          },
          total,
        }}
      />
      <Modal
        width={1000}
        style={{ overflow: "hidden" }}
        open={!!selectedMessage}
        title="System Prompt Feedback"
        onCancel={() => {
          setSelectedMessage(undefined);
          setFeedback("");
        }}
        onOk={async () => {
          setIsLoading(true);
          const { code, data } = await Post("/api/feedback_system_prompt", {
            system_prompt: selectedMessage?.request_message?.system_prompt,
            messages: getMessages(),
            feedback,
          });

          setIsLoading(false);
          if (code === 0) {
            const modalHandler = Modal.info({
              title: "This is the response from llm",
              content: <MarkdownContainer content={data.content} />,
              width: 800,
              footer: (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    key="copy"
                    onClick={async () => {
                      await copy(data.content);
                      message.success("Copied");
                    }}
                    type="primary"
                  >
                    Copy
                  </Button>
                  ,
                  <Button
                    key="back"
                    onClick={() => modalHandler.destroy()}
                    style={{ marginLeft: 10 }}
                  >
                    Close
                  </Button>
                  ,
                </div>
              ),
            });
          }
        }}
        okButtonProps={{
          disabled: !feedback,
          loading: isLoading,
        }}
      >
        <div>
          {(() => {
            return (
              <div style={{ maxHeight: "65vh", overflow: "auto", padding: 20 }}>
                {getMessages().map((message, index) => {
                  return (
                    <div style={{ marginBottom: 10 }} key={`${index}`}>
                      <div style={{ fontWeight: "bold" }}>{message.role}:</div>
                      <div>{message.content}</div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          <Input.TextArea
            placeholder="Feedback"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SystemPromptFeedback;
