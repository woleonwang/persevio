export type TTalentResume = {
  contact_information: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    website_portfolio: string;
    github: string;
  };
  summary: string;
  skills: string;
  patents: string;
  professional_affiliations: string;
  extraction_notes: string;

  work_experience: {
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string;
    description: string;
  }[];

  education: {
    institution: string;
    degree: string;
    field_of_study: string;
    start_date: string;
    end_date: string;
    gpa: string;
    honors: string;
  }[];

  certifications: {
    name: string;
    issuing_organization: string;
    date_obtained: string;
    expiration_date: string;
    credential_id: string;
  }[];

  projects: {
    name: string;
    description: string;
    technologies: string;
    start_date: string;
    end_date: string;
    url: string;
  }[];

  languages: {
    language: string;
    proficiency: string;
  }[];

  publications: {
    title: string;
    publisher_or_venue: string;
    date: string;
    url: string;
    co_authors: string;
  }[];

  awards_and_honors: {
    name: string;
    issuing_organization: string;
    date: string;
  }[];

  volunteer_work: {
    organization: string;
    role: string;
    start_date: string;
    end_date: string;
    description: string;
  }[];

  conferences_and_speaking: {
    event_name: string;
    topic: string;
    date: string;
    role: string;
  }[];

  training_and_courses: {
    name: string;
    provider: string;
    date: string;
  }[];

  other: {
    section_title: string;
    content: string;
  }[];
};
