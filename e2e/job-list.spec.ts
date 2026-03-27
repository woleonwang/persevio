import { test, expect, Page } from "@playwright/test";

// ─── Mock API Helpers ─────────────────────────────────────────────────────────

const mockJobs = [
  {
    id: 1,
    name: "Senior Frontend Engineer",
    staff_id: 10,
    posted_at: null,
    jd_doc_id: 0,
    jd_version: 0,
    total_candidates: 5,
    candidates_passed_screening: 2,
  },
  {
    id: 2,
    name: "Product Manager",
    staff_id: 11,
    posted_at: "2024-01-15T10:00:00Z",
    jd_doc_id: 42,
    jd_version: 1,
    total_candidates: 12,
    candidates_passed_screening: 4,
  },
];

const mockStaffs = [
  { id: 10, name: "Alice" },
  { id: 11, name: "Bob" },
];

async function setupJobListMocks(page: Page, jobs = mockJobs) {
  await page.route("**/api/jobs**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { jobs } }),
    });
  });

  await page.route("**/api/staffs", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { staffs: mockStaffs } }),
    });
  });

  await page.route("**/api/jobs/*/destroy", (route) => {
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
      body: JSON.stringify({
        code: 0,
        data: { unread_count: 0, job_ids: [] },
      }),
    });
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Job List 页面", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((token) => {
      window.localStorage.setItem("token", token);
    }, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjozLCJleHAiOjE3ODIzNTc3MjIsImlhdCI6MTc3NDU4MTcyMn0.NYPilnI-UJ0XCl4nbctruPFGLGUlFlxtVEYnV7e6pGs");
    await setupJobListMocks(page);
  });

  // ── 流程 1：查看职位列表并搜索 ───────────────────────────────────────────

  test("职位列表正确渲染并支持搜索过滤", async ({ page }) => {
    await page.goto("/app/jobs");
    const jobsTable = page.getByRole("table");

    // Both jobs should be visible
    await expect(
      jobsTable.getByRole("cell", { name: "Senior Frontend Engineer" }),
    ).toBeVisible();
    await expect(
      jobsTable.getByRole("cell", { name: "Product Manager" }),
    ).toBeVisible();

    // Type in search box
    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("Product");

    // Only matching job visible
    await expect(
      jobsTable.getByRole("cell", { name: "Product Manager" }),
    ).toBeVisible();
    await expect(
      jobsTable.getByRole("cell", { name: "Senior Frontend Engineer" }),
    ).toHaveCount(0);

    // Clear search → both visible again
    await searchInput.clear();
    await expect(
      jobsTable.getByRole("cell", { name: "Senior Frontend Engineer" }),
    ).toBeVisible();
  });

  test("显示正确的发布状态标签", async ({ page }) => {
    await page.goto("/app/jobs");

    await expect(page.getByText(/published/i).first()).toBeVisible();
    await expect(page.getByText(/unpublished/i).first()).toBeVisible();
  });

  // ── 流程 2：新建职位 ──────────────────────────────────────────────────────

  test('点击"新建职位"跳转到创建页面', async ({ page }) => {
    await page.goto("/app/jobs");

    const createBtn = page.getByRole("button", { name: /post a job/i });
    await createBtn.click();

    await expect(page).toHaveURL(/\/app\/entry\/create-job/);
  });

  // // ── 流程 3：删除职位（完整交互） ──────────────────────────────────────────

  // test('删除职位：确认弹窗 → 确认 → 职位从列表消失', async ({ page }) => {
  //   // After delete, return only second job
  //   let deleteCallCount = 0
  //   await page.route('**/api/jobs/1/destroy', (route) => {
  //     deleteCallCount++
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: {} }),
  //     })
  //   })

  //   let refetchCount = 0
  //   await page.route('**/api/jobs**', (route) => {
  //     refetchCount++
  //     const jobs = refetchCount <= 1 ? mockJobs : [mockJobs[1]]
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: { jobs } }),
  //     })
  //   })

  //   await page.goto('/app/jobs')
  //   await expect(page.getByText('Senior Frontend Engineer')).toBeVisible()

  //   // Click delete for first job
  //   const deleteButtons = page.getByRole('button', { name: /delete/i })
  //   await deleteButtons.first().click()

  //   // Confirm modal should appear
  //   const modal = page.locator('.ant-modal-confirm')
  //   await expect(modal).toBeVisible()

  //   // Click OK to confirm
  //   await modal.getByRole('button', { name: /ok/i }).click()

  //   // Job should be gone
  //   await expect(
  //     page.getByText('Senior Frontend Engineer'),
  //   ).not.toBeVisible()
  //   expect(deleteCallCount).toBe(1)
  // })

  // test('删除职位：点击取消后职位保留', async ({ page }) => {
  //   let deleteCallCount = 0
  //   await page.route('**/api/jobs/*/destroy', (route) => {
  //     deleteCallCount++
  //     route.fulfill({
  //       status: 200,
  //       contentType: 'application/json',
  //       body: JSON.stringify({ code: 0, data: {} }),
  //     })
  //   })

  //   await page.goto('/app/jobs')
  //   await expect(page.getByText('Senior Frontend Engineer')).toBeVisible()

  //   const deleteButtons = page.getByRole('button', { name: /delete/i })
  //   await deleteButtons.first().click()

  //   const modal = page.locator('.ant-modal-confirm')
  //   await modal.getByRole('button', { name: /cancel/i }).click()

  //   // Job should still be there
  //   await expect(page.getByText('Senior Frontend Engineer')).toBeVisible()
  //   expect(deleteCallCount).toBe(0)
  // })
});
