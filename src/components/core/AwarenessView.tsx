"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { useAuthStore } from "@/store/useAuthStore";
import { useJourneyStore } from "@/store/useJourneyStore";
import { supabase } from "@/lib/supabase";
import { recordXpEvent } from "@/lib/xp";
import {
  AWARENESS_CONTENT_FALLBACK,
  AWARENESS_OPENINGS,
  AWARENESS_QUIZ_FALLBACK,
  AWARENESS_SHARE_COPY,
  GEOGRAPHY_META,
  HUMANITARIAN_ORGANIZATIONS,
  quizReward,
  type AwarenessContent,
  type AwarenessQuizQuestion,
  type Geography,
  type QuizOption,
} from "@/lib/awareness";
import CommunityImpact from "@/components/awareness/CommunityImpact";
import WeeklyMissions from "@/components/awareness/WeeklyMissions";
import BoycottGuide from "@/components/awareness/BoycottGuide";
import AwarenessTimeline from "@/components/awareness/AwarenessTimeline";
import PrayerWall from "@/components/awareness/PrayerWall";
import WitnessWall from "@/components/awareness/WitnessWall";
import ThirtyDayJourney from "@/components/awareness/ThirtyDayJourney";
import CompassionReset from "@/components/awareness/CompassionReset";

type Panel = "story" | "actions" | "quiz";
type EngagementType = "section_read" | "action_opened" | "quiz_completed" | "narrative_completed" | "shared";
const READ_REWARD = 15;
const SHARE_REWARD = 5;

const isApprovedSource = (url: string | null | undefined) => Boolean(url && (
  url.startsWith("https://www.dijitalhafiza.com/") ||
  url.startsWith("https://doguturkistan.dijitalhafiza.com/") ||
  url.startsWith("https://www.trthaber.com/") ||
  url.startsWith("https://boykotdedektifi.com/")
));

const shareSlug = (geography: Geography) => geography === "filistin" ? "filistin" : "dogu-turkistan";

