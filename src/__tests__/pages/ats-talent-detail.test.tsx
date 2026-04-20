import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router";
import { message } from "antd";

import AtsTalentDetail from "@/components/AtsTalentDetail";

const mockNavigate = vi.fn();
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDownload = vi.fn();
const mockDownloadMarkdownAsPDF = vi.fn();
const mockGetQuery = vi.fn();

const mockFetchTalent = vi.fn();
const mockEvaluateFeedbackProps: { lastOnOpen?: () => void; lastOnChange?: any } = {};

let currentJob: any;
let currentTalent: any;
let currentInterviews: any[] = [];

vi.mock("@ant-design/icons", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ant-design/icons")>();
  return {
    ...actual,
    ArrowLeftOutlined: ({ onClick }: { onClick?: () => void }) => (
      <button data-testid="back-btn" onClick={onClick}>
        back
      </button>
    ),
  };
});

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ jobId: "1", talentId: "100" }),
  };
});

vi.mock("@/hooks/useJob", () => ({
  default: () => ({
    job: currentJob,
  }),
}));

vi.mock("@/hooks/useTalent", () => ({
  default: () => ({
    talent: currentTalent,
    interviews: currentInterviews,
    fetchTalent: mockFetchTalent,
  }),
}));

vi.mock("@/utils/request", () => ({
  Get: (...args: any[]) => mockGet(...args),
  Post: (...args: any[]) => mockPost(...args),
  Download: (...args: any[]) => mockDownload(...args),
}));

vi.mock("@/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils")>();
  return {
    ...actual,
    getQuery: (...args: any[]) => mockGetQuery(...args),
    downloadMarkdownAsPDF: (...args: any[]) => mockDownloadMarkdownAsPDF(...args),
  };
});

