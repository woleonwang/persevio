import { http, HttpResponse } from 'msw'
import {
  mockJob,
  mockJobList,
  mockNewTalent,
  mockParsedResume,
  mockStaffs,
  mockTalents,
} from './data'

// All backend responses follow the convention: HTTP 200, { code: 0, data: ... }
export const handlers = [
  // ─── Jobs ─────────────────────────────────────────────────────────────────
  http.get('/api/jobs', () =>
    HttpResponse.json({ code: 0, data: { jobs: mockJobList } }),
  ),

  http.get('/api/jobs/:jobId', ({ params }) => {
    const jobId = Number(params.jobId)
    const job = jobId === 1 ? mockJob : { ...mockJob, id: jobId }
    return HttpResponse.json({
      code: 0,
      data: { job, unviewed_talent_count: 0 },
    })
  }),

  http.post('/api/jobs/:jobId/post_job', () =>
    HttpResponse.json({ code: 0, data: {} }),
  ),

  http.post('/api/jobs/:jobId/destroy', () =>
    HttpResponse.json({ code: 0, data: {} }),
  ),

  // ─── Talents ──────────────────────────────────────────────────────────────
  http.get('/api/jobs/:jobId/talents', () =>
    HttpResponse.json({ code: 0, data: { talents: mockTalents } }),
  ),

  http.get('/api/jobs/:jobId/talents/check_name', () =>
    HttpResponse.json({ code: 0, data: { is_exists: false } }),
  ),

  http.post('/api/jobs/:jobId/talents', () =>
    HttpResponse.json({ code: 0, data: mockNewTalent }),
  ),

  http.post('/api/jobs/:jobId/talents/:talentId/destroy', () =>
    HttpResponse.json({ code: 0, data: {} }),
  ),

  http.post('/api/jobs/:jobId/upload_resume_for_interview_design', () =>
    HttpResponse.json({ code: 0, data: mockParsedResume }),
  ),

  // ─── Staffs ───────────────────────────────────────────────────────────────
  http.get('/api/staffs', () =>
    HttpResponse.json({ code: 0, data: { staffs: mockStaffs } }),
  ),
]
