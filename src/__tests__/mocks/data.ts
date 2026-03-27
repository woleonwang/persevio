// ─── Mock Jobs ────────────────────────────────────────────────────────────────

export const mockJob: IJob = {
  id: 1,
  name: 'Senior Frontend Engineer',
  staff_id: 10,
  posted_at: null,
  jd_doc_id: 0,
  requirement_doc_id: 0,
  compensation_details_doc_id: 0,
  outreach_message_doc_id: 0,
  interview_plan_doc_id: 0,
  jd_version: 0,
  invitation_token: 'tok-abc123',
  status: 1,
  is_confidential: false,
  company_id: 1,
}

export const mockJobPosted: IJob = {
  ...mockJob,
  id: 2,
  name: 'Product Manager',
  staff_id: 11,           // Bob — distinct from mockJob (Alice, id 10) for filter tests
  posted_at: '2024-01-15T10:00:00Z',
  jd_doc_id: 42,
  requirement_doc_id: 10,
}

export const mockJobFull: IJob = {
  ...mockJob,
  id: 3,
  name: 'Backend Engineer',
  requirement_doc_id: 11,
  jd_doc_id: 43,
  compensation_details_doc_id: 20,
  outreach_message_doc_id: 30,
  interview_plan_doc_id: 40,
}

export const mockJobList = [
  { ...mockJob, total_candidates: 5, candidates_passed_screening: 2 },
  { ...mockJobPosted, total_candidates: 12, candidates_passed_screening: 4 },
]

// ─── Mock Staffs ──────────────────────────────────────────────────────────────

export const mockStaffs: IStaff[] = [
  { id: 10, name: 'Alice' },
  { id: 11, name: 'Bob' },
]

// ─── Mock Talents ─────────────────────────────────────────────────────────────

export const mockTalents: TTalent[] = [
  { id: 100, name: 'John Doe', job_id: 1, status: 'active' },
  { id: 101, name: 'Jane Smith', job_id: 1, status: 'active' },
]

export const mockNewTalent: TTalent = {
  id: 102,
  name: 'New Candidate',
  job_id: 1,
  status: 'active',
}

export const mockParsedResume = {
  talent_name: 'New Candidate',
  resume: 'base64encodedresume==',
}
