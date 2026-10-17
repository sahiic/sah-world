"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { QuranLevel, QuranThreadSummary } from "@/types/database";
import type { QuranPresenceState } from "../useQuranPresence";
import type { HelperView, PeerView } from "../companionShared";
import PeerChat from "../PeerChat";
import QuranStudyGroup from "../QuranStudyGroup";
import QuranModal from "../QuranModal";
import { usePeerMatching } from "./usePeerMatching";
import PeerOnboarding from "./PeerOnboarding";
import PeerDiscovery from "./PeerDiscovery";
import PeerActiveMatch from "./PeerActiveMatch";
import PeerMatchTimeline from "./PeerMatchTimeline";
import {
  emptyProfile,
  hasContact,
  peerError,
  type PeerCandidate,
} from "./peerMatchingUtils";
export type PeerMatchingProps = {
  helpers: HelperView[];
  matches: PeerView[];
  level: QuranLevel | null;
  userId: string;
  realUser: boolean;
  onReload: () => Promise<void>;
  threads: QuranThreadSummary[];
  onRead: () => void;
  presence: QuranPresenceState;
};
export default function PeerMatchingView(props: PeerMatchingProps) {
  const model = usePeerMatching(props);
  const [editing, setEditing] = useState(false),
    [selectedTab, setTab] = useState<"discover" | "matches" | null>(null),
    [chat, setChat] = useState<PeerView | null>(null),
    [target, setTarget] = useState<{
      id: string;
      name: string;
      candidate?: PeerCandidate;
    } | null>(null),
    [note, setNote] = useState(""),
    [requestBusy, setRequestBusy] = useState(false);
  const active = props.matches.find((m) =>
    ["accepted", "pending"].includes(m.status),
  );
  const tab = selectedTab ?? (active ? "matches" : "discover");
  async function request() {
    if (!target || requestBusy) return;
    if (hasContact(note)) {
      model.setError("İletişim bilgisi paylaşmadan bir tanışma notu yaz.");
      return;
    }
    setRequestBusy(true);
    try {
      if (target.candidate) {
        if (await model.request(target.candidate, note)) {
          setTarget(null);
          setTab("matches");
        }
      } else {
        const r = await supabase.rpc("send_quran_peer_request", {
          target_helper_id: target.id,
          request_message: note,
        });
        if (r.error) throw r.error;
        setTarget(null);
        setTab("matches");
        await props.onReload();
      }
    } catch (e) {
      model.setError(peerError(e));
    } finally {
      setRequestBusy(false);
    }
  }
  const openRequest = (c: PeerCandidate) => {
    setTarget({ id: c.user_id, name: c.display_name, candidate: c });
    setNote("Birlikte Kur’an çalışmak isterim.");
    model.setError("");
  };
  return (
    <section className="peer-v2" aria-label="Kur’an kardeşliği">
      <header className="peer-hero">
        <div>
          <span className="peer-eyebrow">KUR’AN KARDEŞİ</span>
          <h2>
            Birlikte öğren.
            <br />
            <em>Birbirine iyi gel.</em>
          </h2>
          <p>
            Seviyene, hedefine ve zamanına uyumlu bir yol arkadaşı. Küçük
            çalışmalar, paylaşılan bir istikrar.
          </p>
          <div className="peer-hero-tags">
            <span>Karşılıklı rıza</span>
            <span>Bire bir eşleşme</span>
            <span>Uygulama içi iletişim</span>
          </div>
        </div>
        <aside>
          <span className="peer-hero-symbol" aria-hidden="true">
            ◒
          </span>
          <strong>Bir ayetle başlar.</strong>
          <p>
            Ortak bir zaman belirleyin, birlikte çalışın ve ilerlemenizi görün.
          </p>
          {props.realUser && model.available && (
            <button onClick={() => setEditing(true)}>
              {model.profile
                ? "Profilimi düzenle"
                : "Eşleşme profilimi oluştur"}
            </button>
          )}
        </aside>
      </header>
      {model.error && (
        <p className="peer-alert" role="alert">
          {model.error}{" "}
          <button onClick={() => void model.reload()}>Yeniden dene</button>
        </p>
      )}
      {model.notice && (
        <p className="peer-notice" role="status">
          {model.notice}
        </p>
      )}
      {!props.realUser && (
        <p className="peer-empty">
          Profil oluşturmak ve eşleşmek için hesabınla giriş yap.
        </p>
      )}
      {model.loading && <p role="status">Eşleşme alanın hazırlanıyor…</p>}
      {editing && (
        <PeerOnboarding
          initial={model.profile || emptyProfile(props.level)}
          busy={model.busy}
          onCancel={() => setEditing(false)}
          onSave={async (p) => {
            const saved = await model.save(p);
            if (saved) setEditing(false);
            return saved;
          }}
        />
      )}
      {!editing && props.realUser && model.available && !model.profile && (
        <div className="peer-empty">
          <h3>Seninle aynı ritmi arayan biri olabilir.</h3>
          <p>
            Henüz eşleşme profilin yok. İki dakikada oluştur; hedefini ve
            müsaitliğini paylaş.
          </p>
          <button className="peer-primary" onClick={() => setEditing(true)}>
            Profilimi oluştur
          </button>
        </div>
      )}
      <nav className="peer-tabs" aria-label="Kardeşlik görünümü">
        <button
          aria-pressed={tab === "discover"}
          onClick={() => setTab("discover")}
        >
          Keşfet
        </button>
        <button
          aria-pressed={tab === "matches"}
          onClick={() => setTab("matches")}
        >
          Kardeşliğim {active ? "· 1" : ""}
        </button>
      </nav>
      {tab === "discover" && (
        <>
          {model.profile && (
            <>
              <section className="peer-queue">
                <div>
                  <h3>
                    {active
                      ? active.status === "pending" ? "Yanıt bekleyen bir isteğin var" : "Devam eden bir kardeşliğin var"
                      : model.queueAt
                        ? "Uyumlu kardeşin aranıyor"
                        : "Bırak, ortak yönleriniz sizi buluştursun."}
                  </h3>
                  <p>
                    {active
                      ? "Sohbetini ve çalışma alanını Kardeşliğim bölümünden açabilirsin."
                      : model.queueAt
                        ? "Otomatik eşleşme için diğer kişinin de aramaya katılması gerekir. Beklerken aşağıdaki bir adaya tanışma isteği gönderebilirsin."
                        : "Otomatik aramaya katıl veya aşağıdaki bir adaya tanışma isteği gönder. Kardeşlik, iki tarafın da onayıyla başlar."}
                  </p>
                </div>
                {active ? (
                  <button onClick={() => setTab("matches")}>
                    Kardeşliğime git
                  </button>
                ) : model.queueAt ? (
                  <button
                    disabled={model.busy}
                    onClick={() => void model.leaveQueue()}
                  >
                    Aramayı durdur
                  </button>
                ) : (
                  <button
                    className="peer-primary"
                    disabled={model.busy || !model.profile.discoverable}
                    onClick={async () => { if (await model.join()) setTab(null); }}
                  >
                    {model.busy ? "Aranıyor…" : "Uyumlu kardeş bul"}
                  </button>
                )}
              </section>
              {!model.profile.discoverable && (
                <p className="peer-notice">
                  Profilin keşfe kapalı. Eşleşmek için profilini düzenleyip
                  görünürlüğü aç.
                </p>
              )}
              <PeerDiscovery
                candidates={model.candidates}
                profile={model.profile}
                disabled={
                  model.busy ||
                  !!active ||
                  !model.profile.discoverable
                }
                onRequest={openRequest}
              />
            </>
          )}
          {props.helpers.filter(
            (h) => !model.candidates.some((c) => c.user_id === h.id),
          ).length > 0 && (
            <details className="peer-legacy">
              <summary>Diğer gönüllü destekçiler</summary>
              <p>
                Bu kişiler henüz yeni eşleşme profilini tamamlamadı; uyum puanı
                gösterilmez.
              </p>
              {props.helpers
                .filter(
                  (h) => !model.candidates.some((c) => c.user_id === h.id),
                )
                .map((h) => (
                  <article key={h.id}>
                    <strong>{h.display_name}</strong>
                    <span>Gönüllü akran desteği</span>
                    <button
                      disabled={
                        !props.realUser ||
                        !!active ||
                        !!model.queueAt ||
                        model.busy
                      }
                      onClick={() => {
                        setTarget({ id: h.id, name: h.display_name });
                        setNote("Birlikte Kur’an çalışmak isterim.");
                      }}
                    >
                      İstek gönder
                    </button>
                  </article>
                ))}
            </details>
          )}
        </>
      )}
      {tab === "matches" && (
        <div className="peer-matches">
          {props.matches.length === 0 && (
            <div className="peer-empty">
              <h3>Henüz eşleşmen yok</h3>
              <p>Gönderdiğin ve sana gelen istekler burada görünür.</p>
              <button onClick={() => setTab("discover")}>
                Kardeşleri keşfet
              </button>
            </div>
          )}
          {props.matches.map((m) =>
            m.status === "accepted" ? (
              <PeerActiveMatch
                key={m.id}
                match={m}
                userId={props.userId}
                unread={Number(
                  props.threads.find((t) => t.context_id === m.id)
                    ?.unread_count || 0,
                )}
                onChat={() => setChat(m)}
                onEnd={() => {
                  if (
                    window.confirm("Bu kardeşliği sonlandırmak istiyor musun?")
                  )
                    void model.end(m);
                }}
              />
            ) : (
              <article className="peer-request" key={m.id}>
                <header>
                  <h3>{m.partner_name}</h3>
                  <span>
                    {m.status === "pending"
                      ? "Yanıt bekleniyor"
                      : m.status === "cancelled"
                        ? "Sonlandırıldı"
                        : "İstek kabul edilmedi"}
                  </span>
                </header>
                {m.message && <p>{m.message}</p>}
                <PeerMatchTimeline status={m.status} />
                {m.direction === "received" && m.status === "pending" && (
                  <footer>
                    <button
                      className="peer-primary"
                      disabled={model.busy}
                      onClick={() => void model.respond(m, true)}
                    >
                      Kabul et
                    </button>
                    <button
                      disabled={model.busy}
                      onClick={() => void model.respond(m, false)}
                    >
                      Reddet
                    </button>
                  </footer>
                )}
                {m.direction === "sent" && m.status === "pending" && (
                  <footer><button disabled={model.busy} onClick={() => void model.end(m)}>İsteği geri çek</button></footer>
                )}
              </article>
            ),
          )}
        </div>
      )}
      <QuranStudyGroup
        userId={props.userId}
        realUser={props.realUser}
        peers={props.matches
          .filter((m) => m.status === "accepted")
          .map((m) => ({ id: m.partner_id, name: m.partner_name }))}
      />
      {chat && (
        <PeerChat
          match={chat}
          userId={props.userId}
          onClose={() => setChat(null)}
          onRead={props.onRead}
          presence={props.presence}
        />
      )}
      {target && (
        <QuranModal
          label="Kur’an kardeşliği isteği"
          className="qc-social-modal peer-v2 peer-request-modal"
          onClose={() => {
            if (!requestBusy) setTarget(null);
          }}
        >
          <h2>{target.name} ile tanış</h2>
          <p>Hedefini ve birlikte çalışmak istediğin konuyu kısaca paylaş.</p>
          {model.queueAt && <p className="peer-notice">İstek gönderildiğinde otomatik arama durur. Karşı taraf kabul edince kardeşliğiniz başlar.</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void request();
            }}
          >
            <label>
              Tanışma notun
              <textarea
                maxLength={400}
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <small>
              {note.length}/400 · Kişisel iletişim bilgisi paylaşma.
            </small>
            {model.error && <p role="alert">{model.error}</p>}
            <footer>
              <button
                type="button"
                disabled={requestBusy}
                onClick={() => setTarget(null)}
              >
                Vazgeç
              </button>
              <button
                className="peer-primary"
                disabled={requestBusy || model.busy}
              >
                İstek gönder
              </button>
            </footer>
          </form>
        </QuranModal>
      )}
    </section>
  );
}
