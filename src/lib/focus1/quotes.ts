export const FOCUS_QUOTES = [
  {
    text: "Until my ONE Thing is done — everything else is a distraction.",
    by: "Gary Keller",
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    by: "Lao Tzu",
  },
  {
    text: "Attention is the rarest and purest form of generosity.",
    by: "Simone Weil",
  },
  {
    text: "The cost of a thing is the amount of life you exchange for it.",
    by: "Henry David Thoreau",
  },
] as const;

export function quoteAt(index = 0) {
  return FOCUS_QUOTES[index % FOCUS_QUOTES.length];
}