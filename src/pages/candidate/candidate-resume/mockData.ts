export default {
  metadata: {
    candidate_name: "John Doe",
    generated_date: "2026-02-11",
    version: 1,
  },

  contact: {
    email: "john.doe@example.com",
    phone: "1234567890",
    location: "New York, NY",
    linkedin: "https://www.linkedin.com/in/john-doe-1234567890",
    website: "https://www.example.com",
  },

  professional_summary:
    "John Doe is a software engineer with 5 years of experience in building web applications. He is a quick learner and a team player.",

  experience: [
    {
      title: "Software Engineer",
      company: "Google",
      company_description: "Series B fintech, 80 employees",
      start_date: "Jan 2022",
      end_date: "Present",
      location: "San Francisco, CA",
      bullets: [
        "Built a web application that helped the company save 10% on their marketing budget.",
        "Led a team of 10 engineers to build a new feature that helped the company save 10% on their marketing budget.",
      ],
    },
  ],

  education: [
    {
      degree: "Bachelor of Science in Computer Science",
      institution: "string",
      year: "2022",
      location: "San Francisco, CA",
      honors: "Cum Laude",
    },
  ],

  skills: {
    categories: [
      {
        category: "Technical",
        skills: ["JavaScript", "React", "Node.js", "Python", "SQL"],
      },
      {
        category: "Product",
        skills: [
          "Product Management",
          "Product Design",
          "Product Marketing",
          "Product Strategy",
        ],
      },
      {
        category: "Languages",
        skills: ["English", "Spanish", "French", "German"],
      },
    ],
  },

  additional: [
    {
      type: "Certification",
      description: "Certification in JavaScript",
    },
    {
      type: "Award",
      description: "Award for the best software engineer",
    },
    {
      type: "Publication",
      description: "Publication in the Journal of Computer Science",
    },
  ],
};
