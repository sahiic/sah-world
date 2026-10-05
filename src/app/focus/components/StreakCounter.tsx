"use client";

import { Flame } from "lucide-react";
import { useFocusStats } from "@/hooks/useFocusStats";
import styles from "../focus.module.css";

export default function StreakCounter() {
  const { currentStreak, longestStreak } = useFocusStats();
  return (
    <div className={styles.streakCard}>
      <span><Flame aria-hidden /></span>
      <div><small>İstikrarlı seri</small><strong>{currentStreak} gün</strong><p>Rekorun {longestStreak} gün</p></div>
    </div>
  );
}

