"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { AppIcon } from "@/components/ui/AppIcon";

const MESSAGES = [
  { text: "Bir nefes al. Öğrenmek cesaret ister.", icon: "heart" },
  { text: "Bilgi taşımak eylemdir. Hazır olduğunda devam et.", icon: "shield-check" },
  { text: "Hatırla: her öğrendiğin bilgi, bir nefes daha güçlü kılar.", icon: "leaf" },
];

export default function CompassionReset({ onContinue }: { onContinue: () => void }) {
  const [breathing, setBreathing] = useState(false);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const message = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  useEffect(() => {
    if (!breathing) return;
    let timer: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase("in");
      timer = setTimeout(() => {
        setPhase("hold");
        timer = setTimeout(() => {
          setPhase("out");
          timer = setTimeout(cycle, 4000);
        }, 4000);
      }, 4000);
    };
    cycle();
    return () => clearTimeout(timer);
  }, [breathing]);

  const phaseLabel = phase === "in" ? "Nefes al..." : phase === "hold" ? "Tut..." : "Nefes ver...";

  return (
    <motion.div
      className="awareness-compassion-reset"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="awareness-compassion-inner">
        <span className="awareness-compassion-icon"><AppIcon name={message.icon} /></span>
        <h3>{message.text}</h3>
        <p>Ağır bir bölümü okudun. Bir an dur ve kendine zaman tanı.</p>

        <AnimatePresence>
          {breathing && (
            <motion.div
              className="awareness-breath-circle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="awareness-breath-ring"
                animate={{
                  scale: phase === "in" ? 1.4 : phase === "hold" ? 1.4 : 1,
                }}
                transition={{ duration: 4, ease: "easeInOut" }}
              />
              <span>{phaseLabel}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="awareness-compassion-actions">
          {!breathing && (
            <button className="awareness-compassion-breath" onClick={() => setBreathing(true)}>
              <AppIcon name="wind" /> Nefes egzersizi (60 sn)
            </button>
          )}
          <button className="awareness-compassion-continue" onClick={onContinue}>
            Hazırım, devam et <AppIcon name="arrow-right" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
