import { test, expect, Page } from "@playwright/test";

async function setupAtsTalentDetailMocks(page: Page) {
  // Some global app bootstrapping calls (shared with other specs)
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

  // useJob
  await page.route("**/api/jobs/1", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        data: {
          job: {
            id: 1,
            name: "Senior Frontend Engineer",
            staff_id: 10,
            posted_at: null,
            pipeline_stages: JSON.stringify([
              { id: "stage_1", name: "Stage 1" },
              { id: "stage_2", name: "Stage 2" },
            ]),
            interview_defaults_json: JSON.stringify({}),
          },
          unviewed_talent_count: 0,
        },
      }),
    });
  });

  // useTalent
  await page.route("**/api/jobs/1/talents/100", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        data: {
          talent: {
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
                interest_level: { level: "high", explanation: "because" },
              },
            }),
            parsed_content: "resume markdown",
            evaluate_result_updated_at: "2024-01-01T00:00:00Z",
            viewed_at: "2024-01-01T00:00:00Z",
            feedback_updated_at: "2024-01-01T00:00:00Z",
          },
          interviews: [],
        },
      }),
    });
  });

  // AtsTalentDetail page side queries
  await page.route("**/api/jobs/1/talents/100/all_talents", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        data: {
          talents: [
            {
              id: 100,
              job_id: 1,
              name: "John Doe",
              job: { id: 1, name: "Senior Frontend Engineer", posted_at: null },
            },
          ],
        },
      }),
    });
  });

  await page.route("**/api/jobs/1/talents/100/messages", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { messages: [] } }),
    });
  });

  await page.route("**/api/jobs/1/talents/100/notes", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 0, data: {} }),
      });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { talent_notes: [] } }),
    });
  });

  await page.route("**/api/jobs/1/talents/100/active_logs", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ code: 0, data: { active_logs: [] } }),
    });
  });

  // Provide one customized feedback record so "+ Create New Interview Round" exists.
  await page.route("**/api/jobs/1/talents/100/feedback_records", (route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 0, data: {} }),
      });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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
      }),
    });
  });
}

test.describe("AtsTalentDetail 页面", () => {
  test("基本渲染：显示候选人姓名与下载按钮", async ({ page }) => {
    await setupAtsTalentDetailMocks(page);
    await page.goto("/app/jobs/1/standard-board/talents/100");

    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
  });

  test("Move Stage：未选择 stage 时 Save 禁用，选择后提交 /stage", async ({
    page,
  }) => {
    await setupAtsTalentDetailMocks(page);

    let stagePayload: any = null;
    await page.route("**/api/jobs/1/talents/100/stage", async (route) => {
      stagePayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ code: 0, data: {} }),
      });
    });

    await page.goto("/app/jobs/1/standard-board/talents/100");

    await page.getByRole("button", { name: "Move Stage" }).click();
    const modal = page.getByRole("dialog", { name: "Move Stage" });
    await expect(modal).toBeVisible();

    const saveBtn = modal.getByRole("button", { name: "OK" });
    await expect(saveBtn).toBeDisabled();

    // Open Select and choose "Stage 1"
    await modal.getByText("Select stage").click();
    await page.getByTitle("Stage 1").click();

    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await expect.poll(() => stagePayload).toEqual({ stage_id: "stage_1" });
  });

  test("Create New Interview Round：缺少 round/feedback 时提示校验 toast", async ({
    page,
  }) => {
    await setupAtsTalentDetailMocks(page);
    await page.goto("/app/jobs/1/standard-board/talents/100");

    await page
      .getByRole("button", { name: "+ Create New Interview Round" })
      .click();

    // First: missing round
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Please enter interview round.")).toBeVisible();

    // Fill round, missing feedback
    await page.getByPlaceholder("e.g. Round 1, Round 2").fill("Round X");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Please enter feedback.")).toBeVisible();
  });
});

