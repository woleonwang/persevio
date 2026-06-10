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
    summary:
      "Your background lines up closely with what the hiring manager is looking for. With relevant experience and a steady record in your field, I think you have a {strong chance} of landing an interview for this role.",
    strengths: [
      "Your seniority maps directly to the level this role expects.",
      "You've worked in the vertical this team is built around.",
      "Your recent results put you comfortably above the benchmark for this level.",
    ],
    discuss: [
      "I'd like to confirm your experience at the senior level this desk spends most of its time on.",
      "I'd like to hear how you've opened new accounts from scratch, since this role carries a business-development target.",
    ],
    bridge:
      "Let's have a short chat so I can verify a couple of details and put your strongest possible application in front of the hiring manager.",
  },
  middle: {
    read: "Worth exploring",
    summary:
      "I can see relevant experience in your background. There's {genuine potential} here, and a short conversation will help me fill a few gaps before I can form a complete picture of your fit.",
    strengths: [
      "Your client-facing work gives you the instincts this role relies on.",
      "You've consistently carried and met targets in a numbers-driven seat.",
      "Your industry exposure means you already speak the language of the candidates you'd be recruiting.",
    ],
    discuss: [
      "I'd like to understand whether you've sourced or hired in any of your past roles.",
      "Let's talk through how your current responsibilities map to sourcing, screening, and closing.",
      "I'd like to hear how independently you've managed client relationships.",
    ],
    bridge:
      "A conversation is the best way for me to understand experience your resume doesn't capture. Let's talk so I can build the most accurate picture of your fit.",
  },
  weak: {
    read: null,
    summary:
      "I've reviewed your background and I want to be upfront with you: I see {some real gaps} between your experience and what this role needs. That said, resumes rarely tell the whole story, so I'd like to talk before I form my final view.",
    strengths: [
      "Your industry background gives you useful context for the kinds of roles and candidates this desk works with.",
      "Your coordination and stakeholder work shows you can manage a lot of moving parts.",
    ],
    discuss: [
      "I'd like to understand any exposure you've had to core responsibilities for this role, even if it wasn't your main focus.",
      "Let's discuss whether you've held client-facing or revenue-linked goals before.",
      "I'd like to hear about times you've owned an outcome end to end.",
    ],
    bridge:
      "There may be experience you have that isn't on your resume. Let's talk so I can represent you as accurately as possible.",
  },
} as const;

export const WRAP_CONTENT = {
  strong: {
    thanks:
      "Thank you. That was a genuinely good conversation. I know these chats take real time and thought, and yours gave me exactly what I needed to make your strongest case to the hiring team.",
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
      "Thank you for taking the time. That was a helpful conversation, and it gave me a clearer picture than your resume alone could.",
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
      "Thank you for the conversation, and for being open with me. That kind of honesty makes my job easier and your application stronger.",
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
      "Thanks for getting started with me. We didn't quite get to finish our conversation, but I've still put together what I can from what we covered.",
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

export const BEYOND_CAPABILITIES = [
  {
    title: "Recommend other roles",
    text: "I'll keep watch and surface other opportunities that genuinely fit who you are.",
  },
  {
    title: "Connect you with people",
    text: "I can introduce you to like-minded professionals worth knowing in your field.",
  },
  {
    title: "Boost your chances",
    text: "Sharpen your resume, prep for interviews, and walk in ready to win the offer.",
  },
] as const;

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
