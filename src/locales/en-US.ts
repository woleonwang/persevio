export default {
  hello: "world",

  menu: {
    newRole: "Open a new role",
    jobs: "Jobs",
    company: "Company Info",
    settings: "Settings",
  },

  job: {
    chat: "Chat",
    document: "Job Requirement Document",
  },

  chat: {
    tips: "Tips: You can directly edit my responses! Modify summaries, add information, or answer my questions right after or below them.",
    yes: "Yes.",
    no: "No.",
    accurate: "Accurate.",
    proposal: "Your proposal is good.",
    no_others: "No further modifications needed.",

    create_job: "Open a new role",
    define_job_requirement: "Define job requirements",
    define_interview_plan: "Define interview plan",
    draft_job_description: "Draft job description",
    create_chatbot: "Create chatbot for candidate",

    viona_intro_candidate: "your application copilot",
    viona_intro_staff: "AI recruiter",

    share_basic: "Click here to share basic information",
    share_reference: "Click here to share references",
    share_team: "Click here to share team context",
    ideal_profile: "Edit ideal profile",
    other_requirements: "Click here to provide other requirements",
  },

  job_requirement_form: {
    tips: "You don't have to answer every question below, but more information from you will help me form a more accurate initial understanding of the role, which leads to a more productive conversation.",
    basic_information: "Basic information",
    time: "Is this a <b>full-time</b> or <b>part-time</b> role? If part-time, how many hours per week are required?",
    full_time: "Full-time",
    part_time: "Part-time",
    role: "Is this role a <b>perm role</b> or a <b>contract role</b>?",
    perm: "Perm role",
    contract: "Contract role",
    duration: "Contract duration (in months)",
    remote_type:
      "Is this role <b>fully onsite</b>, <b>fully remote</b>, or <b>hybrid</b>?",
    on_site: "Fully onsite",
    remote: "Fully remote",
    hybrid: "Hybrid",
    city: "Which <b>city</b> will this role be based in?",
    address: "What is the <b>office address</b> for this role?",
    seniority: "What is the <b>seniority</b> of this role?",
    seniority_hint: `- **Internship/Trainee/Entry Level** - No prior experience required; primary focus is on learning and skill development. Training and close guidance are provided to build foundational knowledge and competencies.\n\n- **Junior**  - Some relevant experience required; contributes to tasks under supervision but isn’t responsible for leading major projects or objectives. Works closely with senior team members who oversee key business goals.\n\n- **Senior**- A highly skilled individual contributor who tackles complex problems and delivers impactful results. Works independently on challenging assignments and provides technical expertise to the team. May mentor Junior members, sharing knowledge and best practices, but is primarily focused on individual contributions rather than team leadership or project management.\n\n- **Manager/Team Lead** - This role serves as a bridge between the Senior level and the Director/Head of Department level. Managers/Team Leads have direct responsibility for leading and managing a team, including performance management, coaching, and ensuring the team meets its objectives. They are experienced professionals who can independently manage projects and provide guidance to Junior and Senior team members. Unlike Senior roles, they have direct reports; unlike Directors, their focus is on team-level execution rather than broad departmental strategy.\n\n- **Director/Head of Department** - Oversees critical business functions and manages larger teams. Responsible for aligning team performance with broader company goals, driving strategic initiatives within their area of responsibility.\n\n- **Senior Executive/Leadership Team** - Sets the overall strategic direction for the company, accountable for company-wide objectives and profit and loss (P&L). Leads major business decisions and ensures alignment across all departments.`,
    intership: "Internship/Trainee/Entry Level",
    junior: "Junior",
    senior: "Senior",
    manager: "Manager/Team Lead",
    director: "Director/Head of Department",
    executive: "Senior Executive/Leadership Team",
    internal_employee: "Is there an internal employee level for this role?",
    head_count: "How many headcount? ",
    when_start: "When do you need this role to start?",
    soon: "As soon as possible",
    one_month: "Within 1 month",
    two_month: "Within 2 month",
    three_month: "Within 3 month",
    not_hurry: "We are not in a hurry",

    reference: "Reference materials",
    materials:
      "Any relevant materials that you believe can help us better understand the role. For example, a draft JD, a JD of a similar role, etc.",
    usage:
      "How should I use the reference materials? Tell me what this reference material is and how should we use it. For example, is this a JD you drafted for this particular role, or a JD of a similar role from another company, etc.)",

    team_context: "Team Context",
    team: "Which <b>team</b> will this role join?",
    create_team: "Create Team",
    team_details: "Team Details",
    team_name: "Team name",
    team_intro:
      "Brief intro about this team's core objectives and responsibilities.",
    members_count: "How many team members, excluding this new role?",
    menbers_detail:
      "Brief intro about the team members. Their responsibilities, experience levels, where they are from, etc.",
    team_lead: "Who is the team lead?",
    team_lead_detail:
      "Brief introduction to the team lead, their working style. etc",
    team_language: "What is the working language of the team",
    report_to: "Who will this role report to?",
    manager_detail:
      "Brief intro about this role's direct manager, their working style, etc.",
    collaborators:
      "Who will be the key collaborators (internal teams/roles, external partners/clients)?",
    team_others:
      "Is there anything about the team that a potential candidate should know?",

    other_requirements: "Other Requirements",
    visa: "Visa Requirements",
    country: "Country",
    china: "China",
    singapore: "Singapore",
    visa_type: "Supported Visa Types",
    singapore_citizen: "Singapore Citizen",
    singapore_pr: "Singapore PR",
    ep: "EP",
    sp: "SP",
    wp: "WP",
    dp: "DP",
    other_singapore_visa: "Other",
    no_visa: "We cannot sponsor Visa",
    has_visa: "We can sponsor Visa",
    other_visa: "Other",
    visa_type_singapore_other: "Other",

    language_group: "Language proficiency",
    language: "Language",
    chinese: "Chinese",
    english: "English",
    proficiency: "Proficiency level",
    native_speaker: "Native Speaker",
    professional: "Professional Proficiency",
    daily_conversation: "Daily Conversational",
    proficiency_other: "Other",
    proficiency_other_name: "Other",

    travel_group: "Travel",
    need_travel: "Travel",
    no_travel: "No travel",
    hoc_travel: "Ad hoc travel",
    some_travel: "Some travel",
    regular_travel: "Regular travel",
    destination: "Destinations",
    nature: "Nature of travel",
    regularity: "Regularity",

    onboarding: "Onboarding date before",
    certification:
      "Certifications, security clearances, legal requirements, etc",
    other: "Others",

    create_team_succeed: "Create team succeed",
    required_error_message: "Please enter or select",
  },

  ideal_profile: {
    minimum: "Minimum",
    big_plus: "Big Plus",
    plus: "Plus",
  },

  company: {
    name: "Company Name",
    knowledge_base: "Knowledge Base",
    hint: {
      title:
        "Viona, your AI Recruiter, relies on the information in this database to perform key tasks:",
      li1: "Understanding job requirements during conversations.",
      li2: "Creating accurate and compelling job descriptions.",
      li3: "Providing informed answers to candidate inquiries about the company.",
      li4: "Many other tasks.",
      footer:
        "Please ensure all company details are comprehensive, accurate, and kept current. Incomplete or outdated information will impact Viona's effectiveness",
    },
  },

  settings: {
    profile: "Profile",
    name: "Name",
    email: "Email",
    logout: "Log out",
    change_password: "Change Password",
  },

  create_job: {
    new_role: "Open a new role",
    job_name: "Job Title",
  },

  save: "Save",
  cancel: "Cancel",
  submit: "Submit",
};
