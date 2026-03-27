import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { server } from "../mocks/server";
import { mockJobList, mockStaffs } from "../mocks/data";
import JobList from "@/pages/job/list/index";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderJobList = () =>
  render(
    <MemoryRouter>
      <JobList />
    </MemoryRouter>,
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("JobList 页面", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ── 列表渲染 ──────────────────────────────────────────────────────────────

  it("加载后显示职位列表（所有职位名称可见）", async () => {
    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockJobList[1].name)).toBeInTheDocument();
    });
  });

  it("已发布职位显示发布状态标签，未发布职位显示未发布标签", async () => {
    renderJobList();

    await waitFor(() => {
      // mockJobList[1] has posted_at, so it should show "published"
      expect(
        screen.getByText("job_list.post_status.published"),
      ).toBeInTheDocument();
      // mockJobList[0] has no posted_at
      expect(
        screen.getByText("job_list.post_status.unpublished"),
      ).toBeInTheDocument();
    });
  });

  // ── 搜索过滤（客户端） ────────────────────────────────────────────────────

  it("在搜索框输入关键词后只显示匹配的职位", async () => {
    const user = userEvent.setup();
    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      "job_list.search_placeholder",
    );
    await user.type(searchInput, "Product");

    await waitFor(() => {
      expect(screen.queryByText(mockJobList[0].name)).not.toBeInTheDocument();
      expect(screen.getByText(mockJobList[1].name)).toBeInTheDocument();
    });
  });

  // ── 创建人下拉过滤 ────────────────────────────────────────────────────────

  it("选择创建人后只显示对应职位", async () => {
    // Use PointerEventsCheckLevel.Never so userEvent ignores pointer-events CSS
    const { PointerEventsCheckLevel } =
      await import("@testing-library/user-event");
    const user = userEvent.setup({
      pointerEventsCheck: PointerEventsCheckLevel.Never,
    });
    renderJobList();

    const table = await screen.findByRole("table");
    await waitFor(() => {
      expect(within(table).getByText(mockJobList[0].name)).toBeInTheDocument();
      expect(within(table).getByText(mockJobList[1].name)).toBeInTheDocument();
    });

    // Open the antd Select dropdown in a stable way
    const creatorPlaceholder = screen.getByText("job_list.creator_placeholder");
    const selectRoot = creatorPlaceholder.closest(".ant-select");
    const selector = selectRoot?.querySelector(".ant-select-selector");
    expect(selector).toBeTruthy();
    fireEvent.mouseDown(selector as Element);

    // Alice (staff_id 10) owns mockJobList[0]; Bob (staff_id 11) owns mockJobList[1]
    const dropdown = document.querySelector(".ant-select-dropdown");
    expect(dropdown).toBeTruthy();
    const aliceOption = within(dropdown as HTMLElement).getByText("Alice");
    await user.click(aliceOption);

    await waitFor(() => {
      // Only the job belonging to Alice should be visible
      expect(within(table).getByText(mockJobList[0].name)).toBeInTheDocument();
      expect(within(table).queryByText(mockJobList[1].name)).not.toBeInTheDocument();
    });
  });

  // ── 空状态 ────────────────────────────────────────────────────────────────

  it("没有职位时显示空状态描述", async () => {
    server.use(
      http.get("/api/jobs", () =>
        HttpResponse.json({ code: 0, data: { jobs: [] } }),
      ),
    );

    renderJobList();

    await waitFor(() => {
      // The description renders as two lines split by <br />; match partial text
      expect(screen.getByText(/description_line_1/)).toBeInTheDocument();
    });
  });

  // ── 删除职位 ──────────────────────────────────────────────────────────────

  it("点击删除并确认后调用 destroy API，职位从列表消失", async () => {
    const user = userEvent.setup();
    let destroyCalled = false;
    // Use a counter so the first GET returns all jobs, subsequent calls return the smaller list
    let jobsGetCount = 0;

    server.use(
      http.get("/api/jobs", () => {
        jobsGetCount++;
        const jobs = jobsGetCount <= 1 ? mockJobList : [mockJobList[1]];
        return HttpResponse.json({ code: 0, data: { jobs } });
      }),
      http.post("/api/jobs/:jobId/destroy", () => {
        destroyCalled = true;
        return HttpResponse.json({ code: 0, data: {} });
      }),
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });

    // Click the delete button for the first job
    const deleteButtons = screen.getAllByText("delete");
    await user.click(deleteButtons[0]);

    // Confirm the Modal — scope to confirm footer to avoid ambiguous matches
    await screen.findByRole("button", { name: /ok/i }); // wait for modal
    const confirmBtns = document.querySelector(".ant-modal-confirm-btns")!;
    const okButton = within(confirmBtns as HTMLElement).getByRole("button", {
      name: /ok/i,
    });
    await user.click(okButton);

    await waitFor(() => {
      expect(destroyCalled).toBe(true);
      expect(screen.queryByText(mockJobList[0].name)).not.toBeInTheDocument();
    });
  });

  it("点击取消删除后职位仍在列表中，destroy API 未被调用", async () => {
    const user = userEvent.setup();
    let destroyCalled = false;

    server.use(
      http.post("/api/jobs/:jobId/destroy", () => {
        destroyCalled = true;
        return HttpResponse.json({ code: 0, data: {} });
      }),
    );

    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("delete");
    await user.click(deleteButtons[0]);

    // Wait for the confirm modal to appear, then scope button lookup to avoid ambiguous matches
    await waitFor(() => {
      expect(document.querySelector(".ant-modal-confirm-btns")).toBeTruthy();
    });
    const confirmBtns = document.querySelector(".ant-modal-confirm-btns")!;
    // antd modal buttons may have pointer-events:none during animation; use fireEvent
    const cancelButton = within(confirmBtns as HTMLElement).getByRole(
      "button",
      { name: /cancel/i },
    );
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(destroyCalled).toBe(false);
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });
  });

  // ── 导航 ──────────────────────────────────────────────────────────────────

  it('点击"新建职位"按钮跳转到 /app/entry/create-job', async () => {
    const user = userEvent.setup();
    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });

    const createBtn = screen.getByText("job_list.create_job");
    await user.click(createBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/app/entry/create-job");
  });

  it('点击"详情"按钮跳转到对应 standard-board 路由', async () => {
    const user = userEvent.setup();
    renderJobList();

    await waitFor(() => {
      expect(screen.getByText(mockJobList[0].name)).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByText("job_list.details");
    await user.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/jobs/${mockJobList[0].id}/standard-board`,
    );
  });
});
