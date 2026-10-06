"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import { supabase } from "@/lib/supabase";
import { isValidUUID } from "@/store/useJourneyStore";
import type { ChatMessageRow } from "@/types/database";
import type { AppointmentView } from "./QuranCompanionView";

const safeAvatar = (name: string, url?: string | null) =>
  url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;

export default function AppointmentChat({ appointment, currentUserId, isHoca, onClose }: {
  appointment: AppointmentView;
  currentUserId: string;
  isHoca: boolean;
  onClose: () => void;
}) {
  const reducedMotion = useReducedMotion();
  const demoMode = Boolean(appointment.is_demo) || !isValidUUID(currentUserId);
  const [receiverId, setReceiverId] = useState(isHoca ? appointment.student_id : "");
  const [messages, setMessages] = useState<ChatMessageRow[]>(() => demoMode ? [{ id: "demo-welcome", sender_id: "ramazan-hoca", receiver_id: null, group_id: null, content: "Selâmün aleyküm. Ders öncesinde çalışmak istediğin sureyi buradan yazabilirsin.", is_read: true, created_at: new Date().toISOString() }] : []);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(!demoMode);
  const [error, setError] = useState("");
  const partnerName = isHoca ? appointment.student_name : appointment.hoca_name;
  const partnerAvatar = isHoca ? appointment.student_avatar : appointment.hoca_photo;

  useEffect(() => {
    if (demoMode) {
      return;
    }
    if (isHoca) {
      return;
    }
    void supabase.from("hoca_profiles").select("user_id").eq("id", appointment.hoca_id).maybeSingle().then(({ data, error: profileError }) => {
      if (profileError || !data?.user_id) setError("Hoca hesabı henüz mesajlaşma için etkin değil.");
      else setReceiverId(data.user_id);
    });
  }, [appointment.hoca_id, appointment.student_id, demoMode, isHoca]);

  useEffect(() => {
    if (demoMode || !receiverId) return;
    const query = `and(sender_id.eq.${currentUserId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${currentUserId})`;
    void supabase.from("chat_messages").select("*").is("group_id", null).or(query).order("created_at").then(({ data, error: loadError }) => {
      if (loadError) setError("Mesajlar yüklenemedi.");
      setMessages(data || []);
      setLoading(false);
    });
    const channel = ownedRealtimeChannel(supabase, `quran-appointment-${appointment.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const item = payload.new as ChatMessageRow;
        if ((item.sender_id === currentUserId && item.receiver_id === receiverId) || (item.sender_id === receiverId && item.receiver_id === currentUserId)) {
          setMessages((current) => current.some((message) => message.id === item.id) ? current : [...current, item]);
        }
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [appointment.id, currentUserId, demoMode, receiverId]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    if (demoMode) {
      setMessages((current) => [...current, { id: crypto.randomUUID(), sender_id: "demo-student", receiver_id: null, group_id: null, content, is_read: false, created_at: new Date().toISOString() }]);
      return;
    }
    if (!receiverId) return;
    const { error: sendError } = await supabase.from("chat_messages").insert({ sender_id: currentUserId, receiver_id: receiverId, group_id: null, content, is_read: false });
    if (sendError) setError("Mesaj gönderilemedi.");
  };

  return <div className="quran-modal-backdrop">
    <motion.section className="peer-chat-modal appointment-chat-modal" role="dialog" aria-modal="true" aria-label={`${partnerName} ile randevu mesajlaşması`} initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <header><AvatarImage src={safeAvatar(partnerName, partnerAvatar)} size={44} /><div><strong>{partnerName}</strong><span>Randevu mesajlaşması · {new Date(appointment.scheduled_start).toLocaleDateString("tr-TR")}</span></div><button onClick={onClose} aria-label="Mesajlaşmayı kapat"><AppIcon name="x" /></button></header>
      <div className="appointment-chat-context"><AppIcon name="calendar-check" /><span><strong>Ders konusu</strong>{appointment.topic_notes || "Henüz konu belirtilmedi"}</span>{demoMode && <em>ÖRNEK PİLOT</em>}</div>
      <div className="peer-messages">{loading && <p>Yükleniyor…</p>}{!loading && messages.length === 0 && <p>Ders öncesi ilk mesajı gönderebilirsin.</p>}{messages.map((message) => <article key={message.id} className={(demoMode ? message.sender_id === "demo-student" : message.sender_id === currentUserId) ? "mine" : ""}>{message.content}<time>{new Date(message.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time></article>)}</div>
      {error && <p className="appointment-chat-error" role="alert">{error}</p>}
      <form onSubmit={(event) => void send(event)}><input value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} disabled={!demoMode && !receiverId} placeholder="Mesajını yaz…" /><button aria-label="Mesaj gönder" disabled={!demoMode && !receiverId}><AppIcon name="send" /></button></form>
    </motion.section>
  </div>;
}
