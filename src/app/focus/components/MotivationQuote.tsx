"use client";

import { Quote } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import quotes from "@/data/quotes.json";
import type { FocusQuote } from "@/types/focus";
import styles from "../focus.module.css";

const pageQuoteSeed = Math.floor(Math.random() * quotes.length);
const subscribe = () => () => undefined;

export default function MotivationQuote({ seed = 0 }: { seed?: number }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const resolvedSeed = seed || (isClient ? pageQuoteSeed : 0);
  const quote = useMemo(
    () => (quotes as FocusQuote[])[Math.abs(resolvedSeed) % quotes.length],
    [resolvedSeed],
  );
  return (
    <blockquote className={styles.quoteCard}>
      <Quote aria-hidden />
      <div><p>“{quote.text}”</p><footer><span>{quote.type}</span>— {quote.source}</footer></div>
    </blockquote>
  );
}
