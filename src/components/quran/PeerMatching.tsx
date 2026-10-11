"use client";
import EmptyState from "@/components/quran/QuranEmptyState";
import QuranModal from "@/components/quran/QuranModal";
import QuranStudyGroup from "@/components/quran/QuranStudyGroup";
import { type QuranPresenceState } from "@/components/quran/useQuranPresence";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { supabase } from "@/lib/supabase";
import type { QuranLevel, QuranThreadSummary } from "@/types/database";
import { useRef, useState } from "react";

import { avatar, type HelperView, type PeerView } from "./companionShared";
import PeerChat from "./PeerChat";
interface PeerMatchingProps {
  helpers: HelperView[];
  matches: PeerView[];
  level: QuranLevel | null;
  userId: string;
  realUser: boolean;
  onReload: () => Promise<void>;
  threads: QuranThreadSummary[];
  onRead: () => void;
  presence: QuranPresenceState;
}

export default function PeerMatching({
  helpers,
  matches,
  level,
  userId,
  realUser,
  onReload,
  threads,
  onRead,
  presence,
}: PeerMatchingProps) {
  const [activeChat, setActiveChat] = useState<PeerView | null>(null);
  const [requestTarget, setRequestTarget] = useState<HelperView | null>(null),
    [requestMessage, setRequestMessage] = useState(""),
    [peerError, setPeerError] = useState(""),
    [peerBusy, setPeerBusy] = useState(false);
  const peerLock = useRef(false);
  const request = async (helper: HelperView) => {
    if (!realUser) {
      setPeerError("Eşleşme isteği için gerçek hesabınla giriş yap.");
      return;
    }
    if (peerLock.current) return;
    peerLock.current = true;
    setPeerBusy(true);
    setPeerError("");
    const { error } = await supabase.rpc("send_quran_peer_request", {
      target_helper_id: helper.id,
      request_message: requestMessage,
    });
    peerLock.current = false;
    setPeerBusy(false);
    if (error)
      setPeerError(
        error.message.includes("COOLDOWN")
          ? "Bu kişiye yeniden istek göndermeden önce 24 saat bekle."
          : "İstek gönderilemedi. Notun korunuyor.",
      );
    else {
      setRequestTarget(null);
      setRequestMessage("");
      await onReload();
    }
  };
  const respond = async (match: PeerView, accept: boolean) => {
    if (peerLock.current) return;
    peerLock.current = true;
    setPeerBusy(true);
    const { error } = await supabase.rpc("respond_quran_peer_match", {
      target_match_id: match.id,
      accept_request: accept,
    });
    peerLock.current = false;
    setPeerBusy(false);
    if (!error) await onReload();
    else setPeerError("Yanıt kaydedilemedi. Yeniden dene.");
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">KUR’AN KARDEŞİ</span>
          <h2>Birlikte öğrenmek kolaylaştırır</h2>
          <p>
            Bu alan yalnızca Kur’an öğrenme desteği içindir. Kişisel bilgilerini
            paylaşmadan uygulama içinden iletişim kur.
          </p>
        </div>
      </header>
      {peerError && !requestTarget && (
        <p className="booking-error" role="alert">
          {peerError}
        </p>
      )}
      {level !== "helper" && level !== "fluent" && realUser && (
        <div className="peer-helper-note">
          <AppIcon name="heart-handshake" />
          <div>
            <strong>Kur’an kardeşi olmak ister misin?</strong>
            <span>
              Seviyeni &quot;Destek olabilirim&quot; veya &quot;Akıcı
              okuyorum&quot; olarak güncellersen, diğer kullanıcılar seni
              bulabilir.
            </span>
          </div>
        </div>
      )}
      {level === "helper" ? (
        <div className="peer-helper-note">
          <AppIcon name="heart-handshake" />
          <div>
            <strong>Destek veren olarak görünüyorsun</strong>
            <span>
              Daha erken aşamadaki kullanıcılar sana eşleşme isteği
              gönderebilir.
            </span>
          </div>
        </div>
      ) : (
        <>
          <h3 className="subsection-title">Destek olabilecek kardeşler</h3>
          {helpers.length === 0 ? (
            <EmptyState
              icon="users-minus"
              title="Şu anda eşleşebilecek Kur'an kardeşi bulunmuyor"
              text="Yeni gönüllüler katıldığında burada görünecek. Seviyeni 'Destek olabilirim' olarak güncellersen, başkalarının seni bulmasını sağlarsın."
            />
          ) : (
            <div className="helper-grid">
              {helpers.map((helper) => (
                <article key={helper.id}>
                  <AvatarImage
                    src={avatar(helper.display_name, helper.avatar_url)}
                    alt=""
                    size={64}
                  />
                  <div>
                    <strong>{helper.display_name}</strong>
                    <span>Gönüllü akran desteği</span>
                    <small className="qc-peer-level">
                      {helper.quran_level === "helper"
                        ? "Destekçi"
                        : "Akıcı okuyor"}{" "}
                      · {helper.xp} deneyim puanı
                    </small>
                    <span
                      className={`qc-presence-dot ${presence.online.has(helper.id) ? "online" : "offline"}`}
                    >
                      {presence.online.has(helper.id)
                        ? "Çevrimiçi"
                        : "Durum paylaşılmıyor"}
                    </span>
                  </div>
                  <button
                    disabled={matches.some(
                      (m) =>
                        m.partner_id === helper.id &&
                        ["pending", "accepted"].includes(m.status),
                    )}
                    onClick={() => {
                      setRequestTarget(helper);
                      setPeerError("");
                      setRequestMessage("Birlikte Kur'an çalışmak isterim.");
                    }}
                  >
                    İstek gönder
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <h3 className="subsection-title">Eşleşmelerim</h3>
      {matches.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title="Henüz eşleşmen yok"
          text="Gönderdiğin ve sana gelen istekler burada görünür."
          compact
        />
      ) : (
        <div className="peer-match-list">
          {matches.map((match) => (
            <article key={match.id}>
              <AvatarImage
                src={avatar(match.partner_name, match.partner_avatar)}
                alt=""
                size={48}
              />
              <div>
                <strong>{match.partner_name}</strong>
                <span>
                  {match.direction === "received"
                    ? "Sana gönderildi"
                    : "Sen gönderdin"}{" "}
                  ·{" "}
                  {match.status === "pending"
                    ? "Yanıt bekliyor"
                    : match.status === "accepted"
                      ? "Eşleşti"
                      : "Olumsuz"}
                </span>
                {match.message && <p>{match.message}</p>}
                <ol className="qc-peer-timeline" aria-label="Eşleşme aşamaları">
                  <li className="done">İstek</li>
                  <li
                    className={match.status === "pending" ? "current" : "done"}
                  >
                    Yanıt
                  </li>
                  <li className={match.status === "accepted" ? "done" : ""}>
                    Birlikte çalışma
                  </li>
                </ol>
                {match.status === "accepted" && (
                  <>
                    <span
                      className={`qc-presence-dot ${presence.online.has(match.partner_id) ? "online" : "offline"}`}
                    >
                      {presence.online.has(match.partner_id)
                        ? "Çevrimiçi"
                        : "Durum paylaşılmıyor"}
                    </span>
                    <p className="qc-peer-preview">
                      {threads.find((t) => t.context_id === match.id)
                        ?.last_message || "İlk çalışma zamanınızı belirleyin."}
                    </p>
                  </>
                )}
              </div>
              {match.direction === "received" && match.status === "pending" ? (
                <span className="peer-actions">
                  <button
                    disabled={peerBusy}
                    onClick={() => void respond(match, true)}
                  >
                    Kabul et
                  </button>
                  <button
                    disabled={peerBusy}
                    onClick={() => void respond(match, false)}
                  >
                    Reddet
                  </button>
                </span>
              ) : match.status === "accepted" ? (
                <button onClick={() => setActiveChat(match)}>
                  Mesajlaş{" "}
                  {Number(
                    threads.find((t) => t.context_id === match.id)
                      ?.unread_count,
                  ) > 0 && (
                    <span className="qc-nav-badge">
                      {
                        threads.find((t) => t.context_id === match.id)
                          ?.unread_count
                      }
                    </span>
                  )}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {activeChat && (
        <PeerChat
          match={activeChat}
          userId={userId}
          onClose={() => setActiveChat(null)}
          onRead={onRead}
          presence={presence}
        />
      )}
      <QuranStudyGroup
        userId={userId}
        realUser={realUser}
        peers={matches
          .filter((m) => m.status === "accepted")
          .map((m) => ({ id: m.partner_id, name: m.partner_name }))}
      />
      {requestTarget && (
        <QuranModal
          label="Kur'an kardeşliği isteği"
          onClose={() => {
            if (!peerBusy) setRequestTarget(null);
          }}
          className="qc-social-modal"
        >
          <header>
            <AvatarImage
              src={avatar(requestTarget.display_name, requestTarget.avatar_url)}
              size={64}
            />
            <div>
              <h2>{requestTarget.display_name}</h2>
              <p>Gönüllü akran desteği · {requestTarget.xp} deneyim puanı</p>
            </div>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void request(requestTarget);
            }}
          >
            <label>
              Tanışma notun{" "}
              <textarea
                maxLength={400}
                rows={4}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hangi sureyi veya konuyu birlikte çalışmak istersin?"
              />
            </label>
            <small>
              {requestMessage.length}/400 · Kişisel iletişim bilgilerini
              paylaşma.
            </small>
            {peerError && (
              <p role="alert" className="booking-error">
                {peerError}
              </p>
            )}
            <footer>
              <button
                type="button"
                disabled={peerBusy}
                onClick={() => setRequestTarget(null)}
              >
                Vazgeç
              </button>
              <button className="primary-button" disabled={peerBusy}>
                {peerBusy ? "Gönderiliyor…" : "İstek gönder"}
              </button>
            </footer>
          </form>
        </QuranModal>
      )}
    </section>
  );
}
