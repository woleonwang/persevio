export default {
  contact_information: {
    name: "张三",
    email: "zhangsan@example.com",
    phone: "+86 138 0000 0001",
    location: "北京市朝阳区",
    linkedin: "https://linkedin.com/in/zhangsan",
    website_portfolio: "https://zhangsan.dev",
    github: "https://github.com/zhangsan",
  },
  summary:
    "5年全栈开发经验，擅长 React、Node.js 与云原生技术。曾主导多个百万级用户产品研发。",
  skills: "React, TypeScript, Node.js, Python, AWS, Docker, Kubernetes",
  patents: "一种基于深度学习的简历解析方法（申请号：CN2023xxxxxx）",
  professional_affiliations: "ACM 会员、IEEE 学生会员",
  extraction_notes: "简历由系统自动解析，部分字段可能需人工核对。",

  work_experience: [
    {
      company: "某科技公司",
      title: "高级前端工程师",
      location: "北京",
      start_date: "2021-03",
      end_date: "至今",
      description:
        "负责核心产品前端架构设计与开发，主导组件库建设与性能优化，团队规模 8 人。",
    },
    {
      company: "某互联网公司",
      title: "前端开发工程师",
      location: "上海",
      start_date: "2019-07",
      end_date: "2021-02",
      description:
        "参与 B 端 SaaS 产品开发，使用 React + TypeScript 技术栈，完成多个业务模块从 0 到 1 落地。",
    },
  ],

  education: [
    {
      institution: "某某大学",
      degree: "硕士",
      field_of_study: "计算机科学与技术",
      start_date: "2017-09",
      end_date: "2019-06",
      gpa: "3.8/4.0",
      honors: "一等奖学金、优秀毕业生",
    },
    {
      institution: "某某学院",
      degree: "学士",
      field_of_study: "软件工程",
      start_date: "2013-09",
      end_date: "2017-06",
      gpa: "3.6/4.0",
      honors: "国家励志奖学金",
    },
  ],

  certifications: [
    {
      name: "AWS Solutions Architect - Associate",
      issuing_organization: "Amazon Web Services",
      date_obtained: "2022-05",
      expiration_date: "2025-05",
      credential_id: "AWS-SAA-XXXX",
    },
    {
      name: "PMP 项目管理专业人士认证",
      issuing_organization: "PMI",
      date_obtained: "2021-11",
      expiration_date: "2024-11",
      credential_id: "PMP-XXXXX",
    },
  ],

  projects: [
    {
      name: "企业级低代码平台",
      description:
        "面向业务人员的可视化搭建平台，支持表单、流程、报表等场景，日活 5000+。",
      technologies: "React, TypeScript, Node.js, PostgreSQL, Redis",
      start_date: "2022-01",
      end_date: "2023-06",
      url: "https://example.com/lowcode",
    },
    {
      name: "智能简历解析系统",
      description:
        "基于 NLP 的简历解析与结构化提取，支持中英文及多格式文档，准确率 95%+。",
      technologies: "Python, FastAPI, spaCy, Elasticsearch",
      start_date: "2023-07",
      end_date: "至今",
      url: "https://example.com/resume-parser",
    },
  ],

  languages: [
    {
      language: "中文",
      proficiency: "母语",
    },
    {
      language: "英语",
      proficiency: "熟练（CET-6，可进行技术文档阅读与书面沟通）",
    },
  ],

  publications: [
    {
      title: "基于注意力机制的简历信息抽取方法研究",
      publisher_or_venue: "计算机应用与软件",
      date: "2023-08",
      url: "https://example.com/paper1",
      co_authors: "李四, 王五",
    },
    {
      title: "Front-end Performance Optimization in Large-scale SPA",
      publisher_or_venue: "IEEE Software",
      date: "2022-03",
      url: "https://example.com/paper2",
      co_authors: "John Doe",
    },
  ],

  awards_and_honors: [
    {
      name: "年度最佳技术贡献奖",
      issuing_organization: "某科技公司",
      date: "2023-12",
    },
    {
      name: "黑客松一等奖",
      issuing_organization: "某开发者大会",
      date: "2022-09",
    },
  ],

  volunteer_work: [
    {
      organization: "开源社区",
      role: "核心维护者",
      start_date: "2021-01",
      end_date: "至今",
      description:
        "维护某前端组件库，参与 Code Review 与 Issue 处理，累计合并 PR 200+。",
    },
    {
      organization: "某技术沙龙",
      role: "分享嘉宾",
      start_date: "2022-06",
      end_date: "2022-06",
      description: "主题分享：React 性能优化实践与工具链选型。",
    },
  ],

  conferences_and_speaking: [
    {
      event_name: "前端技术大会 2023",
      topic: "大前端工程化与 Monorepo 实践",
      date: "2023-10",
      role: "演讲嘉宾",
    },
    {
      event_name: "某公司内部分享",
      topic: "TypeScript 在业务中的落地与最佳实践",
      date: "2022-05",
      role: "主讲人",
    },
  ],

  training_and_courses: [
    {
      name: "系统架构师培训",
      provider: "某培训机构",
      date: "2022-08",
    },
    {
      name: "深入浅出 Kubernetes",
      provider: "极客时间",
      date: "2021-11",
    },
  ],

  other: [
    {
      section_title: "开源贡献",
      content: "向 React、Vite 等开源项目提交过 PR，其中 3 个被合并。",
    },
    {
      section_title: "个人博客",
      content:
        "技术博客年阅读量 10 万+，主要分享前端工程化与性能优化相关内容。",
    },
  ],
};
