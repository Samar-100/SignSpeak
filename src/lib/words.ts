/**
 * Dataset glosses are lowercase and sometimes run words together
 * ("frenchfries", "callonphone"). This maps them to readable text and to a
 * reference page where the sign can be watched.
 */
const DISPLAY: Record<string, string> = {
  frenchfries: "french fries",
  callonphone: "call on phone",
  glasswindow: "glass window",
  hesheit: "he / she / it",
  minemy: "mine / my",
  haveto: "have to",
  icecream: "ice cream",
  thankyou: "thank you",
  TV: "TV",
};

/** Slug used by signasl.org where it differs from the plain gloss. */
const SLUG: Record<string, string> = {
  frenchfries: "french-fries",
  callonphone: "call",
  glasswindow: "window",
  hesheit: "he",
  minemy: "my",
  haveto: "have-to",
  icecream: "ice-cream",
  thankyou: "thank-you",
  TV: "tv",
};

export function pretty(label: string): string {
  return DISPLAY[label] ?? label;
}

/** A page with video clips of the sign, for learning and testing. */
export function referenceUrl(label: string): string {
  return `https://www.signasl.org/sign/${SLUG[label] ?? label.toLowerCase()}`;
}
