import { test, expect, Page } from "@playwright/test";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockJob = {
  id: 1,
  name: "Senior Frontend Engineer",
  staff_id: 10,
  posted_at: null,
  jd_doc_id: 0,
  requirement_doc_id: 0,
  compensation_details_doc_id: 0,
  outreach_message_doc_id: 0,
  interview_plan_doc_id: 0,
  jd_version: 0,
  invitation_token: "tok-abc123",
  status: 1,
  is_confidential: false,
  company_id: 1,
};

const mockJobWithJd = {
  ...mockJob,
  jd_doc_id: 42,
  requirement_doc_id: 10,
  posted_at: "2024-01-15T10:00:00Z",
};

const mockTalents = [
  { id: 100, name: "John Doe", job_id: 1, status: "active" },
  { id: 101, name: "Jane Smith", job_id: 1, status: "active" },
];

// ─── Mock API Helpers ─────────────────────────────────────────────────────────

async function setupBoardMocks(
  page: Page,
  options: { job?: typeof mockJob; talents?: typeof mockTalents } = {},
) {
  const job = options.job ?? mockJob;
  const talents = options.talents ?? [];

  await page.route("**/api/jobs/1", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        data: { job, unviewed_talent_count: 0 },
      }),
    });
  });

  await page.route("**/api/jobs/1/talents", (route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 0, data: { talents } }),
      });
    } else {
      route.continue();
    }
  });

  await page.route("**/api/jobs/1/post_job", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: {} }),
    });
  });

  await page.route("**/api/talents/status", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { unread_count: 0, job_ids: [] } }),
    });
  });

  await page.route("**/api/staffs", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { staffs: [] } }),
    });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Job Board 页面", () => {
  // ── 流程 1：基本渲染 ──────────────────────────────────────────────────────

  // test("页面加载后显示职位名称和三个主区块", async ({ page }) => {
  //   await setupBoardMocks(page);
  //   await page.goto("/app/jobs/1/board");

  //   // Job name in header
  //   await expect(page.getByText("Senior Frontend Engineer")).toBeVisible();

  //   // Publish switch
  //   await expect(page.getByRole("switch")).toBeVisible();

  //   // At least one conversation task button
  //   await expect(
  //     page.getByRole("button", { name: /job requirement/i }).first(),
  //   ).toBeVisible();
  // });

  // test('jd_doc_id 为 0 时发布开关处于禁用状态', async ({ page }) => {
  //   await setupBoardMocks(page, { job: mockJob })
  //   await page.goto('/app/jobs/1/board')

  //   const switchEl = page.getByRole('switch')
  //   await expect(switchEl).toBeDisabled()
  // })

  // // ── 流程 2：候选人列表 ────────────────────────────────────────────────────

  // test('有候选人时列表中显示候选人姓名', async ({ page }) => {
  //   await setupBoardMocks(page, { talents: mockTalents })
  //   await page.goto('/app/jobs/1/board')

  //   await expect(page.getByText('John Doe')).toBeVisible()
  //   await expect(page.getByText('Jane Smith')).toBeVisible()
  // })

  // test('没有候选人时显示空状态提示', async ({ page }) => {
  //   await setupBoardMocks(page, { talents: [] })
  //   await page.goto('/app/jobs/1/board')

  //   // "no_candidates_yet" or equivalent text
  //   await expect(page.getByText(/no candidates/i)).toBeVisible()
  // })

  // // ── 流程 3：发布 / 取消发布 ───────────────────────────────────────────────

  // test('JD 存在时点击发布开关调用 post_job API', async ({ page }) => {
  //   let postJobCalled = false

  //   await setupBoardMocks(page, { job: mockJobWithJd })

  //   await page.route('**/api/jobs/1/post_job', (route) => {
  //     postJobCalled = true
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: {} }),
  //     })
  //   })

  //   // Re-mock job endpoint to return updated state after toggle
  //   await page.route('**/api/jobs/1', (route) => {
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({
  //         code: 0,
  //         data: { job: mockJobWithJd, unviewed_talent_count: 0 },
  //       }),
  //     })
  //   })

  //   await page.goto('/app/jobs/1/board')

  //   const switchEl = page.getByRole('switch')
  //   await expect(switchEl).not.toBeDisabled()
  //   await switchEl.click()

  //   await expect.poll(() => postJobCalled).toBe(true)
  // })

  // // ── 流程 4：上传简历 ──────────────────────────────────────────────────────

  // test('上传简历后候选人出现在列表中', async ({ page }) => {
  //   const parsedResume = {
  //     talent_name: 'New Candidate',
  //     resume: 'base64resume==',
  //   }

  //   await setupBoardMocks(page, { talents: [] })

  //   await page.route('**/api/jobs/1/upload_resume_for_interview_design', (route) => {
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: parsedResume }),
  //     })
  //   })

  //   await page.route('**/api/jobs/1/talents/check_name**', (route) => {
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: { is_exists: false } }),
  //     })
  //   })

  //   await page.route('**/api/jobs/1/talents', (route) => {
  //     if (route.request().method() === 'POST') {
  //       route.fulfill({
  //         status: 200,
  //         contentType: 'application/json',
  //         body: JSON.stringify({
  //           code: 0,
  //           data: { id: 102, name: 'New Candidate', job_id: 1, status: 'active' },
  //         }),
  //       })
  //     } else {
  //       // First GET: empty; after POST: return new candidate
  //       route.fulfill({
  //         status: 200,
  //         contentType: 'application/json',
  //         body: JSON.stringify({
  //           code: 0,
  //           data: {
  //             talents: [{ id: 102, name: 'New Candidate', job_id: 1, status: 'active' }],
  //           },
  //         }),
  //       })
  //     }
  //   })

  //   await page.goto('/app/jobs/1/board')

  //   // Click the upload resume button
  //   const uploadBtn = page.getByRole('button', { name: /upload resume/i })
  //   await expect(uploadBtn).toBeVisible()

  //   // Attach a file to the hidden upload input
  //   const fileInput = page.locator('input[type="file"]')
  //   await fileInput.setInputFiles({
  //     name: 'resume.pdf',
  //     mimeType: 'application/pdf',
  //     buffer: Buffer.from('fake pdf content'),
  //   })

  //   // New candidate should appear
  //   await expect(page.getByText('New Candidate')).toBeVisible({ timeout: 5000 })
  // })

  // // ── 流程 5：删除候选人 ────────────────────────────────────────────────────

  // test('删除候选人：确认后候选人从列表消失', async ({ page }) => {
  //   let deleteCallCount = 0

  //   await setupBoardMocks(page, { talents: mockTalents })

  //   await page.route('**/api/jobs/1/talents/100/destroy', (route) => {
  //     deleteCallCount++
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: {} }),
  //     })
  //   })

  //   // After deletion refetch only second talent
  //   await page.route('**/api/jobs/1/talents', (route) => {
  //     if (route.request().method() === 'GET') {
  //       const firstCall = deleteCallCount === 0
  //       route.fulfill({
  //         status: 200,
  //         contentType: 'application/json',
  //         body: JSON.stringify({
  //           code: 0,
  //           data: { talents: firstCall ? mockTalents : [mockTalents[1]] },
  //         }),
  //       })
  //     } else {
  //       route.continue()
  //     }
  //   })

  //   // Auto-confirm the native confirm dialog
  //   page.on('dialog', (dialog) => dialog.accept())

  //   await page.goto('/app/jobs/1/board')
  //   await expect(page.getByText('John Doe')).toBeVisible()

  //   // Click the close/delete icon next to John Doe
  //   const deleteIcon = page.locator('.anticon-close-circle').first()
  //   await deleteIcon.click()

  //   await expect.poll(() => deleteCallCount).toBe(1)
  //   await expect(page.getByText('John Doe')).not.toBeVisible()
  // })
});
