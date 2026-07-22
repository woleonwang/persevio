export const MEETING_TOKEN_SESSION_KEY = "meeting_token";

export const FIXED_COPY = {
  splashTitle: "Meet Percy",
  splashSubtitle: "Your recruiting colleague for this conversation",
  splashCta: "Tap to continue",
  greetingTitle: "Hi {name}",
  greetingBody:
    "I'm Percy — the colleague your recruiter mentioned. You can talk to me for real about this role.",
  groundRulesTitle: "A quick note before we start",
  groundRulesBody:
    "I'll make a few guesses from your public profile. Please correct me anytime. Until you ask me to put you forward, this stays between us.",
  roleOrientationTitle: "The role",
  whyInterestedTitle: "Why you might be interested",
  whySuccessfulTitle: "Why you'd succeed",
  couldntTellTitle: "What I couldn't tell",
  theAskTitle: "How close did I get?",
  theAskBody: "React to any claim, or just tell me what's on your mind.",
  zoneExploring: "Exploring · private",
  putForwardCta: "Put me forward",
  notForMeCta: "Not for me",
  notForMeMessage: "Not for me",
  briefCta: "Open brief",
  whatsappCta: "WhatsApp",
  whatsappBound: "WhatsApp connected",
  composerPlaceholder: "Write a message…",
  claimRight: "That's right",
  claimNotQuite: "Not quite",
  resumeUploadCta: "Upload resume",
  openPutForwardCta: "Put me forward",
  thinProfileNote:
    "I don't have enough of a public profile to make strong claims yet — happy to learn from you directly.",
  briefEmpty: "The full brief isn't ready yet. You can still chat with me.",
  termsLabel: "I agree to the Terms of Service and Privacy Policy",
};

export const CLAIM_HEADERS: Record<string, string> = {
  why_interested: FIXED_COPY.whyInterestedTitle,
  why_successful: FIXED_COPY.whySuccessfulTitle,
  couldnt_tell: FIXED_COPY.couldntTellTitle,
};
