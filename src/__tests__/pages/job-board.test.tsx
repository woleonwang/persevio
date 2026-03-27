import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { http, HttpResponse } from 'msw'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.mock is hoisted to top of file, so mockCopy must be declared via vi.hoisted()
const mockCopy = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return { ...actual, copy: mockCopy }
})

import { server } from '../mocks/server'
import { mockJob, mockJobPosted, mockTalents } from '../mocks/data'
import JobBoard from '@/pages/job/board/index'

// ─── Router / Navigation mocks ────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ jobId: '1' }),
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderJobBoard = () =>
  render(
    <MemoryRouter>
      <JobBoard />
    </MemoryRouter>,
  )

// Returns a job with no talents (empty candidate list)
const withNoTalents = () =>
  server.use(
    http.get('/api/jobs/:jobId/talents', () =>
      HttpResponse.json({ code: 0, data: { talents: [] } }),
    ),
  )

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('JobBoard 页面', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(window.confirm).mockReturnValue(true)
  })

  // ── 基本渲染 ──────────────────────────────────────────────────────────────

  it('页面加载后显示三个区块：对话任务、文档任务、候选人', async () => {
    renderJobBoard()

    await waitFor(() => {
      // Conversation block: first task button
      expect(
        screen.getByText('job_board.detailed_define_job_requirement'),
      ).toBeInTheDocument()
      // Document block
      expect(
        screen.getByText('job_board.job_requirement_table'),
      ).toBeInTheDocument()
      // Candidates block (empty state)
      expect(
        screen.getByText('job_board.no_candidates_yet'),
      ).toBeInTheDocument()
    })
  })

  it('显示职位名称', async () => {
    renderJobBoard()

    await waitFor(() => {
      expect(screen.getByText(mockJob.name)).toBeInTheDocument()
    })
  })

  // ── 候选人列表 ────────────────────────────────────────────────────────────

  it('有候选人时显示候选人按钮列表', async () => {
    server.use(
      http.get('/api/jobs/:jobId/talents', () =>
        HttpResponse.json({ code: 0, data: { talents: mockTalents } }),
      ),
    )

    renderJobBoard()

    await waitFor(() => {
      expect(screen.getByText(mockTalents[0].name)).toBeInTheDocument()
      expect(screen.getByText(mockTalents[1].name)).toBeInTheDocument()
    })
  })

  // ── 发布开关：JD 未完成时禁用 ─────────────────────────────────────────────

  it('jd_doc_id 为 0 时发布开关处于禁用状态', async () => {
    // mockJob has jd_doc_id = 0
    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      const switchEl = screen.getByRole('switch')
      expect(switchEl).toBeDisabled()
    })
  })

  // ── 发布开关：JD 完成后可切换 ─────────────────────────────────────────────

  it('jd_doc_id 存在时点击发布开关调用 post_job API', async () => {
    let postJobCalled = false

    server.use(
      http.get('/api/jobs/:jobId', () =>
        HttpResponse.json({
          code: 0,
          data: { job: mockJobPosted, unviewed_talent_count: 0 },
        }),
      ),
      http.post('/api/jobs/:jobId/post_job', () => {
        postJobCalled = true
        return HttpResponse.json({ code: 0, data: {} })
      }),
    )

    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      const switchEl = screen.getByRole('switch')
      expect(switchEl).not.toBeDisabled()
    })

    const switchEl = screen.getByRole('switch')
    await userEvent.click(switchEl)

    await waitFor(() => {
      expect(postJobCalled).toBe(true)
    })
  })

  // ── 删除候选人 ────────────────────────────────────────────────────────────

  it('点击删除图标并确认后调用 destroy API，候选人从列表消失', async () => {
    let destroyCalled = false
    // Counter: first GET returns all talents, subsequent calls return only the second talent
    let talentsGetCount = 0

    server.use(
      http.get('/api/jobs/:jobId/talents', () => {
        const talents = talentsGetCount++ === 0 ? mockTalents : [mockTalents[1]]
        return HttpResponse.json({ code: 0, data: { talents } })
      }),
      http.post('/api/jobs/:jobId/talents/:talentId/destroy', () => {
        destroyCalled = true
        return HttpResponse.json({ code: 0, data: {} })
      }),
    )

    vi.mocked(window.confirm).mockReturnValue(true)
    renderJobBoard()

    await waitFor(() => {
      expect(screen.getByText(mockTalents[0].name)).toBeInTheDocument()
    })

    // Click the delete (CloseCircleOutlined) icon next to first talent
    const deleteIcons = document.querySelectorAll('.anticon-close-circle')
    await act(async () => {
      ;(deleteIcons[0] as HTMLElement).click()
    })

    await waitFor(() => {
      expect(destroyCalled).toBe(true)
      expect(screen.queryByText(mockTalents[0].name)).not.toBeInTheDocument()
    })
  })

  it('点击删除图标但取消后候选人保留，destroy API 未被调用', async () => {
    let destroyCalled = false

    server.use(
      http.get('/api/jobs/:jobId/talents', () =>
        HttpResponse.json({ code: 0, data: { talents: mockTalents } }),
      ),
      http.post('/api/jobs/:jobId/talents/:talentId/destroy', () => {
        destroyCalled = true
        return HttpResponse.json({ code: 0, data: {} })
      }),
    )

    vi.mocked(window.confirm).mockReturnValue(false)
    renderJobBoard()

    await waitFor(() => {
      expect(screen.getByText(mockTalents[0].name)).toBeInTheDocument()
    })

    const deleteIcons = document.querySelectorAll('.anticon-close-circle')
    await act(async () => {
      ;(deleteIcons[0] as HTMLElement).click()
    })

    await waitFor(() => {
      expect(destroyCalled).toBe(false)
      expect(screen.getByText(mockTalents[0].name)).toBeInTheDocument()
    })
  })

  // ── 分享链接复制 ──────────────────────────────────────────────────────────

  it('点击分享图标后调用 copy 工具函数写入正确 URL', async () => {
    mockCopy.mockClear()
    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      expect(screen.getByText(mockJob.name)).toBeInTheDocument()
    })

    const shareIcon = document.querySelector('.anticon-share-alt') as HTMLElement
    await act(async () => {
      shareIcon.click()
    })

    await waitFor(() => {
      expect(mockCopy).toHaveBeenCalledWith(
        expect.stringContaining(`/app/jobs/${mockJob.id}/board`),
      )
    })
  })

  // ── 未完成任务计数 ────────────────────────────────────────────────────────

  it('所有文档 doc_id 均为 0 时未完成计数为 7（5 个文档 + 固定 2）', async () => {
    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      // unfinishedCount = [!req, !jd, !comp, !outreach, !interview].filter(Boolean).length + 2
      // With all 0: 5 + 2 = 7
      expect(
        screen.getByText('job_board.unfinished_tasks'.replace('{{count}}', '7')),
      ).toBeInTheDocument()
    })
  })

  it('部分文档完成时未完成计数减少', async () => {
    server.use(
      http.get('/api/jobs/:jobId', () =>
        HttpResponse.json({
          code: 0,
          data: {
            job: { ...mockJob, requirement_doc_id: 10, jd_doc_id: 11 },
            unviewed_talent_count: 0,
          },
        }),
      ),
    )
    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      // requirement_doc_id and jd_doc_id are set: 3 remaining + 2 = 5
      expect(
        screen.getByText('job_board.unfinished_tasks'.replace('{{count}}', '5')),
      ).toBeInTheDocument()
    })
  })

  // ── 任务按钮导航 ──────────────────────────────────────────────────────────

  it('点击"Detailed Define Job Requirement"按钮跳转到 job-requirement chat', async () => {
    const user = userEvent.setup()
    withNoTalents()
    renderJobBoard()

    await waitFor(() => {
      expect(
        screen.getByText('job_board.detailed_define_job_requirement'),
      ).toBeInTheDocument()
    })

    await user.click(
      screen.getByText('job_board.detailed_define_job_requirement'),
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      `/app/jobs/${mockJob.id}/chat/job-requirement`,
    )
  })
})
