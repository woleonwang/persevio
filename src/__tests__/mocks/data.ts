// ─── Mock Jobs ────────────────────────────────────────────────────────────────

export const mockJob: IJob = {
  id: 1,
  candidate_uuid: 'cuuid-fe-001',
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
  invitation_token: 'tok-product-pm-456',
  candidate_uuid: 'cuuid-product-pm',
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
  {
    ...mockJob,
    total_candidates: 5,
    candidates_passed_screening: 2,
    collaborators: [
      {
        id: 901,
        job_id: mockJob.id,
        staff_id: 10,
        role: 'recruiter' as const,
      },
    ],
  },
  {
    ...mockJobPosted,
    total_candidates: 12,
    candidates_passed_screening: 4,
    collaborators: [
      {
        id: 902,
        job_id: mockJobPosted.id,
        staff_id: 11,
        role: 'recruiter' as const,
      },
    ],
  },
]

// ─── Mock Staffs ──────────────────────────────────────────────────────────────

export const mockStaffs: IStaffWithAccount[] = [
  {
    id: 10,
    name: 'Alice',
    position: '',
    phone: '',
    role: 'admin',
    status: 'active',
    account_id: 100,
    company_id: 1,
    created_at: '',
    updated_at: '',
    account: {
      id: 100,
      username: 'alice@example.com',
      is_admin: 0,
      created_at: '',
      updated_at: '',
    },
  },
  {
    id: 11,
    name: 'Bob',
    position: '',
    phone: '',
    role: 'admin',
    status: 'active',
    account_id: 101,
    company_id: 1,
    created_at: '',
    updated_at: '',
    account: {
      id: 101,
      username: 'bob@example.com',
      is_admin: 0,
      created_at: '',
      updated_at: '',
    },
  },
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
