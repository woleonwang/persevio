export const FLOW_STEP_COUNT = 6;

export const THEME = {
  bg: "#FAF5EA",
  surface: "#FFFFFF",
  ink: "#221C12",
  sub: "#6E6655",
  faint: "#A89D86",
  line: "#ECE3D1",
  fieldBorder: "#DFD6C2",
  accent: "#398FFB",
  accentSoft: "#E9F1FE",
  accentInk: "#FFFFFF",
  danger: "#B23B22",
  dangerSoft: "#F7E9E2",
  reportCream: "#FBF7EE",
  sandDisc: "#EFE6D3",
  sandGlyph: "#8A7B5C",
  whatsappGreen: "#25D366",
  whatsappIcon: "#1FA855",
  whatsappText: "#1B8F4D",
} as const;

export const ASSESS_CONTENT = {
  strong: {
    read: "Strong chance",
    bridge:
      "Let's have a short chat so I can verify a couple of details and put your strongest possible application in front of the hiring manager.",
  },
  middle: {
    read: "Worth exploring",
    bridge:
      "A conversation is the best way for me to understand experience your resume doesn't capture. Let's talk so I can build the most accurate picture of your fit.",
  },
  weak: {
    read: null,
    bridge:
      "There may be experience you have that isn't on your resume. Let's talk so I can represent you as accurately as possible.",
  },
} as const;

export const WRAP_CONTENT = {
  strong: {
    thanks:
      "Thank you, [[Alex]]. That was a genuinely good conversation. I know these chats take real time and thought, and yours gave me exactly what I needed to make your strongest case to the hiring team.",
    disclaimer:
      "This is my professional read, not a hiring decision. The team at [[Persevio]] makes the final call.",
    assessment: [
      "Our conversation confirmed most of what your resume suggested and filled in the parts it couldn't. You clearly know how to run a full desk, and the way you talked through your experience answered the main question I had going in: you have a {strong case} for this role.",
      "The one thing I'd still like to see more of is how you build a client book from scratch. It doesn't change my overall read — it's simply the part of your story that's still being written.",
    ],
    report: {
      lead: [
        "Relevant experience that lines up well with this role.",
        "A consistent track record that sits comfortably above the benchmark for this level.",
        "Real ownership: you've run outcomes end to end.",
      ],
      flag: [
        "How you'd build a new client book from scratch.",
        "Areas where senior-mandate work is newer for you.",
      ],
    },
  },
  middle: {
    thanks:
      "Thank you for taking the time, [[Alex]]. That was a helpful conversation, and it gave me a clearer picture than your resume alone could.",
    disclaimer:
      "This is my professional read, not a hiring decision. The team at [[Persevio]] makes the final call.",
    assessment: [
      "You have real, relevant strengths that came through clearly. There's {genuine potential} here.",
      "What our chat couldn't fully resolve is direct experience in every part of this role. I'll represent both sides of that honestly.",
    ],
    report: {
      lead: [
        "Strong client-facing instincts from your past roles.",
        "A track record of carrying and hitting targets.",
        "Genuine fluency in the industry this desk recruits for.",
      ],
      flag: [
        "Some direct experience gaps I'll be clear about.",
        "How independently you've owned client relationships.",
      ],
    },
  },
  weak: {
    thanks:
      "Thank you for the conversation, [[Alex]], and for being open with me. That kind of honesty makes my job easier and your application stronger.",
    disclaimer:
      "This is my professional read on this one role, not a hiring decision. The team at [[Persevio]] makes the final call.",
    assessment: [
      "I want to be straight with you. Our chat reinforced that there are {real gaps} between your background and what this specific role needs.",
      "That's an honest read on this role, not a verdict on you. You showed me genuine strengths, and they may be a far better fit for other roles.",
    ],
    report: {
      lead: [
        "Useful industry context for the roles this desk works with.",
        "A clear strength managing complex, multi-stakeholder work.",
      ],
      flag: [
        "The core responsibilities this role is built on.",
        "A business-development target you haven't carried before.",
      ],
    },
  },
  incomplete: {
    thanks:
      "Thanks for getting started with me, [[Alex]]. We didn't quite get to finish our conversation, but I've still put together what I can from what we covered.",
    disclaimer:
      "This is an early read based on an unfinished conversation, not a hiring decision. The team at [[Persevio]] makes the final call.",
    assessment: [
      "From the part of our chat we completed, I can already see {a promising start} in how your background relates to this role.",
      "There's more I'd have liked to explore, so treat this as a partial read. Whenever you have a few minutes, we can pick up where we left off.",
    ],
    report: {
      lead: [
        "Your background, which lines up well with this role.",
        "The ownership you described before we ran out of time.",
      ],
      flag: [
        "That our conversation was cut short, so my read is preliminary.",
        "A few areas I'd still like to explore before forming a full view.",
      ],
    },
  },
} as const;

