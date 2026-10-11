"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { QuranLevel } from "@/types/database";

import { LEVELS } from "./companionShared";
interface LevelOnboardingProps {
  onSelect: (level: QuranLevel) => void;
}

export default function LevelOnboarding({ onSelect }: LevelOnboardingProps) {
  return (
    <section className="quran-level-onboarding">
      <header>
        <span className="eyebrow">SANA UYGUN YOLCULUK</span>
        <h2>Kur’an okuma seviyeni değerlendir</h2>
        <p>
          Bu seçim yalnızca sana uygun hoca ve akran desteğini göstermek
          içindir; bir üstünlük ölçüsü değildir.
        </p>
      </header>
      <div>
        {LEVELS.map((item) => (
          <button key={item.value} onClick={() => onSelect(item.value)}>
            <AppIcon name={item.icon} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
            <AppIcon name="arrow-right" />
          </button>
        ))}
      </div>
    </section>
  );
}
