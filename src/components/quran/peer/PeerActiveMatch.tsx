"use client";
import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import AvatarImage from "@/components/ui/AvatarImage";
import { avatar, type PeerView } from "../companionShared";
import { peerError, type PeerWorkspace } from "./peerMatchingUtils";
import PeerStudySession from "./PeerStudySession";
export default function PeerActiveMatch({
  match,
  userId,
  onChat,
  onEnd,
  unread,
}: {
  match: PeerView;
  userId: string;
  onChat: () => void;
  onEnd: () => void;
  unread: number;
}) {
  const [data, setData] = useState<PeerWorkspace | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [goal, setGoal] = useState(10),
    [editingGoal, setEditingGoal] = useState(false);
  const reduced = useReducedMotion();
  const reload = useCallback(async () => {
    const r = await supabase.rpc("get_peer_workspace", {
      target_match_id: match.id,
    });
    if (r.error) {
      setError("Ortak ilerleme yüklenemedi. Sohbetin kullanılabilir.");
      return;
    }
    setData(r.data as unknown as PeerWorkspace);
  }, [match.id]);
  useEffect(() => {
    void reload();
    const t = setInterval(() => {
      if (!document.hidden) void reload();
    }, 10000);
    return () => clearInterval(t);
  }, [reload]);
  async function action(action: string, payload: Json) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      const r = await supabase.rpc("peer_study_action", {
        target_match_id: match.id,
        action,
        payload,
      });
      if (r.error) throw r.error;
      await reload();
      return true;
    } catch (e) {
      setError(peerError(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="peer-active">
      <header>
        <div className="peer-pair-art" aria-hidden="true">
          <motion.span
            initial={reduced ? false : { x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            Sen
          </motion.span>
          <motion.div
            initial={reduced ? false : { x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
          >
            <AvatarImage
              src={avatar(match.partner_name, match.partner_avatar)}
              alt=""
              size={56}
            />
          </motion.div>
        </div>
        <div>
          <span className="peer-eyebrow">BİR AYET, İKİ YOL ARKADAŞI</span>
          <h3>{match.partner_name} ile kardeşliğin</h3>
          <p>
            {data?.streak
              ? `${data.streak} gündür birlikte çalışıyorsunuz.`
              : "İlk ortak çalışmanızla güzel bir ritim başlatın."}
          </p>
        </div>
        <button className="peer-primary" onClick={onChat}>
          Mesajlaş{unread > 0 && ` (${unread})`}
        </button>
      </header>
      {error && (
        <p role="alert">
          {error}
          <button onClick={() => void reload()}>Yeniden dene</button>
        </p>
      )}
      {data && (
        <>
          <div className="peer-progress-stats">
            <div>
              <strong>{data.total_pages}</strong>
              <span>birlikte okunan sayfa</span>
            </div>
            <div>
              <strong>{data.surahs}</strong>
              <span>çalışılan sure</span>
            </div>
            <div>
              <strong>{data.streak}</strong>
              <span>günlük ortak seri</span>
            </div>
          </div>
          <div className="peer-weekly-goal">
            <header>
              <h4>Bu haftanın ortak hedefi</h4>
              <button
                onClick={() => {
                  setGoal(data.weekly_goal);
                  setEditingGoal(!editingGoal);
                }}
              >
                Hedefi düzenle
              </button>
            </header>
            <progress
              value={Math.min(data.weekly_pages, data.weekly_goal)}
              max={data.weekly_goal}
            />
            <p>
              {data.weekly_pages} / {data.weekly_goal} sayfa · Yalnızca ikinizin
              de tamamladığı oturumlar sayılır.
            </p>
            {editingGoal && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBusy(true);
                  const r = await supabase.rpc("set_peer_weekly_goal", {
                    target_match_id: match.id,
                    page_goal: goal,
                  });
                  setBusy(false);
                  if (r.error) setError(peerError(r.error));
                  else {
                    setEditingGoal(false);
                    void reload();
                  }
                }}
              >
                <label>
                  Haftalık sayfa hedefi
                  <input
                    type="number"
                    required
                    min={1}
                    max={700}
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                  />
                </label>
                <button disabled={busy}>Kaydet</button>
              </form>
            )}
            <small>
              {data.last_study
                ? `Son ortak çalışma: ${new Date(data.last_study).toLocaleDateString("tr-TR")}`
                : "Henüz tamamlanmış ortak çalışma yok."}
            </small>
            {data.partner_today_pages > 0 && (
              <p className="peer-nudge">
                Kardeşin bugün {data.partner_today_pages} sayfa okudu. Sen de
                okumaya bir alan aç.
              </p>
            )}
          </div>
          <PeerStudySession
            session={data.session}
            userId={userId}
            busy={busy}
            onAction={action}
          />
        </>
      )}
      <footer>
        <button className="peer-text-button" onClick={onEnd}>
          Kardeşliği sonlandır
        </button>
      </footer>
    </article>
  );
}