// Reduce subcomponent complexity: we only care about parent wiring/branches.
vi.mock("@/components/ChatMessagePreview", () => ({
  default: () => <div data-testid="chat-preview" />,
}));
vi.mock("@/components/MarkdownContainer", () => ({
  default: ({ content }: { content: string }) => (
    <div data-testid="markdown">{content}</div>
  ),
}));
vi.mock("@/components/AtsTalentDetail/components/Resume", () => ({
  default: () => <div data-testid="resume-component" />,
}));
vi.mock("@/components/Icon", () => ({
  default: () => <span data-testid="icon" />,
}));
vi.mock("@/components/EvaluateResultBadge", () => ({
  default: () => <span data-testid="evaluate-badge" />,
}));
vi.mock("@/components/EvaluateFeedback", () => ({
  default: ({ onOpen, onChange }: { onOpen?: () => void; onChange?: any }) => {
    mockEvaluateFeedbackProps.lastOnOpen = onOpen;
    mockEvaluateFeedbackProps.lastOnChange = onChange;
    return <div data-testid="evaluate-feedback" />;
  },
}));
vi.mock("@/components/EvaluateFeedbackConversation", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="feedback-conversation" /> : null,
}));
vi.mock("@/components/TalentEvaluateFeedbackModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="feedback-reason-modal" /> : null,
}));
vi.mock("@/components/TalentEvaluateFeedbackWithReasonModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="reject-modal" /> : null,
}));
vi.mock("@/components/RichTextWithVoice", () => ({
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <textarea
      aria-label="rich-text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <AtsTalentDetail />
    </MemoryRouter>,
  );

describe("AtsTalentDetail 页面", () => {
  const getDefaultJob = () => ({
    id: 1,
    name: "Test Job",
    pipeline_stages: JSON.stringify([
      { id: "stage_1", name: "Stage 1" },
      { id: "stage_2", name: "Stage 2" },
    ]),
    interview_defaults_json: JSON.stringify({ mode: "online" }),
  });

  const getDefaultTalent = () => ({
    id: 100,
    job_id: 1,
    name: "John Doe",
    status: "active",
    source_channel: "direct",
    resume_detail_json: "",
    evaluate_json: JSON.stringify({
      overall_recommendation: { result: "maybe" },
      summary: {
        description: "summary",
        interest_level: { level: "high", explanation: "high interest" },
      },
      requirements: [],
      profile_snapshot: [],
      key_information: [],
    }),
    parsed_content: "resume markdown",
    evaluate_result_updated_at: "2024-01-01T00:00:00Z",
    viewed_at: "2024-01-01T00:00:00Z",
    feedback_updated_at: "2024-01-01T00:00:00Z",
  });

  beforeEach(() => {
    mockNavigate.mockReset();
    mockGet.mockReset();
    mockPost.mockReset();
    mockDownload.mockReset();
    mockDownloadMarkdownAsPDF.mockReset();
    mockGetQuery.mockReset();
    mockFetchTalent.mockReset();
    mockEvaluateFeedbackProps.lastOnOpen = undefined;
    mockEvaluateFeedbackProps.lastOnChange = undefined;

    currentJob = getDefaultJob();
    currentTalent = getDefaultTalent();
    currentInterviews = [];

    vi.spyOn(message, "error").mockImplementation(() => undefined as any);
    vi.spyOn(message, "success").mockImplementation(() => undefined as any);

    mockGetQuery.mockReturnValue("");
    mockPost.mockResolvedValue({ code: 0 });

    // AtsTalentDetail mounts several Get calls; provide safe defaults.
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("/all_talents"))
        return {
          code: 0,
          data: {
            talents: [
              {
                id: 100,
                name: "John Doe",
                job: { id: 1, name: "Test Job", posted_at: null },
              },
            ],
          },
        };
      if (url.includes("/messages")) return { code: 0, data: { messages: [] } };
      if (url.includes("/notes")) return { code: 0, data: { talent_notes: [] } };
      if (url.includes("/active_logs"))
        return { code: 0, data: { active_logs: [] } };
      if (url.includes("/feedback_records"))
        return { code: 0, data: { interview_feedback_records: [] } };
      return { code: 0, data: {} };
    });
  });

  it("点击返回按钮：from=talents 时跳转到 /app/talents", async () => {
    mockGetQuery.mockReturnValue("talents");
    renderPage();

    // Wait for the page to be past the initial Spin (job/talent already mocked).
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("back-btn"));

    expect(mockNavigate).toHaveBeenCalledWith("/app/talents");
  });

  it("点击返回按钮：from=local 时返回上一页", async () => {
    mockGetQuery.mockReturnValue("local");
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId("back-btn"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("点击返回按钮：默认跳转到标准看板 talents tab", async () => {
    mockGetQuery.mockReturnValue("");
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByTestId("back-btn"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/app/jobs/1/standard-board?tab=talents",
    );
  });

  it("点击 Download Report：调用 downloadMarkdownAsPDF 生成 PDF", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /download report/i }),
      ).toBeVisible();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /download report/i }),
    );

    expect(mockDownloadMarkdownAsPDF).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "John Doe_talent_report",
        element: expect.any(HTMLElement),
      }),
    );
  });

  it("点击 Download PDF：调用 Download 并传入正确 url 与文件名前缀", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /download pdf/i })).toBeVisible();
    });

    await userEvent.click(screen.getByRole("button", { name: /download pdf/i }));

    expect(mockDownload).toHaveBeenCalledWith(
      "/api/jobs/1/talents/100/download_resume",
      "John Doe_resume",
    );
  });

  it("Reject：evaluate_feedback 为空时打开 reject modal（而不是直接 updateTalentStatus）", async () => {
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /talent_details\.action_reject/i }),
      ).toBeVisible();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /talent_details\.action_reject/i }),
    );

    expect(await screen.findByTestId("reject-modal")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalledWith(
      "/api/jobs/1/talents/100",
      expect.anything(),
    );
  });

  it("Reject：evaluate_feedback 存在时直接请求更新状态", async () => {
    currentTalent = { ...getDefaultTalent(), evaluate_feedback: "approve" };
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /talent_details\.action_reject/i }),
      ).toBeVisible();
    });
    await userEvent.click(
      screen.getByRole("button", { name: /talent_details\.action_reject/i }),
    );

    expect(mockPost).toHaveBeenCalledWith("/api/jobs/1/talents/100", {
      status: "rejected",
      feedback: undefined,
    });
  });

  it("Add Note：直接保存空内容时提示校验错误", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /\+ add note/i })).toBeVisible();
    });

    await userEvent.click(screen.getByRole("button", { name: /\+ add note/i }));

    // Modal ok button text is "Save"
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(message.error).toHaveBeenCalledWith("Please enter note.");
    expect(mockPost).not.toHaveBeenCalledWith(
      "/api/jobs/1/talents/100/notes",
      expect.anything(),
    );
  });

  it("Create New Interview Round：缺少 round 或 feedback 时提示对应校验错误", async () => {
    // Make sure the create-new-round entry renders (needs interviews/customizedInterviews).
    mockGet.mockImplementation(async (url: string) => {
      if (url.includes("/feedback_records")) {
        // One customized interview group so the button exists
        return {
          code: 0,
          data: {
            interview_feedback_records: [
              {
                id: 1,
                interview_id: null,
                talent_id: 100,
                staff_id: 10,
                content: "existing",
                customized_round: "Round 2",
                customized_round_key: "round2",
                advance_status: "hold",
                created_at: "2024-01-01T00:00:00Z",
                updated_at: "2024-01-01T00:00:00Z",
                staff: { id: 10, name: "Alice" },
              },
            ],
          },
        };
      }
      if (url.includes("/all_talents")) return { code: 0, data: { talents: [] } };
      if (url.includes("/messages")) return { code: 0, data: { messages: [] } };
      if (url.includes("/notes")) return { code: 0, data: { talent_notes: [] } };
      if (url.includes("/active_logs"))
        return { code: 0, data: { active_logs: [] } };
      return { code: 0, data: {} };
    });

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /\+ create new interview round/i }),
      ).toBeVisible();
    });

    await userEvent.click(
      screen.getByRole("button", { name: /\+ create new interview round/i }),
    );

    // 1) Missing round
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(message.error).toHaveBeenCalledWith("Please enter interview round.");

    // Fill round, still missing feedback -> feedback validation
    const roundInput = screen.getByPlaceholderText("e.g. Round 1, Round 2");
    await userEvent.type(roundInput, "Round X");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(message.error).toHaveBeenCalledWith("Please enter feedback.");
  });

  it("interviewButtonArea：无面试时显示 schedule_interview", async () => {
    currentInterviews = [];
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /talent_details\.schedule_interview/i,
        }),
      ).toBeVisible();
    });
  });

  it("interviewButtonArea：written/scheduled 时显示 interview_scheduled", async () => {
    currentInterviews = [
      {
        id: 1,
        mode: "written",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        feedback_records: [],
      },
    ] as any;
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /talent_details\.interview_scheduled/i,
        }),
      ).toBeVisible();
    });
  });

  it("interviewButtonArea：等待候选人确认文案", async () => {
    currentInterviews = [
      {
        id: 2,
        mode: "interview",
        scheduled_at: "",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        feedback_records: [],
      },
    ] as any;
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /talent_details\.awaiting_candidate_confirm/i,
        }),
      ).toBeVisible();
    });
  });

  it("Move Stage：未选 stage 禁用，选择后可提交并请求 /stage", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Move Stage" })).toBeVisible();
    });
    await userEvent.click(screen.getByRole("button", { name: "Move Stage" }));

    const dialog = await screen.findByRole("dialog", { name: "Move Stage" });
    const saveBtn = screen.getByRole("button", { name: "OK" });
    expect(dialog).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();

    fireEvent.mouseDown(screen.getByRole("combobox"));
    await userEvent.click(await screen.findByText("Stage 1"));
    expect(saveBtn).toBeEnabled();

    await userEvent.click(saveBtn);
    expect(mockPost).toHaveBeenCalledWith("/api/jobs/1/talents/100/stage", {
      stage_id: "stage_1",
    });
  });

  it("Add Note：提交成功后调用 notes 与 active logs 刷新", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /\+ add note/i })).toBeVisible();
    });
    await userEvent.click(screen.getByRole("button", { name: /\+ add note/i }));

    await userEvent.type(screen.getByLabelText("rich-text"), "new note");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(mockPost).toHaveBeenCalledWith("/api/jobs/1/talents/100/notes", {
      content: "new note",
    });
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/api/jobs/1/talents/100/notes");
      expect(mockGet).toHaveBeenCalledWith("/api/jobs/1/talents/100/active_logs");
    });
  });

  it("Resume 分支：有 contact_information 时渲染 Resume 组件", async () => {
    currentTalent = {
      ...getDefaultTalent(),
      resume_detail_json: JSON.stringify({ contact_information: { email: "a@b.com" } }),
    };
    renderPage();
    expect(await screen.findByTestId("resume-component")).toBeInTheDocument();
  });

  it("EvaluateFeedback onOpen 会打开 conversation", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId("evaluate-feedback")).toBeInTheDocument();
    });
    expect(mockEvaluateFeedbackProps.lastOnOpen).toBeTruthy();
    mockEvaluateFeedbackProps.lastOnOpen?.();

    expect(await screen.findByTestId("feedback-conversation")).toBeInTheDocument();
  });

  it("job 或 talent 缺失时渲染加载态", () => {
    currentJob = undefined;
    currentTalent = undefined;
    renderPage();
    expect(document.querySelector(".ant-spin")).toBeTruthy();
  });
});

