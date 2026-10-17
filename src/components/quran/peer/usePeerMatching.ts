"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import type { PeerView } from "../companionShared";
import {
  peerError,
  type PeerProfile,
  type PeerCandidate,
} from "./peerMatchingUtils";
export function usePeerMatching({
  userId,
  realUser,
  onReload,
}: {
  userId: string;
  realUser: boolean;
  onReload: () => Promise<void>;
}) {
  const [profile, setProfile] = useState<PeerProfile | null>(null),
    [candidates, setCandidates] = useState<PeerCandidate[]>([]),
    [queueAt, setQueueAt] = useState<string | null>(null),
    [loading, setLoading] = useState(realUser),
    [available, setAvailable] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false),
    generation = useRef(0),
    onReloadRef = useRef(onReload);
  useEffect(() => {
    onReloadRef.current = onReload;
  }, [onReload]);
  const reload = useCallback(async () => {
    if (!realUser) {
      return;
    }
    const current = ++generation.current;
    try {
      const [p, c, q] = await Promise.all([
        supabase
          .from("quran_peer_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.rpc("discover_quran_peers"),
        supabase.rpc("get_my_quran_peer_queue"),
      ]);
      if (current !== generation.current) return;
      if (p.error || c.error || q.error) {
        setAvailable(false);
        setError(
          "Eşleşme profilleri şu anda yüklenemiyor. Mevcut sohbet ve çalışma odalarını kullanabilirsin.",
        );
        return;
      }
      setAvailable(true);
      setError("");
      setProfile(p.data);
      setCandidates((c.data || []) as unknown as PeerCandidate[]);
      setQueueAt(q.data?.[0]?.queued_at || null);
    } catch {
      if (current === generation.current)
        setError("Bağlantı kurulamadı. Yeniden deneyebilirsin.");
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [realUser, userId]);
  useEffect(() => {
    // Hydrate external Supabase state; reload only sets state after its request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const timer = setInterval(() => {
      if (!document.hidden) {
        void reload();
        void onReloadRef.current();
      }
    }, 15000);
    return () => {
      // This is a request counter, not a DOM ref: invalidate every in-flight request.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      clearInterval(timer);
    };
  }, [reload]);
  const run = async (
    action: () => PromiseLike<{ error: unknown }>,
    success: string,
  ) => {
    if (lock.current || !realUser) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const response = await action();
      if (response.error) throw response.error;
      setNotice(success);
      await Promise.all([reload(), onReload()]);
      return true;
    } catch (e) {
      setError(peerError(e));
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return {
    profile,
    candidates,
    queueAt,
    loading,
    available,
    busy,
    error,
    notice,
    reload,
    setError,
    save: (p: PeerProfile) =>
      run(
        () =>
          supabase.rpc("save_quran_peer_profile", {
            payload: p as unknown as Json,
          }),
        "Eşleşme profilin kaydedildi.",
      ),
    join: () =>
      run(
        () => supabase.rpc("smart_match_quran_peer"),
        "Tercihlerin alındı. Eşleşmen varsa Kardeşliğim alanında, yoksa havuzda bekliyorsun.",
      ),
    leaveQueue: () =>
      run(() => supabase.rpc("leave_quran_peer_queue"), "Havuzdan çıktın."),
    request: (c: PeerCandidate, note: string) =>
      run(
        () =>
          supabase.rpc("request_quran_peer_v2", {
            target_user_id: c.user_id,
            note,
          }),
        "Tanışma isteğin gönderildi.",
      ),
    respond: (m: PeerView, accept: boolean) =>
      run(
        () =>
          supabase.rpc("respond_quran_peer_match", {
            target_match_id: m.id,
            accept_request: accept,
          }),
        accept ? "Kardeşliğiniz başladı." : "İstek reddedildi.",
      ),
    end: (m: PeerView) =>
      run(
        () => supabase.rpc("leave_quran_peer_match", { target_match_id: m.id }),
        "Eşleşme sonlandırıldı.",
      ),
  };
}