export default function AwarenessView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const user = useAuthStore((state) => state.session?.access_token === "mock-token" ? null : state.session?.user ?? null);
  const addXP = useJourneyStore((state) => state.addXP);
  const xp = useJourneyStore((state) => state.xp);
  const [geography, setGeography] = useState<Geography>("filistin");
  const [panel, setPanel] = useState<Panel>("story");
  const [content, setContent] = useState(AWARENESS_CONTENT_FALLBACK);
  const [questions, setQuestions] = useState(AWARENESS_QUIZ_FALLBACK);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<Geography>>(new Set());
  const [eventKeys, setEventKeys] = useState<Set<string>>(new Set());
  const [userBoycotts, setUserBoycotts] = useState<Set<string>>(new Set());
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set());
  const [journeyDays, setJourneyDays] = useState<Set<number>>(new Set());
  const [showCompassion, setShowCompassion] = useState(false);
  const awardedKeys = useRef(new Set<string>());

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      const [contentResult, questionResult, attemptResult, engagementResult] = await Promise.all([
        supabase.from("regional_awareness_content").select("*").eq("is_published", true).order("order_index"),
        supabase.from("awareness_quiz_questions").select("*").order("order_index"),
        supabase.from("user_quiz_attempts").select("geography"),
        supabase.from("awareness_engagement_log").select("geography, content_id, event_type"),
      ]);
      if (!active) return;

      // A stale or partially migrated table cannot silently reintroduce an
      // unreviewed source. Only the complete locally audited chain may replace it.
      const reviewedUrls = new Set(AWARENESS_CONTENT_FALLBACK.map((item) => item.sourceUrl));
      const reviewedContent = (contentResult.data ?? []).filter((item) =>
        Boolean(item.section_title && item.content_body && item.source_name) &&
        Number.isFinite(item.display_order) &&
        isApprovedSource(item.source_url) &&
        reviewedUrls.has(item.source_url),
      );
      const hasCompleteJourney = reviewedContent.length === AWARENESS_CONTENT_FALLBACK.length &&
        (["filistin", "dogu_turkistan"] as Geography[]).every((key) =>
          reviewedContent.filter((item) => item.geography === key).length === 6,
        );
      if (hasCompleteJourney) {
        setContent(reviewedContent.map((item) => ({
          id: item.id,
          geography: item.geography,
          section: item.section,
          sectionTitle: item.section_title,
          contentBody: item.content_body,
          sourceName: item.source_name,
          sourceUrl: item.source_url,
          displayOrder: item.display_order,
          actionCue: item.action_cue,
        })));
      }

      const reviewedQuestionUrls = new Set(AWARENESS_QUIZ_FALLBACK.map((item) => item.sourceUrl));
      const reviewedQuestions = (questionResult.data ?? []).filter((item) =>
        isApprovedSource(item.source_url) && reviewedQuestionUrls.has(item.source_url),
      );
      if (reviewedQuestions.length === AWARENESS_QUIZ_FALLBACK.length) {
        setQuestions(reviewedQuestions.map((item) => ({
          id: item.id,
          geography: item.geography,
          questionText: item.question_text,
          options: { A: item.option_a, B: item.option_b, C: item.option_c, D: item.option_d },
          correctOption: item.correct_option,
          explanationText: item.explanation_text,
          orderIndex: item.order_index,
          sourceUrl: item.source_url,
        })));
      }
      setCompletedQuizzes(new Set((attemptResult.data ?? []).map((item) => item.geography)));
      setEventKeys(new Set((engagementResult.data ?? []).map((item) =>
        `${item.event_type}:${item.geography}:${item.content_id}`,
      )));
    };
    void load();
    return () => { active = false; };
  }, [user]);

  const logEngagement = useCallback(async (
    eventType: EngagementType,
    targetGeography: Geography,
    contentId: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const key = `${eventType}:${targetGeography}:${contentId}`;
    const isNew = !eventKeys.has(key) && !awardedKeys.current.has(key);
    if (!isNew) return false;
    awardedKeys.current.add(key);
    setEventKeys((current) => new Set(current).add(key));
    if (user) {
      const { error } = await supabase.from("awareness_engagement_log").upsert({
        user_id: user.id,
        geography: targetGeography,
        content_id: contentId,
        event_type: eventType,
        metadata,
      }, { onConflict: "user_id,geography,content_id,event_type" });
      if (error) console.warn("Farkındalık etkileşimi kaydedilemedi:", error.message);
    }
    return isNew;
  }, [eventKeys, user]);

  const awardOnce = useCallback(async (
    eventType: "narrative_completed" | "shared",
    targetGeography: Geography,
    amount: number,
    label: string,
    metadata: Record<string, string | number | boolean> = {},
  ) => {
    const contentId = `${eventType}:${targetGeography}`;
    const isNew = await logEngagement(eventType, targetGeography, contentId, metadata);
    if (!isNew) return;
    addXP(amount);
    await recordXpEvent({
      sourceType: eventType === "shared" ? "awareness_share" : "awareness_read",
      sourceId: contentId,
      label,
      amount,
    });
  }, [addXP, logEngagement]);

  const geographyItems = useMemo(() => content
    .filter((item) => item.geography === geography)
    .sort((a, b) => a.displayOrder - b.displayOrder), [content, geography]);
  const readCount = geographyItems.filter((item) =>
    eventKeys.has(`section_read:${geography}:${item.id}`),
  ).length;

  useEffect(() => {
    if (geographyItems.length && readCount === geographyItems.length) {
      const timer = window.setTimeout(() => {
        void awardOnce("narrative_completed", geography, READ_REWARD,
          `${GEOGRAPHY_META[geography].name} anlatısı tamamlandı`,
          { sections: geographyItems.length });
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [awardOnce, geography, geographyItems.length, readCount]);

  const toggleBoycott = useCallback((itemId: string) => {
    setUserBoycotts((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      try { localStorage.setItem("sah:boycotts", JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const completeMission = useCallback((missionId: string) => {
    if (completedMissions.has(missionId) || awardedKeys.current.has(`mission:${missionId}`)) return;
    awardedKeys.current.add(`mission:${missionId}`);
    setCompletedMissions((prev) => {
      const next = new Set(prev).add(missionId);
      try { localStorage.setItem("sah:missions", JSON.stringify([...next])); } catch {}
      return next;
    });
    addXP(10);
    void recordXpEvent({ sourceType: "awareness_mission", sourceId: missionId, label: "Haftalık görev tamamlandı", amount: 10 });
  }, [addXP, completedMissions]);

  const completeJourneyDay = useCallback((day: number, xpAmount: number) => {
    if (journeyDays.has(day) || awardedKeys.current.has(`journey:${day}`)) return;
    awardedKeys.current.add(`journey:${day}`);
    setJourneyDays((prev) => {
      const next = new Set(prev).add(day);
      try { localStorage.setItem("sah:journey-days", JSON.stringify([...next])); } catch {}
      return next;
    });
    addXP(xpAmount);
    void recordXpEvent({ sourceType: "awareness_journey", sourceId: `day-${day}`, label: `30 günlük yolculuk: Gün ${day}`, amount: xpAmount });
  }, [addXP, journeyDays]);

  useEffect(() => {
    // Hydrate browser-only preferences after mount; preserve all existing keys.
    const frame = requestAnimationFrame(() => {
      const read = (key: string): unknown[] => {
        try { const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
      };
      setUserBoycotts(new Set(read("sah:boycotts").filter((v): v is string => typeof v === "string")));
      setCompletedMissions(new Set(read("sah:missions").filter((v): v is string => typeof v === "string")));
      setJourneyDays(new Set(read("sah:journey-days").filter((v): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 30)));
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const changeGeography = (next: Geography) => {
    setGeography(next);
    setPanel("story");
    window.setTimeout(() => document.getElementById("awareness-opening")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" }), 20);
  };
  const openPrayer = () => {
    sessionStorage.setItem("sah:mescidim:tab", "dua");
    sessionStorage.setItem("sah:mescidim:occasion", "Sıkıntı");
    onNavigate("mescidim");
  };

  const meta = GEOGRAPHY_META[geography];
  const reducedMotion = useReducedMotion();
  const tabs = [{ id: "story", label: "Öğren", icon: "book" }, { id: "actions", label: "Harekete Geç", icon: "heart-handshake" }, { id: "quiz", label: "Bilgi Testi", icon: "bulb" }] as const;
  return (
    <div className={`awareness-experience awareness-editorial awareness-${geography}`} style={{ "--awareness-accent": meta.accent } as React.CSSProperties}>
      <header className="awareness-editorial-header">
        <div><span className="awareness-kicker">HAFIZA · HAKİKAT · SORUMLULUK</span><h1>Mazlum Coğrafyalar</h1></div>
        <div className="awareness-editorial-tools">
          <label><span className="sr-only">Coğrafya seçimi</span><select value={geography} onChange={(event) => changeGeography(event.target.value as Geography)}>{(Object.keys(GEOGRAPHY_META) as Geography[]).map((key) => <option key={key} value={key}>{GEOGRAPHY_META[key].name}</option>)}</select></label>
          <span className="awareness-xh" aria-label={`Toplam ${xp} XH`}><AppIcon name="sparkles" /> {xp.toLocaleString("tr-TR")} XH</span>
        </div>
      </header>
      <nav className="awareness-editorial-tabs" role="tablist" aria-label="İçerik görünümü">
        {tabs.map((tab, index) => <button key={tab.id} id={`awareness-tab-${tab.id}`} role="tab" aria-selected={panel === tab.id} aria-controls="awareness-panel" tabIndex={panel === tab.id ? 0 : -1} onClick={() => setPanel(tab.id)}
          onKeyDown={(event) => { const offset = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0; const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length; if (!offset && event.key !== "Home" && event.key !== "End") return; event.preventDefault(); setPanel(tabs[next].id); document.getElementById(`awareness-tab-${tabs[next].id}`)?.focus(); }}>
          <AppIcon name={tab.icon} />{tab.label}
        </button>)}
      </nav>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={panel} id="awareness-panel" role="tabpanel" aria-labelledby={`awareness-tab-${panel}`} tabIndex={0} initial={{ opacity: 0, y: reducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.15 }}>
          {panel === "story" && <>
            <ScrollyNarrative key={geography} geography={geography} items={geographyItems} eventKeys={eventKeys}
              onRead={(item) => void logEngagement("section_read", geography, item.id, { source_url: item.sourceUrl })}
              onResolve={() => setShowCompassion(true)} />
            <details className="awareness-disclosure"><summary>Tarih çizelgesi <span>Olayları bağlamında incele</span></summary><AwarenessTimeline key={geography} geography={geography} /></details>
            <details className="awareness-disclosure"><summary>İnsan hikâyeleri <span>Kaynaklı özetler ve tanıklıklar</span></summary><WitnessWall geography={geography} /></details>
            <details className="awareness-disclosure"><summary>Dua defteri <span>Kendine bir dua notu bırak</span></summary><PrayerWall geography={geography} /></details>
          </>}
          {panel === "actions" && <div className="awareness-action-stack">
            <BoycottGuide userBoycotts={userBoycotts} onToggleBoycott={toggleBoycott} />
            <details className="awareness-disclosure"><summary>Haftalık küçük adımlar <span>{completedMissions.size} görev tamamlandı</span></summary><WeeklyMissions completedMissions={completedMissions} onComplete={completeMission} /></details>
            <details className="awareness-disclosure"><summary>30 günlük yolculuk <span>{journeyDays.size}/30 gün</span></summary><ThirtyDayJourney completedDays={journeyDays} onComplete={completeJourneyDay} /></details>
            <details className="awareness-disclosure"><summary>Paylaş, öğren ve destek ol <span>Sana uygun bir yol seç</span></summary><ActionPanel geography={geography} onQuiz={() => setPanel("quiz")} onPrayer={openPrayer}
              onAction={(href) => void logEngagement("action_opened", geography, href, { target_url: href })}
              onShared={(channel) => void awardOnce("shared", geography, SHARE_REWARD, `${meta.name} kaynaklı farkındalık paylaşımı`, { channel })} /></details>
          </div>}
          {panel === "quiz" && <Quiz key={geography} geography={geography}
            questions={questions.filter((item) => item.geography === geography).sort((a, b) => a.orderIndex - b.orderIndex)}
            rewarded={completedQuizzes.has(geography)}
            onRewarded={() => setCompletedQuizzes((items) => new Set(items).add(geography))}
            onCompleted={(score) => void logEngagement("quiz_completed", geography, `quiz:${geography}`, { score })} />}
        </motion.div>
      </AnimatePresence>
      <CommunityImpact readCount={readCount} totalCount={geographyItems.length} quizCount={completedQuizzes.size} shareCount={[...eventKeys].filter((key) => key.startsWith("shared:")).length} boycottCount={userBoycotts.size} />

      {showCompassion && <CompassionReset onContinue={() => { setShowCompassion(false); setPanel("actions"); }} />}

      <footer className="awareness-integrity-note"><AppIcon name="shield-check" /><div><strong>Kaynak zinciri görünür.</strong><p>Her olgusal cümlenin kaynağı aynı ekranda yer alır. Tanık ve kurum açıklamaları sahibine atfedilir; grafik görüntü kullanılmaz.</p></div></footer>
    </div>
  );
}

function ScrollyNarrative({ geography, items, eventKeys, onRead, onResolve }: {
  geography: Geography; items: AwarenessContent[]; eventKeys: Set<string>;
  onRead: (item: AwarenessContent) => void; onResolve: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const opening = AWARENESS_OPENINGS[geography];
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;
    let disposed = false;
    let revert: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (disposed) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        root.querySelectorAll(".awareness-story-copy").forEach(copy => {
          gsap.fromTo(copy, { y: 12 }, { y: 0, ease: "none", scrollTrigger: { trigger: copy, start: "top 95%", end: "top 65%", scrub: 0.5 } });
        });
      }, root);
      revert = () => context.revert();
    });
    return () => { disposed = true; revert?.(); };
  }, [geography, reducedMotion]);
  return <div className="awareness-story" ref={rootRef}>
    <section id="awareness-opening" className="awareness-opening">
      <div className="awareness-opening-copy"><span>{GEOGRAPHY_META[geography].name.toLocaleUpperCase("tr-TR")} · 6 KISA BÖLÜM</span><h2>{opening.statement}</h2><a href={opening.sourceUrl} target="_blank" rel="noopener noreferrer">{opening.sourceName} ↗</a></div>
      <button className="awareness-scroll-cue" onClick={() => document.getElementById(`awareness-story-${items[0]?.id}`)?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" })}>Okumaya başla <AppIcon name="arrow-down" /></button>
    </section>
    <div className="awareness-story-grid"><div className="awareness-story-panels">
      {items.map((item, index) => {
        const read = eventKeys.has(`section_read:${geography}:${item.id}`);
        return <article id={`awareness-story-${item.id}`} key={item.id} className="awareness-story-panel">
          <div className="awareness-story-copy">
            <header><span>{String(index + 1).padStart(2, "0")}</span><small>{GEOGRAPHY_META[geography].name}</small></header>
            <h2>{item.sectionTitle}</h2><p>{item.contentBody}</p>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer"><span>KAYNAK</span><strong>{item.sourceName}</strong><AppIcon name="external-link" /></a>
            <blockquote>{item.actionCue}</blockquote>
            <button className="ghost-button" disabled={read} onClick={() => onRead(item)}><AppIcon name={read ? "check" : "bookmark"} />{read ? "Okundu" : "Okudum"}</button>
          </div>
        </article>;
      })}
      <section className="awareness-resolution-bridge"><h2>Bilgiden küçük bir adıma.</h2><p>Sana uygun, barışçıl bir dayanışma yolu seç.</p><button className="primary-button" onClick={onResolve}>Harekete geç <AppIcon name="arrow-right" /></button></section>
    </div></div>
  </div>;
}

function ActionPanel({ geography, onQuiz, onPrayer, onAction, onShared }: {
  geography: Geography;
  onQuiz: () => void;
  onPrayer: () => void;
  onAction: (href: string) => void;
  onShared: (channel: string) => void;
}) {
  const [notice, setNotice] = useState("");
  const meta = GEOGRAPHY_META[geography];
  const shareCopy = AWARENESS_SHARE_COPY[geography];
  const share = async (channel: "whatsapp" | "x" | "native" | "copy") => {
    const url = `${window.location.origin}/farkindalik/${shareSlug(geography)}`;
    const text = `${shareCopy.text}\n\nKaynak: ${shareCopy.sourceUrl}`;
    try {
      if (channel === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
      else if (channel === "x") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCopy.text)}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
      else if (channel === "native" && navigator.share) await navigator.share({ title: shareCopy.title, text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); setNotice("Kaynaklı paylaşım metni ve bağlantı kopyalandı."); }
      onShared(channel);
    } catch { setNotice("Paylaşım iptal edildi; hiçbir veri gönderilmedi."); }
  };

  return <section className="awareness-actions-v2">
    <header><span>NE YAPABİLİRİZ?</span><h2>Duyguyu, güvenilir ve somut bir adıma dönüştür.</h2><p>Her yol birbirinden bağımsızdır. Sana uygun olan tek bir adımı seçmen yeterli.</p></header>
    <div className="awareness-action-grid-v2">
      <article><span><AppIcon name="bulb" /></span><small>01 · ÖĞREN VE ÖĞRET</small><h3>Bilgiyi doğru yaymanın ilk adımı</h3><p>Kaynaklara dayanan 10 soruluk kısa testle kavramları ve tarihleri pekiştir.</p><button onClick={onQuiz}>Bilgi testini aç <AppIcon name="arrow-right" /></button></article>
      <article><span><AppIcon name="heart-handshake" /></span><small>02 · GÜVENİLİR DESTEĞİ SEÇ</small><h3>Resmî yardım kanallarını incele</h3><p>Bağış yapmadan önce kampanya kapsamını, güncelliğini ve ödeme alan adını kendin kontrol et.</p><div className="awareness-orgs">{HUMANITARIAN_ORGANIZATIONS.map((org) => <a key={org.href} href={org.href} target="_blank" rel="noopener noreferrer" onClick={() => onAction(org.href)}><strong>{org.name}</strong><small>{org.note}</small><AppIcon name="external-link" /></a>)}</div></article>
      <article><span><AppIcon name="building-mosque" /></span><small>03 · DUA ET</small><h3>Zulüm ve sıkıntı karşısında dur</h3><p>Mescidim’deki kaynaklı dua kütüphanesini doğrudan “Sıkıntı” seçimiyle aç.</p><button onClick={onPrayer}>Dua kütüphanesine geç <AppIcon name="arrow-right" /></button></article>
      <article className="awareness-share-card"><span><AppIcon name="share-3" /></span><small>04 · ÇEVRENE DUYUR</small><h3>Kaynağı görünür tutarak paylaş</h3><div className="awareness-share-preview"><i>{meta.name.toLocaleUpperCase("tr-TR")}</i><strong>{shareCopy.title}</strong><p>{shareCopy.text}</p><small>SAH WORLD · KAYNAKLI FARKINDALIK</small></div><div className="awareness-share-buttons"><button onClick={() => void share("whatsapp")}><AppIcon name="brand-whatsapp" /> WhatsApp</button><button onClick={() => void share("x")}><AppIcon name="brand-x" /> X</button><button onClick={() => void share("native")}><AppIcon name="brand-instagram" /> Instagram / Paylaş</button><button onClick={() => void share("copy")}><AppIcon name="copy" /> Metni kopyala</button></div>{notice && <p className="awareness-share-notice">{notice}</p>}</article>
    </div>
    <p className="awareness-reward-note"><AppIcon name="sparkles" /> Tam anlatı için {READ_REWARD} XH, ilk kaynaklı paylaşım için {SHARE_REWARD} XH. Ödül yalnızca ilk tamamlamada verilir.</p>
  </section>;
}

function Quiz({ geography, questions, rewarded, onRewarded, onCompleted }: {
  geography: Geography;
  questions: AwarenessQuizQuestion[];
  rewarded: boolean;
  onRewarded: () => void;
  onCompleted: (score: number) => void;
}) {
  const addXP = useJourneyStore((state) => state.addXP);
  const user = useAuthStore((state) => state.session?.access_token === "mock-token" ? null : state.session?.user ?? null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<QuizOption | null>(null);
  const [done, setDone] = useState(false);
  const [notice, setNotice] = useState("");
  const [wasRewarded, setWasRewarded] = useState(rewarded);
  const [awardedThisRun, setAwardedThisRun] = useState(false);
  const question = questions[index];
  const meta = GEOGRAPHY_META[geography];
  const reward = quizReward(score);
  const options = useMemo(() => ["A", "B", "C", "D"] as QuizOption[], []);

  if (!question) return <div className="empty-state"><i><AppIcon name="cloud-off" /></i><strong>Sorular kaynak onayını bekliyor</strong><p>Doğrulanmamış soru göstermek yerine test geçici olarak kapalı tutuluyor.</p></div>;
  const answer = (option: QuizOption) => { if (selected) return; setSelected(option); if (option === question.correctOption) setScore((value) => value + 1); };
  const next = async () => {
    if (index < questions.length - 1) { setIndex((value) => value + 1); setSelected(null); return; }
    const finalScore = score;
    setDone(true);
    onCompleted(finalScore);
    const earned = quizReward(finalScore);
    if (!wasRewarded && !rewarded) {
      addXP(earned); setWasRewarded(true); setAwardedThisRun(true); onRewarded();
      const attemptId = crypto.randomUUID();
      await Promise.all([
        user ? supabase.from("user_quiz_attempts").insert({ id: attemptId, user_id: user.id, geography, score: finalScore, xh_awarded: earned }) : Promise.resolve(),
        recordXpEvent({ sourceType: "awareness_quiz", sourceId: attemptId, label: `${meta.name} bilgi testi`, amount: earned }),
      ]);
    } else if (user) await supabase.from("user_quiz_attempts").insert({ user_id: user.id, geography, score: finalScore, xh_awarded: 0 });
  };
  const retry = () => { setIndex(0); setScore(0); setSelected(null); setDone(false); setNotice(""); setAwardedThisRun(false); };
  const share = async () => {
    const text = `SAH World ${meta.name} bilgi testinde ${score}/10 doğru yaptım. Kaynaklı öğrenme yolculuğuna sen de katıl.`;
    const url = `${window.location.origin}/farkindalik/${shareSlug(geography)}`;
    try { if (navigator.share) await navigator.share({ title: "SAH World · Mazlum Coğrafyalar", text, url }); else { await navigator.clipboard.writeText(`${text} ${url}`); setNotice("Sonuç bağlantısı panoya kopyalandı."); } } catch { /* Kullanıcının paylaşım penceresini kapatması hata değildir. */ }
  };

  if (done) return <div className="quiz-result"><span className="result-orbit"><AppIcon name={score >= 8 ? "rosette-discount-check" : "sparkles"} /></span><p className="eyebrow">{meta.name.toLocaleUpperCase("tr-TR")} · TEST TAMAMLANDI</p><h3>{score}/10 doğru</h3><p>{score >= 8 ? "Kaynakları dikkatle takip ettin. Şimdi bu bilgiyi sakin, özenli ve doğrulanabilir biçimde paylaşabilirsin." : "Açıklamaları ve kaynakları yeniden inceleyerek bilgi zincirini güçlendirebilirsin."}</p><div className="quiz-reward"><span><AppIcon name="sparkles" /></span><div><strong>{awardedThisRun ? `+${reward} XH kazandın` : "Bu tur öğrenme amaçlıydı"}</strong><small>{awardedThisRun ? `40 tamamlama XH’si + ${score * 5} doğru cevap XH’si` : "XH ödülü her coğrafyada yalnızca ilk tamamlamada verilir."}</small></div></div><div className="result-actions"><button className="primary-button" onClick={() => void share()}><AppIcon name="share-3" /> Sonucu paylaş</button><button className="ghost-button" onClick={retry}><AppIcon name="refresh" /> Yeniden dene</button></div>{notice && <p className="inline-notice">{notice}</p>}</div>;
  const answeredCorrectly = selected === question.correctOption;
  return <div className="quiz-layout awareness-quiz-v2"><aside><span className="quiz-index">{String(index + 1).padStart(2, "0")}<small>/10</small></span><div className="quiz-progress"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div><p><strong>{score}</strong> doğru cevap</p><small>Her sorudan sonra açıklamayı ve kaynağı incele.</small></aside><section className="quiz-card"><header><span>{meta.name} bilgi testi</span><span>{index + 1} / {questions.length}</span></header><h3>{question.questionText}</h3><div className="quiz-options">{options.map((option) => { const isCorrect = selected && option === question.correctOption; const isWrong = selected === option && option !== question.correctOption; return <button key={option} className={`${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`} onClick={() => answer(option)} disabled={Boolean(selected)}><b>{option}</b><span>{question.options[option]}</span>{isCorrect && <AppIcon name="circle-check-filled" />}{isWrong && <AppIcon name="circle-x-filled" />}</button>; })}</div>{selected && <motion.div role="status" className={`answer-explanation ${answeredCorrectly ? "correct" : "learn"}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><span><AppIcon name={answeredCorrectly ? "circle-check" : "bulb"} /></span><div><strong>{answeredCorrectly ? "Doğru cevap" : `Doğru cevap: ${question.correctOption}`}</strong><p>{question.explanationText}</p><a href={question.sourceUrl} target="_blank" rel="noopener noreferrer">Kaynağı incele <AppIcon name="external-link" /></a></div></motion.div>}<footer><span>{wasRewarded ? "Tekrar turu · XH ödülü verilmez" : "İlk tamamlama ödülü: 40 + doğru başına 5 XH"}</span><button className="primary-button" disabled={!selected} onClick={() => void next()}>{index === questions.length - 1 ? "Sonucu gör" : "Sonraki soru"} <AppIcon name="arrow-right" /></button></footer></section></div>;
}
