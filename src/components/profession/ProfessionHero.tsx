"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import SectionTagline from "../core/SectionTagline";
import type { ProfessionLesson, ProfessionTrack } from '@/lib/professionSchool';
import DailyLessonCard from './DailyLessonCard';

type Props = {followed: Set<string>; completedIds: Set<string>; overall: number; dailyLesson:ProfessionLesson|null; dailyTrack?:ProfessionTrack; onOpenLesson:(lesson:ProfessionLesson,unlocked:boolean)=>void};
export default function ProfessionHero({followed, completedIds, overall, dailyLesson, dailyTrack, onOpenLesson}: Props) {
  return <header className="profession-hero">
    <div className="profession-hero-copy">
      <span className="profession-kicker"><AppIcon name="certificate" /> MESLEK · EMANET · İHSAN</span>
      <h1>Meslek ve Ahlak Okulu</h1>
      <p>İşini iyi yap. İyiliği işine taşı.</p>
      <p className="profession-hero-description">Mesleğine özel kısa derslerle öğren, düşün ve öğrendiğini günlük hayatında uygula.</p>
      <div className="profession-study-method" aria-label="Öğrenme adımları">
        <span><AppIcon name="book-2" /> Oku</span><span><AppIcon name="notebook" /> Düşün</span><span><AppIcon name="circle-check" /> Uygula</span>
      </div>
      <SectionTagline section="profession-school" compact />
    </div>
    <aside className="profession-hero-metrics" aria-label="Öğrenme özetin">
      <span className="profession-kicker">ÖĞRENME YOLCULUĞUN</span>
      <div className="profession-overall"><strong>%{overall}</strong><span>Genel ilerleme</span></div>
      <progress value={overall} max={100} aria-label="Genel öğrenme ilerlemesi" />
      <div className="profession-metric-pair"><article><strong>{followed.size}</strong><span>Takip edilen yol</span></article><article><strong>{completedIds.size}</strong><span>Tamamlanan ders</span></article></div>
      <p>Her ders, iş hayatına taşıyabileceğin küçük bir uygulamayla tamamlanır.</p>
    </aside>
    {dailyLesson && dailyTrack && <DailyLessonCard lesson={dailyLesson} track={dailyTrack} onOpen={()=>onOpenLesson(dailyLesson,true)}/>}
  </header>;
}
