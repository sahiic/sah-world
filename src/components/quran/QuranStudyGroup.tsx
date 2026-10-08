"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import QuranModal from "./QuranModal";
import QuranChat from "./QuranChat";
import { supabase } from "@/lib/supabase";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import { SURAHS } from "@/lib/quranSurahs";
import type {
  QuranStudyRoomRow,
  QuranStudyRoomMemberRow,
} from "@/types/database";
export default function QuranStudyGroup({
  userId,
  realUser,
  peers,
}: {
  userId: string;
  realUser: boolean;
  peers: Array<{ id: string; name: string }>;
}) {
  const [rooms, setRooms] = useState<QuranStudyRoomRow[]>([]),
    [members, setMembers] = useState<QuranStudyRoomMemberRow[]>([]);
  const [creating, setCreating] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [name, setName] = useState(""),
    [surah, setSurah] = useState(1),
    [first, setFirst] = useState(1),
    [last, setLast] = useState(7),
    [time, setTime] = useState("");
  const [invitees, setInvitees] = useState<string[]>([]),
    [activeRoom, setActiveRoom] = useState<QuranStudyRoomRow | null>(null);
  const lock = useRef(false),
    version = useRef(0);
  const load = useCallback(async () => {
    if (!realUser) return;
    const token = ++version.current;
    const [r, m] = await Promise.all([
      supabase
        .from("quran_study_rooms")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("quran_study_room_members").select("*"),
    ]);
    if (token !== version.current) return;
    if (r.error || m.error) {
      setError(
        "Çalışma odası altyapısı henüz hazır değil veya bağlantı kurulamadı.",
      );
      return;
    }
    setRooms(r.data ?? []);
    setMembers(m.data ?? []);
    setError("");
  }, [realUser]);
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    if (!realUser) return () => clearTimeout(timer);
    const channel = ownedRealtimeChannel(supabase, `quran-rooms-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quran_study_room_members" },
        () => void load(),
      )
      .subscribe();
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const fallback = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearTimeout(timer);
      clearInterval(fallback);
      document.removeEventListener("visibilitychange", refresh);
      // Invalidate pending responses; this is a request generation, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      version.current++;
      void supabase.removeChannel(channel);
    };
  }, [load, realUser, userId]);
  const create = async () => {
    if (lock.current || !realUser) return;
    if (
      !invitees.length ||
      last < first ||
      last > SURAHS[surah - 1].ayahCount
    ) {
      setError("En az bir eşleştiğin kardeşi ve geçerli bir ayet aralığı seç.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    const result = await supabase.rpc("create_quran_study_room", {
      room_name: name,
      target_surah: surah,
      first_ayah: first,
      last_ayah: last,
      invited_users: invitees,
      study_time: time ? new Date(`${time}:00+03:00`).toISOString() : null,
    });
    lock.current = false;
    setBusy(false);
    if (result.error) {
      setError(
        "Oda oluşturulamadı. En fazla 5 kişi ve yalnızca kabul edilmiş eşleşmeler seçilebilir.",
      );
      return;
    }
    setCreating(false);
    setName("");
    setInvitees([]);
    setTime("");
    await load();
  };
  const respond = async (room: QuranStudyRoomRow, accept: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    const { error: e } = await supabase.rpc("respond_quran_room_invite", {
      target_room: room.id,
      accept_invite: accept,
    });
    lock.current = false;
    setBusy(false);
    if (e)
      setError(
        "Davet yanıtlanamadı. Oda dolu veya üyelik sınırına ulaşılmış olabilir.",
      );
    else await load();
  };
  const leave = async (room: QuranStudyRoomRow) => {
    if (
      !window.confirm(
        "Bu çalışma odasından ayrılmak istiyor musun? Mesajların silinmez.",
      )
    )
      return;
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    const { error: e } = await supabase.rpc("leave_group", {
      target_group_id: room.group_id,
    });
    lock.current = false;
    setBusy(false);
    if (e) setError("Odadan ayrılınamadı.");
    else await load();
  };
  return (
    <section className="qc-study-rooms" aria-label="Grup Kur'an çalışması">
      <header>
        <div>
          <span className="eyebrow">BİRLİKTE BİR HEDEF</span>
          <h3>Çalışma odaları</h3>
          <p>
            2–5 kişilik özel gruplar. Her kardeş davetini kendisi kabul eder.
          </p>
        </div>
        <button
          className="secondary-button"
          disabled={!realUser || !peers.length}
          onClick={() => {
            setCreating(true);
            setError("");
          }}
        >
          <AppIcon name="users" />
          Grup çalışması oluştur
        </button>
      </header>
      {!realUser && <p>Özel çalışma odaları için hesabınla giriş yap.</p>}
      {error && !creating && (
        <p role="alert" className="booking-error">
          {error}
        </p>
      )}
      {realUser && !rooms.length && !error && (
        <div className="qc-room-empty-cta">
          <AppIcon name="users" />
          <strong>Henüz bir çalışma odan yok</strong>
          <p>
            Kur'an kardeşlerinle birlikte çalışmak için bir oda oluştur. Her kardeş davetini kendisi kabul eder.
          </p>
          {peers.length > 0 && (
            <button
              className="primary-button"
              onClick={() => { setCreating(true); setError(""); }}
            >
              <AppIcon name="plus" /> Oda oluştur
            </button>
          )}
        </div>
      )}
      {(() => {
        const pending = rooms.filter((r) =>
          members.some((m) => m.room_id === r.id && m.user_id === userId && m.status === "invited"),
        );
        const active = rooms.filter((r) =>
          !members.some((m) => m.room_id === r.id && m.user_id === userId && m.status === "invited"),
        );
        return (
          <>
            {pending.length > 0 && (
              <>
                <h4 className="subsection-title">Bekleyen davetler</h4>
                <div className="qc-room-grid">
                  {pending.map((room) => (
                    <article key={room.id} className="qc-room-invited">
                      <span className="qc-room-icon"><AppIcon name="mail" /></span>
                      <h4>{room.name}</h4>
                      <p>{SURAHS[room.surah_target - 1].name} · {room.start_ayah}–{room.end_ayah}. ayet</p>
                      {room.scheduled_at && (
                        <time>
                          {new Date(room.scheduled_at).toLocaleString("tr-TR", {
                            timeZone: "Europe/Istanbul", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                          })} · Türkiye saati
                        </time>
                      )}
                      <small>Bekleyen özel davet · Katılınca grup sohbeti açılır.</small>
                      <div>
                        <button className="primary-button" disabled={busy} onClick={() => void respond(room, true)}>
                          Daveti kabul et
                        </button>
                        <button disabled={busy} onClick={() => void respond(room, false)}>Reddet</button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
            {active.length > 0 && (
              <>
                {pending.length > 0 && <h4 className="subsection-title">Aktif odalar</h4>}
                <div className="qc-room-grid">
                  {active.map((room) => (
                    <article key={room.id}>
                      <span className="qc-room-icon"><AppIcon name="book-open" /></span>
                      <h4>{room.name}</h4>
                      <p>{SURAHS[room.surah_target - 1].name} · {room.start_ayah}–{room.end_ayah}. ayet</p>
                      {room.scheduled_at && (
                        <time>
                          {new Date(room.scheduled_at).toLocaleString("tr-TR", {
                            timeZone: "Europe/Istanbul", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                          })} · Türkiye saati
                        </time>
                      )}
                      <small>
                        {members.filter((m) => m.room_id === room.id && m.status === "accepted").length}
                        /{room.max_participants} katılımcı ·{" "}
                        {members.filter((m) => m.room_id === room.id && m.status === "invited").length} davet bekliyor
                      </small>
                      <div>
                        <button className="primary-button" onClick={() => setActiveRoom(room)}>
                          <AppIcon name="message" /> Oda sohbeti
                        </button>
                        {room.creator_id !== userId && (
                          <button disabled={busy} onClick={() => void leave(room)}>Ayrıl</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </>
        );
      })()}
      {activeRoom && (
        <QuranChat
          groupId={activeRoom.group_id}
          contextId={activeRoom.id}
          userId={userId}
          name={activeRoom.name}
          subtitle="Özel Kur'an çalışma odası"
          topic={`${SURAHS[activeRoom.surah_target - 1].name} · ${activeRoom.start_ayah}–${activeRoom.end_ayah}. ayet`}
          readOnly={!activeRoom.is_active}
          onClose={() => setActiveRoom(null)}
        />
      )}
      {creating && (
        <QuranModal
          label="Grup çalışması oluştur"
          onClose={() => {
            if (!busy) setCreating(false);
          }}
          className="qc-social-modal"
        >
          <header>
            <AppIcon name="users" />
            <div>
              <h2>Birlikte çalışacağınız alan</h2>
              <p>Davetler kabul edilmeden kimse sohbete eklenmez.</p>
            </div>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <label>
              Oda adı
              <input
                required
                minLength={2}
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn. Fâtiha tekrar halkası"
              />
            </label>
            <label>
              Çalışılacak sure
              <select
                value={surah}
                onChange={(e) => {
                  const s = Number(e.target.value);
                  setSurah(s);
                  setFirst(1);
                  setLast(SURAHS[s - 1].ayahCount);
                }}
              >
                {SURAHS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="qc-room-ayahs">
              <label>
                İlk ayet
                <input
                  required
                  type="number"
                  min={1}
                  max={SURAHS[surah - 1].ayahCount}
                  value={first}
                  onChange={(e) => setFirst(Number(e.target.value))}
                />
              </label>
              <label>
                Son ayet
                <input
                  required
                  type="number"
                  min={first}
                  max={SURAHS[surah - 1].ayahCount}
                  value={last}
                  onChange={(e) => setLast(Number(e.target.value))}
                />
              </label>
            </div>
            <label>
              Çalışma zamanı · isteğe bağlı, Türkiye saati
              <input
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </label>
            <fieldset>
              <legend>Davet edilecek kardeşler · en fazla 4</legend>
              {peers.map((p) => (
                <label key={p.id} className="qc-room-invite">
                  <input
                    type="checkbox"
                    checked={invitees.includes(p.id)}
                    disabled={!invitees.includes(p.id) && invitees.length >= 4}
                    onChange={(e) =>
                      setInvitees((ids) =>
                        e.target.checked
                          ? [...ids, p.id]
                          : ids.filter((id) => id !== p.id),
                      )
                    }
                  />
                  {p.name}
                </label>
              ))}
            </fieldset>
            {error && (
              <p role="alert" className="booking-error">
                {error}
              </p>
            )}
            <footer>
              <button
                type="button"
                disabled={busy}
                onClick={() => setCreating(false)}
              >
                Vazgeç
              </button>
              <button
                className="primary-button"
                disabled={busy || !invitees.length}
              >
                {busy ? "Oluşturuluyor…" : "Oluştur ve davet et"}
              </button>
            </footer>
          </form>
        </QuranModal>
      )}
    </section>
  );
}
