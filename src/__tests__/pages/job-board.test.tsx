import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import JobDetailsForAts from '@/components/JobDetailsForAts'

import { mockJob } from '../mocks/data'

const mockNavigate = vi.fn()
const mockFetchJob = vi.fn()
const mockSetUnviewedTalentCount = vi.fn()
const mockFetchJobs = vi.fn()
const mockGet = vi.fn()
const mockGetQuery = vi.fn()
const mockUpdateQuery = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/hooks/useJob', () => ({
  default: () => ({
    job: mockJob,
    fetchJob: mockFetchJob,
    unviewedTalentCount: 3,
    setUnviewedTalentCount: mockSetUnviewedTalentCount,
  }),
}))

vi.mock('@/utils/request', () => ({
  Get: (...args: any[]) => mockGet(...args),
  Post: vi.fn().mockResolvedValue({ code: 0 }),
}))

vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>()
  return {
    ...actual,
    getQuery: (...args: any[]) => mockGetQuery(...args),
    updateQuery: (...args: any[]) => mockUpdateQuery(...args),
  }
})

vi.mock('@/store/global', () => ({
  default: {
    fetchJobs: (...args: any[]) => mockFetchJobs(...args),
  },
}))

vi.mock('@/components/Icon', () => ({
  default: ({ onClick }: { onClick?: () => void }) => (
    <button data-testid={onClick ? 'back-icon' : 'icon'} onClick={onClick}>
      icon
    </button>
  ),
}))

vi.mock('@/components/JobDetailsForAts/components/JobDocument', () => ({
  default: ({ chatType }: { chatType: string }) => (
    <div data-testid="job-document">{chatType}</div>
  ),
}))
vi.mock('@/components/JobDetailsForAts/components/JobPipeline', () => ({
  default: () => <div data-testid="job-pipeline">pipeline-content</div>,
}))
vi.mock('@/components/AdminTalents', () => ({
  default: () => <div data-testid="admin-talents">admin-talents-content</div>,
}))
vi.mock('@/components/JobDetailsForAts/components/JobSourcingChannels', () => ({
  default: () => <div data-testid="sourcing-channels">sourcing-content</div>,
}))
vi.mock(
  '@/components/JobDetailsForAts/components/JobOutreachCampaigns',
  () => ({
    default: () => <div data-testid="outreach-campaigns">outreach-content</div>,
  }),
)
vi.mock('@/components/JobDetailsForAts/components/JobAnalytics', () => ({
  default: () => <div data-testid="job-analytics">analytics-content</div>,
}))
vi.mock('@/components/JobDetailsForAts/components/JobSettings', () => ({
  default: () => <div data-testid="job-settings">settings-content</div>,
}))
vi.mock('@/components/JobCollaboratorModal', () => ({
  default: () => null,
}))
vi.mock('@/components/Tabs', () => ({
  default: () => <div data-testid="sub-tabs">sub-tabs</div>,
}))

const renderJobDetailsForAts = (props?: { role?: 'admin' | 'staff' }) =>
  render(
    <MemoryRouter>
      <JobDetailsForAts {...props} />
    </MemoryRouter>,
  )

describe('JobDetailsForAts 组件', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockFetchJob.mockReset()
    mockSetUnviewedTalentCount.mockReset()
    mockFetchJobs.mockReset()
    mockGet.mockReset()
    mockGetQuery.mockReset()
    mockUpdateQuery.mockReset()

    mockGetQuery.mockReturnValue('')
    mockGet.mockResolvedValue({
      code: 0,
      data: { talents: [], linkedin_profiles: [] },
    })
  })

  it('tab query 合法时激活对应 tab（pipeline）', async () => {
    mockGetQuery.mockReturnValue('pipeline')
    renderJobDetailsForAts()

    await waitFor(() => {
      expect(screen.getByTestId('job-pipeline')).toBeInTheDocument()
    })
  })

  it('legacy tab=talents 映射到 pipeline 并 updateQuery', async () => {
    mockGetQuery.mockReturnValue('talents')
    renderJobDetailsForAts()

    await waitFor(() => {
      expect(screen.getByTestId('job-pipeline')).toBeInTheDocument()
    })
    expect(mockUpdateQuery).toHaveBeenCalledWith('tab', 'pipeline')
  })

  it('无 tab 且 talents 非空时默认到 pipeline', async () => {
    mockGet.mockResolvedValue({
      code: 0,
      data: { talents: [{ id: 1 }], linkedin_profiles: [] },
    })
    renderJobDetailsForAts()

    await waitFor(() => {
      expect(screen.getByTestId('job-pipeline')).toBeInTheDocument()
    })
  })

  it('无 tab 且 talents 为空时默认到 jobRequirements', async () => {
    renderJobDetailsForAts()

    await waitFor(() => {
      expect(screen.getByTestId('job-document')).toHaveTextContent(
        'jobRequirement',
      )
    })
  })

  it('点击 tab 时调用 updateQuery 并切换内容', async () => {
    renderJobDetailsForAts()

    await waitFor(() => {
      expect(screen.getByTestId('job-document')).toBeInTheDocument()
    })

    await userEvent.click(
      screen.getByRole('tab', { name: /job_details\.pipeline/i }),
    )

    await waitFor(() => {
      expect(screen.getByTestId('job-pipeline')).toBeInTheDocument()
    })
    expect(mockUpdateQuery).toHaveBeenCalledWith('tab', 'pipeline')
  })

  it("role='staff' 时渲染 JobPipeline 分支", async () => {
    mockGetQuery.mockReturnValue('pipeline')
    renderJobDetailsForAts({ role: 'staff' })

    await waitFor(() => {
      expect(screen.getByTestId('job-pipeline')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-talents')).not.toBeInTheDocument()
    })
  })

  it("role='admin' 时渲染 AdminTalents 分支", async () => {
    mockGetQuery.mockReturnValue('pipeline')
    renderJobDetailsForAts({ role: 'admin' })

    await waitFor(() => {
      expect(screen.getByTestId('admin-talents')).toBeInTheDocument()
      expect(screen.queryByTestId('job-pipeline')).not.toBeInTheDocument()
    })
  })

  it('点击返回图标时 staff/admin 导航到不同路由', async () => {
    mockGetQuery.mockReturnValue('jobRequirements')

    const { unmount } = renderJobDetailsForAts({ role: 'staff' })
    await waitFor(() => {
      expect(screen.getByTestId('job-document')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByTestId('back-icon'))
    expect(mockNavigate).toHaveBeenCalledWith('/app/jobs')

    unmount()
    mockNavigate.mockReset()

    renderJobDetailsForAts({ role: 'admin' })
    await waitFor(() => {
      expect(screen.getByTestId('job-document')).toBeInTheDocument()
    })
    await userEvent.click(screen.getByTestId('back-icon'))
    expect(mockNavigate).toHaveBeenCalledWith('/admin/jobs')
  })
})
