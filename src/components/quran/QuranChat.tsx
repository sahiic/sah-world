"use client";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { X, Send, Lock, MessageCircle } from "lucide-react";
import AvatarImage from "@/components/ui/AvatarImage";
import QuranModal from "./QuranModal";
import { supabase } from "@/lib/supabase";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import {
  chatDateLabel,
  istanbulDay,
  mergeChatMessages,
} from "@/lib/quranSocial";
import type { ChatMessageRow } from "@/types/database";
import type { QuranPresenceState } from "./useQuranPresence";

type Props = {
  contextId: string;
  userId: string;
  partnerId?: string;
  groupId?: string;
  name: string;
  avatar?: string | null;
  subtitle: string;
  topic?: string;
  onClose: () => void;
  onRead?: () => void;
  demo?: boolean;
  readOnly?: boolean;
  unavailable?: string;
  kind?: "peer" | "appointment";
  presence?: QuranPresenceState;
};
export default function QuranChat(props: Props) {
  const {
    contextId,
    userId,
    partnerId,
    groupId,
    name,
    subtitle,
    topic,
    onClose,
    onRead,
    demo = false,
    readOnly = false,
    presence,
  } = props;
  const [legacy, setLegacy] = useState(false);
  const [messages, setMessages] = useState<ChatMessageRow[]>(() =>
    demo
      ? [
          {
            id: "demo-welcome",
            context_id: contextId,
            sender_id: "demo-teacher",
            receiver_id: userId,
            group_id: null,
            content:
              "Selâmün aleyküm. Ders öncesinde çalışmak istediğin sureyi buradan yazabilirsin.",
            is_read: true,
            edited_at: null,
            deleted_at: null,
            created_at: new Date().toISOString(),
          },
        ]
      : [],
  );
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!groupId || demo) return;
    let active = true;
    void supabase
      .rpc("get_group_roster", { target_group_id: groupId })
      .then(({ data, error: e }) => {
        if (active && !e)
          setParticipants(
            Object.fromEntries(
              (data ?? []).map((member) => [
                member.user_id,
                member.display_name,
              ]),
            ),
          );
      });
    return () => {
      active = false;
    };
  }, [demo, groupId]);
  const [loading, setLoading] = useState(!demo),
    [sending, setSending] = useState(false),
    [error, setError] = useState("");
  const [hasOlder, setHasOlder] = useState(false),
    [newMessages, setNewMessages] = useState(false),
    [scrollVersion, setScrollVersion] = useState(0);
  const list = useRef<HTMLDivElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    nearBottom = useRef(true),
    sendLock = useRef(false),
    readLock = useRef(false);
  const readCallback = useRef(onRead);
  useEffect(() => {
    readCallback.current = onRead;
  }, [onRead]);
  const isVisibleMessage = (m: ChatMessageRow) =>
    groupId
      ? m.group_id === groupId
      : !m.group_id &&
        (legacy
          ? m.context_id === null &&
            ((m.sender_id === userId && m.receiver_id === partnerId) ||
              (m.sender_id === partnerId && m.receiver_id === userId))
          : m.context_id === contextId);
  const loadPage = useCallback(
    async (before?: ChatMessageRow) => {
      let query = supabase.from("chat_messages").select("*");
      if (groupId) query = query.eq("group_id", groupId);
      else if (legacy)
        query = query
          .is("group_id", null)
          .is("context_id", null)
          .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`,
          );
      else query = query.eq("context_id", contextId).is("group_id", null);
      if (before)
        query = query.or(
          `created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`,
        );
      return await query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(50);
    },
    [contextId, groupId, legacy, partnerId, userId],
  );
  useEffect(() => {
    if (demo || (!partnerId && !groupId)) return;
    let active = true;
    // Subscribe before the initial snapshot; merge by id so neither in-flight
    // snapshots nor realtime events can drop or duplicate messages.
    const channel = ownedRealtimeChannel(
      supabase,
      `quran-chat-${contextId}-${legacy}`,
    )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: groupId
            ? `group_id=eq.${groupId}`
            : legacy
              ? undefined
              : `context_id=eq.${contextId}`,
        },
        (payload) => {
          if (!active || payload.eventType === "DELETE") return;
          const m = payload.new as ChatMessageRow;
          if (!isVisibleMessage(m)) return;
          setMessages((current) => mergeChatMessages(current, [m]));
          if (payload.eventType === "INSERT" && !nearBottom.current)
            setNewMessages(true);
        },
      )
      .subscribe();
    void loadPage().then(({ data, error: loadError }) => {
      if (!active) return;
      setError(
        loadError
          ? "Mesajlar yüklenemedi. Bağlantıyı kontrol edip yeniden aç."
          : "",
      );
      setMessages((current) => mergeChatMessages(current, data ?? []));
      setHasOlder((data?.length ?? 0) === 50);
      setLoading(false);
    });
    const refresh = () => {
      if (document.visibilityState === "visible")
        void loadPage().then(({ data, error: e }) => {
          if (active && !e) {
            setMessages((current) => mergeChatMessages(current, data ?? []));
            setError("");
          }
        });
    };
    const retry = window.setInterval(refresh, 30000);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(retry);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      void supabase.removeChannel(channel);
    };
    // isVisibleMessage is determined entirely by the explicit thread keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextId, demo, groupId, legacy, loadPage, partnerId, userId]);
  useEffect(() => {
    if (nearBottom.current && list.current) {
      list.current.scrollTop = list.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {
    if (demo || legacy || groupId || !partnerId) return;
    let active = true;
    const acknowledge = async () => {
      if (
        readLock.current ||
        document.visibilityState !== "visible" ||
        !nearBottom.current
      )
        return;
      const ids = messages
        .filter((m) => m.receiver_id === userId && !m.is_read)
        .map((m) => m.id)
        .slice(-100);
      if (!ids.length) return;
      readLock.current = true;
      const { error: e } = await supabase.rpc("mark_quran_thread_read", {
        target_context: contextId,
        message_ids: ids,
      });
      readLock.current = false;
      if (!active) return;
      if (e) {
        setError("Okundu bilgisi gönderilemedi. Mesajların korunuyor.");
        return;
      }
      setMessages((current) =>
        current.map((m) => (ids.includes(m.id) ? { ...m, is_read: true } : m)),
      );
      readCallback.current?.();
    };
    void acknowledge();
    const retry = window.setInterval(() => void acknowledge(), 15000);
    const visible = () => void acknowledge();
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      window.clearInterval(retry);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [
    messages,
    contextId,
    demo,
    groupId,
    legacy,
    partnerId,
    userId,
    scrollVersion,
  ]);
  const older = async () => {
    const el = list.current,
      height = el?.scrollHeight ?? 0;
    setLoading(true);
    const { data, error: e } = await loadPage(messages[0]);
    setLoading(false);
    if (e) {
      setError("Önceki mesajlar yüklenemedi.");
      return;
    }
    nearBottom.current = false;
    setHasOlder((data?.length ?? 0) === 50);
    setMessages((current) => mergeChatMessages(current, data ?? []));
    requestAnimationFrame(() => {
      if (el) el.scrollTop += el.scrollHeight - height;
    });
  };
  const send = async () => {
    const content = text.trim();
    if (
      !content ||
      sendLock.current ||
      legacy ||
      readOnly ||
      (!demo && !partnerId && !groupId)
    )
      return;
    sendLock.current = true;
    setSending(true);
    presence?.setTyping(contextId, false);
    try {
      const result = demo
        ? {
            data: {
              id: crypto.randomUUID(),
              context_id: contextId,
              sender_id: userId,
              receiver_id: partnerId ?? null,
              group_id: groupId ?? null,
              content,
              is_read: false,
              created_at: new Date().toISOString(),
            } as ChatMessageRow,
            error: null,
          }
        : groupId
          ? await supabase.rpc("send_group_message", {
              target_group_id: groupId,
              message_content: content,
            })
          : await supabase.rpc("send_quran_message", {
              target_context: contextId,
              message_content: content,
            });
      if (result.error || !result.data) {
        setError("Mesaj gönderilemedi. Metnin korunuyor; yeniden dene.");
        return;
      }
      nearBottom.current = true;
      setMessages((current) => mergeChatMessages(current, [result.data]));
      setNewMessages(false);
      setText("");
      setError("");
    } catch {
      setError("Bağlantı kurulamadı. Metnin korunuyor.");
    } finally {
      sendLock.current = false;
      setSending(false);
      input.current?.focus();
    }
  };
  const canModify = (m: ChatMessageRow) =>
    m.sender_id === userId &&
    !demo &&
    !legacy &&
    Date.now() - new Date(m.created_at).getTime() < 15 * 60_000;

  const editMessage = async (id: string) => {
    const content = editText.trim();
    if (!content) return;
    const { error: e } = await supabase.rpc("update_quran_message", {
      target_message_id: id,
      new_content: content,
    });
    if (e) {
      setError("Mesaj düzenlenemedi.");
      return;
    }
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, content, edited_at: new Date().toISOString() } : m)),
    );
    setEditingId(null);
    setEditText("");
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Bu mesajı silmek istiyor musun?")) return;
    const { error: e } = await supabase.rpc("delete_quran_message", {
      target_message_id: id,
    });
    if (e) {
      setError("Mesaj silinemedi.");
      return;
    }
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, content: "Bu mesaj silindi.", deleted_at: new Date().toISOString() } : m)),
    );
    setMenuId(null);
  };

  const switchArchive = () => {
    setLegacy((current) => !current);
    setMessages([]);
    setLoading(true);
    setHasOlder(false);
    nearBottom.current = true;
    setError("");
    setNewMessages(false);
  };
  useEffect(() => {
    const el = input.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
    }
  }, [text]);
  const signalTyping = presence?.setTyping;
  useEffect(
    () => () => {
      signalTyping?.(contextId, false);
    },
    [contextId, signalTyping],
  );
  return (
    <QuranModal
      onClose={onClose}
      label={`${name} ile ${groupId ? "grup sohbeti" : props.kind === "peer" ? "kardeşlik sohbeti" : "randevu mesajlaşması"}`}
      className="qc-chat-container"
    >
      <header className="qc-chat-header">
        <AvatarImage
          src={
            props.avatar ||
            `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`
          }
          size={44}
        />
        <div>
          <strong>{name}</strong>
          <small>{subtitle}</small>
          {partnerId && presence && (
            <span
              className={`qc-presence-dot ${presence.online.has(partnerId) ? "online" : "offline"}`}
            >
              {presence.online.has(partnerId)
                ? "Çevrimiçi"
                : "Çevrimiçi bilgisi paylaşılmıyor"}
            </span>
          )}
        </div>
        <button onClick={onClose} aria-label="Mesajlaşmayı kapat">
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <div className="qc-chat-context">
        <Lock size={16} aria-hidden="true" />
        <span>
          {legacy
            ? "Eski ortak sohbet · salt okunur arşiv"
            : topic || "Bu sohbet yalnızca bu çalışma içindir."}
          {demo && " · Örnek pilot, sunucuya kaydedilmez"}
        </span>
        {!groupId && !demo && (
          <button onClick={switchArchive}>
            {legacy ? "Çalışma sohbetine dön" : "Eski mesajlar"}
          </button>
        )}
      </div>
      <div
        ref={list}
        className="qc-chat-messages"
        role="log"
        aria-label="Sohbet mesajları"
        aria-live="polite"
        onScroll={() => {
          const el = list.current;
          if (el) {
            const before = nearBottom.current;
            nearBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 64;
            if (nearBottom.current) {
              setNewMessages(false);
              if (!before) setScrollVersion((v) => v + 1);
            }
          }
        }}
      >
        {hasOlder && (
          <button
            className="qc-chat-older"
            disabled={loading}
            onClick={() => void older()}
          >
            Önceki mesajları yükle
          </button>
        )}
        {loading && !props.unavailable && (
          <p className="qc-chat-empty">Mesajlar yükleniyor…</p>
        )}
        {props.unavailable && (
          <p className="qc-chat-error" role="alert">
            {props.unavailable}
          </p>
        )}
        {!loading && !messages.length && (
          <div className="qc-chat-empty">
            <MessageCircle size={28} aria-hidden="true" />
            <strong>
              {legacy ? "Eski mesaj yok" : "İlk selâm senden olsun"}
            </strong>
            <p>
              {legacy
                ? "Önceki ortak konuşmalar burada saklanır."
                : "Çalışacağınız sureyi veya uygun olduğun zamanı paylaşabilirsin."}
            </p>
          </div>
        )}
        {messages.map((m, i) => {
          const mine = m.sender_id === userId;
          return (
            <Fragment key={m.id}>
              {(i === 0 ||
                istanbulDay(messages[i - 1].created_at) !==
                  istanbulDay(m.created_at)) && (
                <div className="qc-chat-date-divider">
                  {chatDateLabel(m.created_at)}
                </div>
              )}
              <article
                className={`qc-chat-bubble ${mine ? "mine" : "theirs"}${(m as ChatMessageRow & { deleted_at?: string }).deleted_at ? " deleted" : ""}`}
                onContextMenu={(e) => {
                  if (canModify(m)) {
                    e.preventDefault();
                    setMenuId(menuId === m.id ? null : m.id);
                  }
                }}
              >
                {groupId && !mine && (
                  <strong className="qc-chat-author">
                    {participants[m.sender_id] || "Katılımcı"}
                  </strong>
                )}
                {editingId === m.id ? (
                  <div className="qc-chat-edit">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={2000}
                      rows={2}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void editMessage(m.id); }
                      }}
                    />
                    <div>
                      <button type="button" onClick={() => { setEditingId(null); setEditText(""); }}>Vazgeç</button>
                      <button type="button" className="primary-button" onClick={() => void editMessage(m.id)}>Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
                {(m as ChatMessageRow & { edited_at?: string }).edited_at && !(m as ChatMessageRow & { deleted_at?: string }).deleted_at && (
                  <small className="qc-chat-edited">(düzenlendi)</small>
                )}
                <div className="qc-chat-meta">
                  <time className="qc-chat-time" dateTime={m.created_at}>
                    {new Date(m.created_at).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Istanbul",
                    })}
                  </time>
                  {mine && !groupId && (
                    <span
                      className={`qc-chat-status ${m.is_read ? "read" : ""}`}
                      aria-label={
                        demo
                          ? "Örnek mesaj · kaydedilmedi"
                          : m.is_read
                            ? "Okundu"
                            : "Gönderildi"
                      }
                    >
                      {m.is_read ? "✓✓" : "✓"}
                    </span>
                  )}
                  {canModify(m) && !(m as ChatMessageRow & { deleted_at?: string }).deleted_at && (
                    <button
                      className="qc-chat-action-trigger"
                      onClick={() => setMenuId(menuId === m.id ? null : m.id)}
                      aria-label="Mesaj seçenekleri"
                    >
                      ⋯
                    </button>
                  )}
                </div>
                {menuId === m.id && (
                  <div className="qc-chat-actions">
                    <button onClick={() => { setEditingId(m.id); setEditText(m.content); setMenuId(null); }}>
                      Düzenle
                    </button>
                    <button onClick={() => void deleteMessage(m.id)}>
                      Sil
                    </button>
                  </div>
                )}
              </article>
            </Fragment>
          );
        })}
        {presence?.typing.has(contextId) && (
          <div className="qc-chat-typing" role="status">
            <i />
            <i />
            <i />
            <span>{name} yazıyor…</span>
          </div>
        )}
      </div>
      {newMessages && (
        <button
          className="qc-chat-jump"
          onClick={() => {
            if (list.current)
              list.current.scrollTop = list.current.scrollHeight;
            nearBottom.current = true;
            setNewMessages(false);
            setScrollVersion((v) => v + 1);
          }}
        >
          Yeni mesajlar ↓
        </button>
      )}
      {error && (
        <p className="qc-chat-error" role="alert">
          {error}
        </p>
      )}
      {legacy || readOnly ? (
        <p className="qc-chat-readonly">
          Bu sohbet salt okunur; kayıtların korunuyor.
        </p>
      ) : (
        <form
          className="qc-chat-input-area"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <label className="sr-only" htmlFor={`qc-message-${contextId}`}>
            Mesajın
          </label>
          <textarea
            ref={input}
            id={`qc-message-${contextId}`}
            rows={1}
            value={text}
            maxLength={2000}
            placeholder="Mesajını yaz…"
            disabled={!demo && !partnerId && !groupId}
            onChange={(e) => {
              setText(e.target.value);
              presence?.setTyping(contextId, Boolean(e.target.value.trim()));
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            className="qc-chat-send-btn"
            aria-label="Mesaj gönder"
            disabled={
              sending || !text.trim() || (!demo && !partnerId && !groupId)
            }
          >
            <Send size={20} aria-hidden="true" />
          </button>
          <small>Enter gönder · Shift + Enter yeni satır</small>
        </form>
      )}
    </QuranModal>
  );
}
