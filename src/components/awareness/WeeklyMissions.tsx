"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { getWeeklyMissions, getCurrentWeekNumber, type WeeklyMission } from "@/lib/weeklyMissions";

export default function WeeklyMissions({ completedMissions, onComplete }: {
  completedMissions: Set<string>;
  onComplete: (missionId: string) => void;
}) {
  const weekNumber = useMemo(() => getCurrentWeekNumber(), []);
  const missions = useMemo(() => getWeeklyMissions(3), []);
  const completedCount = missions.filter((m) => completedMissions.has(m.id)).length;

  return (
    <section className="awareness-missions">
      <header className="awareness-missions-header">
        <div>
          <span><AppIcon name="target-arrow" /> BU HAFTANIN GÖREVLERİ</span>
          <small>Hafta {weekNumber % 52 + 1}</small>
        </div>
        <div className="awareness-missions-progress">
          <span style={{ width: `${(completedCount / missions.length) * 100}%` }} />
          <small>{completedCount}/{missions.length}</small>
        </div>
      </header>

      <div className="awareness-missions-list">
        {missions.map((mission, i) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            index={i}
            completed={completedMissions.has(mission.id)}
            onComplete={() => onComplete(mission.id)}
          />
        ))}
      </div>
    </section>
  );
}

function MissionCard({ mission, index, completed, onComplete }: {
  mission: WeeklyMission;
  index: number;
  completed: boolean;
  onComplete: () => void;
}) {
  const [justCompleted, setJustCompleted] = useState(false);

  const handleComplete = () => {
    if (completed) return;
    setJustCompleted(true);
    onComplete();
    setTimeout(() => setJustCompleted(false), 1500);
  };

  return (
    <motion.article
      className={`awareness-mission-card ${completed ? "is-done" : ""} ${justCompleted ? "is-celebrating" : ""}`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <span className="awareness-mission-icon"><AppIcon name={mission.icon} /></span>
      <div className="awareness-mission-body">
        <h4>{mission.title}</h4>
        <p>{mission.description}</p>
        <small><AppIcon name="sparkles" /> +{mission.xhReward} XH</small>
      </div>
      <button
        className={`awareness-mission-check ${completed ? "done" : ""}`}
        onClick={handleComplete}
        disabled={completed}
        aria-label={completed ? `${mission.title} tamamlandı` : `${mission.title} görevini tamamla`}
      >
        <AppIcon name={completed ? "circle-check-filled" : "circle-dashed"} />
      </button>
    </motion.article>
  );
}
