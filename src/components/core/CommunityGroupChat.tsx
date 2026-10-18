"use client";
import EmptyState from "@/components/ui/EmptyState";
import AvatarImage from "@/components/ui/AvatarImage";
import type { ChatMessageRow } from "@/types/database";
import type { RosterMember } from "./CommunityView";

export default function GroupChat({
  messages,
  roster,
  userId,
  onSend,
  onLoadOlder,
  hasOlder,
  sending,
  endRef,
}: {
  messages: ChatMessageRow[];
  roster: RosterMember[];
  userId: string;
  onSend: (event: React.FormEvent<HTMLFormElement>) => void;
  onLoadOlder: () => void;
  hasOlder: boolean;
  sending: boolean;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const byId = new Map(roster.map((member) => [member.user_id, member]));
  return (
    <div className="chat-shell">
      <div className="message-list" aria-live="polite">
        {hasOlder && (
          <button className="older-messages" onClick={onLoadOlder}>
            Daha eski mesajları yükle
          </button>
        )}
        {!messages.length ? (
          <EmptyState icon="◌" title="Sohbet henüz sessiz" description="İlk destek mesajını göndererek alanı başlat." />
        ) : (
          messages.map((message) => {
            const own = message.sender_id === userId;
            const member = byId.get(message.sender_id);
            return (
              <article className={own ? "own" : ""} key={message.id}>
                {!own && (
                  <AvatarImage
                    src={
                      member?.avatar_url ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member?.display_name || "SAHİ")}`
                    }
                    size={32}
                  />
                )}
                <div>
                  <small>
                    {own ? "Sen" : member?.display_name || "Üye"} ·{" "}
                    {new Intl.DateTimeFormat("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(message.created_at))}
                  </small>
                  <p>{message.content}</p>
                </div>
              </article>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <form className="message-form" onSubmit={onSend}>
        <label className="sr-only" htmlFor="group-message">
          Topluluk mesajı
        </label>
        <input
          id="group-message"
          name="message"
          maxLength={2000}
          autoComplete="off"
          placeholder="Topluluğa destekleyici bir mesaj yaz…"
        />
        <button type="submit" disabled={sending}>
          {sending ? "Gönderiliyor…" : "Gönder"}
        </button>
      </form>
    </div>
  );
}

