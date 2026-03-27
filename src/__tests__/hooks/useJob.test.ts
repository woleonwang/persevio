import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { describe, it, expect, vi } from "vitest";
import React, { act } from "react";

import { server } from "../mocks/server";
import { mockJob } from "../mocks/data";
import useJob from "@/hooks/useJob";

// ─── Mock react-router useParams ──────────────────────────────────────────────

vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useParams: () => ({ jobId: "1" }),
  };
});

// ─── Wrapper providing router context ────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, null, children);

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useJob hook", () => {
  it("成功获取 job 后设置 job 状态", async () => {
    const { result } = renderHook(() => useJob(), { wrapper });

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    expect(result.current.job?.id).toBe(mockJob.id);
    expect(result.current.job?.name).toBe(mockJob.name);
  });

  it("返回 unviewed_talent_count", async () => {
    server.use(
      http.get("/api/jobs/:jobId", () =>
        HttpResponse.json({
          code: 0,
          data: { job: mockJob, unviewed_talent_count: 3 },
        }),
      ),
    );

    const { result } = renderHook(() => useJob(), { wrapper });

    await waitFor(() => {
      expect(result.current.unviewedTalentCount).toBe(3);
    });
  });

  it("fetchJob 可手动重新获取 job", async () => {
    const { result } = renderHook(() => useJob(), { wrapper });

    await waitFor(() => {
      expect(result.current.job).toBeDefined();
    });

    // Update the server response for refetch
    const updatedJob = { ...mockJob, name: "Updated Job Name" };
    server.use(
      http.get("/api/jobs/:jobId", () =>
        HttpResponse.json({
          code: 0,
          data: { job: updatedJob, unviewed_talent_count: 0 },
        }),
      ),
    );

    await act(() => result.current.fetchJob());

    await waitFor(() => {
      expect(result.current.job?.name).toBe("Updated Job Name");
    });
  });
});
