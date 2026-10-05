"use client";

import {
  ArrowLeft,
  BarChart3,
  Expand,
  Headphones,
  History,
  Leaf,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import AmbientSoundMixer from "./AmbientSoundMixer";
import FocusHistory from "./FocusHistory";
import FocusStats from "./FocusStats";
import FocusTimer from "./FocusTimer";
import MotivationQuote from "./MotivationQuote";
import NiyetCard from "./NiyetCard";
import SessionComplete from "./SessionComplete";
import SessionConfig from "./SessionConfig";
import styles from "../focus.module.css";

type SidePanel = "settings" | "stats" | "history";

export default function FocusExperience() {
  const mode = useFocusStore((state) => state.mode);
  const isRunning = useFocusStore((state) => state.isRunning);
  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const resetTimer = useFocusStore((state) => state.resetTimer);
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const pendingCompletedSession = useFocusStore((state) => state.pendingCompletedSession);
  const [showNiyet, setShowNiyet] = useState(!currentNiyet);
  const [soundOpen, setSoundOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState<SidePanel>("stats");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (isRunning) pauseTimer();
        else if (!currentNiyet) setShowNiyet(true);
        else useFocusStore.getState().startTimer();
      }
      if (event.key.toLowerCase() === "r") resetTimer();
      if (event.key.toLowerCase() === "s") setSoundOpen((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentNiyet, isRunning, pauseTimer, resetTimer]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen support is optional.
    }
  };

  return (
    <main className={`${styles.focusPage} ${styles[`${mode}Page`]}`}>
      <div className={styles.geometricBackdrop} aria-hidden />
      <header className={styles.topbar}>
        <Link href="/" className={styles.backLink} aria-label="SAH World ana sayfasına dön"><ArrowLeft aria-hidden /><span>Geri</span></Link>
        <div className={styles.focusBrand}><span><Leaf aria-hidden /></span><div><strong>Odaklanma</strong><small>SAH WORLD · DERİN ÇALIŞMA ALANI</small></div></div>
        <nav className={styles.topActions} aria-label="Odak ekranı araçları">
          <button className={sidePanel === "stats" ? styles.topActionActive : ""} onClick={() => setSidePanel("stats")} aria-label="İstatistikleri göster"><BarChart3 aria-hidden /><span>İstatistik</span></button>
          <button className={sidePanel === "history" ? styles.topActionActive : ""} onClick={() => setSidePanel("history")} aria-label="Geçmişi göster"><History aria-hidden /><span>Geçmiş</span></button>
          <button className={sidePanel === "settings" ? styles.topActionActive : ""} onClick={() => setSidePanel("settings")} aria-label="Oturum ayarlarını göster"><Settings aria-hidden /><span>Ayarlar</span></button>
          <button onClick={() => void toggleFullscreen()} aria-label="Tam ekranı aç veya kapat"><Expand aria-hidden /></button>
        </nav>
      </header>

      <div className={styles.focusLayout}>
        <section className={styles.mainColumn}>
          <FocusTimer onNeedNiyet={() => setShowNiyet(true)} />
          <AmbientSoundMixer open={soundOpen} onToggle={() => setSoundOpen((value) => !value)} />
          <MotivationQuote seed={pendingCompletedSession?.id.length ?? 0} />
        </section>
        <aside className={styles.sideColumn} aria-label="Odaklanma ayrıntıları">
          <div className={styles.mobilePanelTabs}>
            <button className={sidePanel === "stats" ? styles.mobileTabActive : ""} onClick={() => setSidePanel("stats")}><BarChart3 aria-hidden /> İstatistik</button>
            <button className={sidePanel === "history" ? styles.mobileTabActive : ""} onClick={() => setSidePanel("history")}><History aria-hidden /> Geçmiş</button>
            <button className={sidePanel === "settings" ? styles.mobileTabActive : ""} onClick={() => setSidePanel("settings")}><Settings aria-hidden /> Ayar</button>
          </div>
          {sidePanel === "settings" && <SessionConfig />}
          {sidePanel === "stats" && <FocusStats />}
          {sidePanel === "history" && <FocusHistory />}
        </aside>
      </div>

      <div className={styles.shortcutHint}><Headphones aria-hidden /><span><kbd>Space</kbd> başlat/durdur · <kbd>R</kbd> sıfırla · <kbd>S</kbd> sesler</span></div>
      {showNiyet && !isRunning && !pendingCompletedSession && <NiyetCard onClose={() => setShowNiyet(false)} />}
      <SessionComplete key={pendingCompletedSession?.id ?? "no-completion"} />
    </main>
  );
}
