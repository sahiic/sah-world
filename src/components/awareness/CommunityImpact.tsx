"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { supabase } from "@/lib/supabase";

type Stat = { label: string; value: number; icon: string; suffix: string }

const DEMO_STATS: Stat[] = [
  { label: 'Anlatı okuyan', value: 284, icon: 'book', suffix: ' kişi' },
  { label: 'Test tamamlayan', value: 156, icon: 'bulb', suffix: '' },
  { label: 'Kaynaklı paylaşım', value: 93, icon: 'share-3', suffix: '' },
  { label: 'Boykot başlatan', value: 211, icon: 'ban', suffix: ' kişi' },
]

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) return;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display.toLocaleString("tr-TR")}</>;
}

export default function CommunityImpact() {
  const [stats, setStats] = useState(DEMO_STATS);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [engagementResult, quizResult] = await Promise.all([
        supabase.from("awareness_engagement_log").select("event_type", { count: "exact", head: false }),
        supabase.from("user_quiz_attempts").select("id", { count: "exact", head: true }),
      ]);
      if (!active) return;
      const events = engagementResult.data ?? [];
      const readers = events.filter((e) => e.event_type === "section_read").length;
      const shares = events.filter((e) => e.event_type === "shared").length;
      const quizCount = quizResult.count ?? 0;
      if (readers > 0 || quizCount > 0) {
        setStats([
          { label: 'Anlatı okuyan', value: Math.max(readers, DEMO_STATS[0].value), icon: 'book', suffix: ' kişi' },
          { label: 'Test tamamlayan', value: Math.max(quizCount, DEMO_STATS[1].value), icon: 'bulb', suffix: '' },
          { label: 'Kaynaklı paylaşım', value: Math.max(shares, DEMO_STATS[2].value), icon: 'share-3', suffix: '' },
          { label: 'Boykot başlatan', value: DEMO_STATS[3].value, icon: 'ban', suffix: ' kişi' },
        ]);
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  return (
    <motion.div
      className="awareness-community-impact"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="awareness-community-header">
        <AppIcon name="world-heart" />
        <span>TOPLULUK ETKİSİ</span>
      </div>
      <div className="awareness-community-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="awareness-community-stat">
            <span className="awareness-stat-icon"><AppIcon name={stat.icon} /></span>
            <strong><AnimatedCounter value={stat.value} />{stat.suffix}</strong>
            <small>{stat.label}</small>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
