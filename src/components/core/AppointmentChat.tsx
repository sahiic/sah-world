"use client";

import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { supabase } from "@/lib/supabase";
import type { ChatMessageRow, QuranAppointmentView } from "@/types/database";

export default function AppointmentChat({
  appointment,
  currentUserId,
  isHoca,
  hocaUserId,
  onClose,
}: {
  appointment: QuranAppointmentView;
  currentUserId: string;
  isHoca: boolean;
  hocaUserId: string | null;
  onClose: () => void;
}) {
  const partnerId = isHoca ? appointment.student_id : hocaUserId;
  const partnerName = isHoca ? appointment.student_name : appointment.hoca_name;
  const partnerPhoto = isHoca ? appointment.student_avatar : appointment.hoca_photo;
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(Boolean(partnerId));
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!partnerId || !currentUserId) return;
    let active = true;
    const load = async () => {
      const { data, error: queryError } = await supabase
        .from("chat_messages")
        .select("*")
        .is("group_id", null)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true })
        .limit(150);
      if (!active) return;
      if (queryError) setError("Mesajlar yüklenemedi. Tekrar açıp deneyebilirsin.");
      else setMessages(data || []);
      setLoading(false);
      void supabase.from("chat_messages").update({ is_read: true }).eq("sender_id", partnerId).eq("receiver_id", currentUserId).eq("is_read", false);
    };
    void load();
    const channel = supabase
      .channel(`quran-appointment-chat-${appointment.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const incoming = payload.new as ChatMessageRow;
        if (incoming.group_id === null && ((incoming.sender_id === currentUserId && incoming.receiver_id === partnerId) || (incoming.sender_id === partnerId && incoming.receiver_id === currentUserId))) {
          setMessages((current) => current.some((item) => item.id === incoming.id) ? current : [...current, incoming]);
          if (incoming.sender_id === partnerId) void supabase.from("chat_messages").update({ is_read: true }).eq("id", incoming.id).eq("receiver_id", currentUserId);
        }
      })
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [appointment.id, currentUserId, partnerId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!partnerId || sending) return;
    const form = event.currentTarget;
    const content = new FormData(form).get("message");
    const text = typeof content === "string" ? content.trim() : "";
    if (!text || text.length > 2000) return;
    setSending(true);
    setError("");
    const { error: sendError } = await supabase.from("chat_messages").insert({
      sender_id: currentUserId,
      receiver_id: partnerId,
      group_id: null,
      content: text,
      is_read: false,
    });
    setSending(false);
    if (sendError) {
      setError("Mesaj gönderilemedi. Randevu katılımcısı olduğundan emin ol.");
      return;
    }
    form.reset();
  };

  return (
    <div className="quran-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="peer-chat-modal quran-appointment-chat" data-appointment-id={appointment.id} role="dialog" aria-modal="true" aria-label="Randevu mesajlaşması">
        <header>
          <AvatarImage src={partnerPhoto || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(partnerName)}`} alt="" size={42} />
          <div><strong>Randevu mesajlaşması</strong><span>{partnerName} · {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(appointment.scheduled_start))}</span></div>
          <button type="button" onClick={onClose} aria-label="Kapat"><AppIcon name="x" /></button>
        </header>
        {!partnerId ? <div className="quran-chat-unlinked"><AppIcon name="message-circle" /><strong>Hoca hesabı henüz eşlenmedi</strong><p>Bu profil gerçek bir öğretmen hesabına bağlandığında buradan güvenle mesajlaşabilirsiniz.</p></div> : <>
          <div className="peer-messages" ref={listRef} aria-live="polite">
            {loading ? <p>Yükleniyor…</p> : messages.length === 0 ? <p>Randevu hakkında ilk mesajı buradan gönderebilirsin.</p> : messages.map((message) => <article className={message.sender_id === currentUserId ? "mine" : ""} key={message.id}>{message.content}<time>{new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.created_at))}</time></article>)}
          </div>
          {error && <p className="quran-chat-error" role="alert">{error}</p>}
          <form onSubmit={(event) => void send(event)}><input name="message" maxLength={2000} autoComplete="off" placeholder="Mesajını yaz…" aria-label="Mesaj" /><button type="submit" disabled={sending} aria-label="Gönder"><AppIcon name="send" /></button></form>
          <p className="quran-chat-context">Mesajlarınız mevcut birebir sohbetinizde görünür. Bu randevu yalnızca konuşma bağlamıdır.</p>
        </>}
      </section>
    </div>
  );
}