export const BEYOND_INTRO = {
  head: "This is the start of our relationship, not the finish.",
  body: "That wraps up your application for this role, but you and I are just getting going. The more we talk, the better I understand you, and the more I can do for you.",
} as const;

export const BEYOND_LEAD = {
  title: "Represent you to others",
  badge: "Your dedicated agent",
  text: "Because I know your story inside out, I can act for you when you're not in the room: answer other people's questions about your background, and even sit first-round prescreens on your behalf.",
} as const;

export const BEYOND_CAPABILITIES = [
  {
    icon: "compass" as const,
    title: "Recommend other roles",
    text: "I'll keep watch and surface other opportunities that genuinely fit who you are.",
  },
  {
    icon: "users" as const,
    title: "Connect you with people",
    text: "I can introduce you to like-minded professionals worth knowing in your field.",
  },
  {
    icon: "pencil" as const,
    title: "Boost your chances",
    text: "Sharpen your resume, prep for interviews, and walk in ready to win the offer.",
  },
] as const;

export const SPEAK = {
  title: "Just keep talking to me",
  text: "There's no finish line here. The more you share, the better I know you, and the more useful I become.",
  subs: [
    "Your career aspirations",
    "Your job search preferences",
    "Your expertise",
  ],
} as const;

export const EXIT_SURVEY_QUESTIONS = [
  {
    id: "overall",
    kind: "face" as const,
    q: "How was your overall experience with me?",
    options: ["poor", "fair", "okay", "good", "great"],
  },
  {
    id: "relevant",
    kind: "agree" as const,
    q: "Were my prescreening questions relevant to the role?",
    options: ["not_really", "somewhat", "definitely"],
  },
  {
    id: "accurate",
    kind: "agree" as const,
    q: "Did I capture your experience accurately?",
    options: ["not_really", "somewhat", "definitely"],
  },
  {
    id: "dislike",
    kind: "text" as const,
    q: "Anything you didn't like, or I could do better?",
    placeholder: "Optional. Tell me anything",
  },
] as const;

export const STEP3_ROADMAP = [
  "I have reviewed your resume and will share my honest first read on your fit immediately after you proceed to the next step",
  "We'll have a short discovery chat so I understand you beyond your resume",
  "I'll prepare and submit your application with my recommendations",
  "Message me on WhatsApp or Persevio anytime when you want an update",
] as const;

export const STEP3_CAPABILITIES = [
  {
    icon: "compass" as const,
    text: "Get to know you through a real conversation, so you're represented fairly on your full story, not judged on an incomplete picture from your resume alone",
  },
  {
    icon: "spark" as const,
    text: "Prepare your application and represent you strongly to the hiring manager",
  },
  {
    icon: "bell" as const,
    text: "Give you application updates whenever you want",
  },
  {
    icon: "calendar" as const,
    text: "Help coordinate your interview process",
  },
  {
    icon: "compass" as const,
    text: "Recommend other opportunities that match your background in the future",
  },
] as const;
