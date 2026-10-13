"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import SectionTagline from "../core/SectionTagline";
import type { ProfessionLesson, ProfessionTrack } from '@/lib/professionSchool';
import DailyLessonCard from './DailyLessonCard';

type Props = {followed: Set<string>; completedIds: Set<string>; overall: number; dailyLesson:ProfessionLesson|null; dailyTrack?:ProfessionTrack; onOpenLesson:(lesson:ProfessionLesson,unlocked:boolean)=>void};
export default function ProfessionHero({followed, completedIds, overall, dailyLesson, dailyTrack, onOpenLesson}: Props) { return (<header className="profession-hero">
        <div>
          <span className="profession-kicker">
            <AppIcon name="certificate" /> MESLEK · EMANET · İHSAN
          </span>
          <h1>Meslek ve Ahlak Okulu</h1>
          <p>
            Teknik yetkinliği niyet, emanet, doğruluk ve adaletle aynı çalışma
            disiplininde buluşturan kısa öğrenme yolları.
          </p>
          <SectionTagline section="profession-school" compact />
        </div>
        <div className="profession-hero-metrics">
          <article>
            <strong>{followed.size}</strong>
            <span>Takip edilen yol</span>
          </article>
          <article>
            <strong>{completedIds.size}</strong>
            <span>Tamamlanan ders</span>
          </article>
          <article>
            <strong>%{overall}</strong>
            <span>Genel ilerleme</span>
          </article>
        </div>
        {dailyLesson && dailyTrack && <DailyLessonCard lesson={dailyLesson} track={dailyTrack} onOpen={()=>onOpenLesson(dailyLesson,true)}/>}
      </header>); }
