"use client";

import { motion } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import { getAwarenessLevel } from "@/lib/awarenessLevels";

export default function AwarenessLevelBadge({ xp }: { xp: number }) {
  const { current, next, progress } = getAwarenessLevel(xp);

  return (
    <motion.div
      className="awareness-level-badge"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <span className="awareness-level-icon"><AppIcon name={current.icon} /></span>
      <div className="awareness-level-info">
        <strong>
          <small>SEVİYE {current.level}</small>
          {current.name}
        </strong>
        {next && (
          <div className="awareness-level-progress">
            <div className="awareness-level-bar">
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <small>{Math.round(progress * 100)}% → {next.name}</small>
          </div>
        )}
        {!next && <small className="awareness-level-max">Maksimum seviye</small>}
      </div>
    </motion.div>
  );
}
