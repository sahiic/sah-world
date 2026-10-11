"use client";
import AppointmentChat from "@/components/core/AppointmentChat";
import AppointmentReview from "@/components/core/AppointmentReview";
import EmptyState from "@/components/quran/QuranEmptyState";
import QuranTeacherFeedback from "@/components/quran/QuranTeacherFeedback";
import { type QuranPresenceState } from "@/components/quran/useQuranPresence";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { appointmentCalendar, istanbulDay, quranWeek } from "@/lib/quranSocial";
import { supabase } from "@/lib/supabase";
import { isValidUUID } from "@/store/useJourneyStore";
import type { HocaProfileRow, QuranThreadSummary } from "@/types/database";
import { useState } from "react";

import BookingFlow from "./BookingFlow";
import {
  STATUS_LABELS,
  avatar,
  formatAppointment,
  timeOnly,
  type AppointmentView,
} from "./companionShared";
interface AppointmentsViewProps {
  appointments: AppointmentView[];
  userId: string;
  onReload: () => Promise<void>;
  onReminders: () => void;
  onNotice: (message: string) => void;
  teachers: HocaProfileRow[];
  threads: QuranThreadSummary[];
  onRead: () => void;
  presence: QuranPresenceState;
}

export default function AppointmentsView({
  appointments,
  userId,
  onReload,
  onReminders,
  onNotice,
  teachers,
  threads,
  onRead,
  presence,
}: AppointmentsViewProps) {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [reviewAppointment, setReviewAppointment] =
    useState<AppointmentView | null>(null);
  const [feedbackAppointment, setFeedbackAppointment] =
    useState<AppointmentView | null>(null);
  const [chatAppointment, setChatAppointment] =
    useState<AppointmentView | null>(null);
  const [now] = useState(() => Date.now());
  const [reschedule, setReschedule] = useState<AppointmentView | null>(null);
  const [weekView, setWeekView] = useState(false),
    [weekOffset, setWeekOffset] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const weekDays = quranWeek(new Date(now), weekOffset);
  const items = appointments
    .filter((item) =>
      filter === "upcoming"
        ? ["pending", "confirmed"].includes(item.status) &&
          new Date(item.scheduled_end).getTime() > now
        : !["pending", "confirmed"].includes(item.status) ||
          new Date(item.scheduled_end).getTime() <= now,
    )
    .sort((a, b) =>
      filter === "upcoming"
        ? a.scheduled_start.localeCompare(b.scheduled_start)
        : b.scheduled_start.localeCompare(a.scheduled_start),
    );
  const cancel = async (item: AppointmentView) => {
    if (item.is_demo) {
      onNotice("Örnek randevu canlı sunucuya yazılmaz.");
      return;
    }
    if (busyId) return;
    if (!window.confirm("Bu randevuyu iptal etmek istediğine emin misin?"))
      return;
    setBusyId(item.id);
    setActionError("");
    const { error } = await supabase.rpc("cancel_hoca_appointment", {
      target_appointment_id: item.id,
      reason: "Kullanıcı tarafından iptal edildi.",
    });
    setBusyId("");
    if (error)
      setActionError(
        error.message.includes("CANCELLATION_WINDOW")
          ? "Randevuya 2 saatten az kaldığı için uygulamadan iptal edilemez."
          : "Randevu iptal edilemedi.",
      );
    else await onReload();
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading split">
        <div>
          <span className="eyebrow">PROGRAMIN</span>
          <h2>Randevularım</h2>
          <p>
            Yaklaşan görüşmelerini ve tamamlanan çalışma geçmişini tek yerde
            izle.
          </p>
        </div>
        <button className="secondary-button" onClick={onReminders}>
          <AppIcon name="bell" /> 30 dk önce hatırlat
        </button>
      </header>
      <div className="appointment-toggle">
        <button
          className={filter === "upcoming" ? "active" : ""}
          onClick={() => setFilter("upcoming")}
        >
          Yaklaşan
        </button>
        <button
          className={filter === "past" ? "active" : ""}
          onClick={() => setFilter("past")}
        >
          Geçmiş
        </button>
      </div>
      <div className="qc-appointment-tools">
        <button
          className="secondary-button"
          aria-pressed={weekView}
          onClick={() => setWeekView((v) => !v)}
        >
          <AppIcon name="calendar" />
          {weekView ? "Liste görünümü" : "Haftalık takvim"}
        </button>
      </div>
      {actionError && (
        <p role="alert" className="booking-error">
          {actionError}
        </p>
      )}
      {weekView && (
        <section
          className="qc-week-calendar"
          aria-label="Haftalık ders takvimi"
        >
          <header>
            <button
              aria-label="Önceki hafta"
              onClick={() => setWeekOffset((v) => v - 1)}
            >
              ←
            </button>
            <strong>
              {weekDays[0].toLocaleDateString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "long",
              })}{" "}
              –{" "}
              {weekDays[6].toLocaleDateString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "long",
              })}
            </strong>
            <button
              aria-label="Sonraki hafta"
              onClick={() => setWeekOffset((v) => v + 1)}
            >
              →
            </button>
          </header>
          <div>
            {weekDays.map((day) => (
              <section key={istanbulDay(day)}>
                <h3>
                  {day.toLocaleDateString("tr-TR", {
                    timeZone: "Europe/Istanbul",
                    weekday: "short",
                    day: "numeric",
                  })}
                </h3>
                {items
                  .filter(
                    (a) =>
                      new Date(a.scheduled_start).toLocaleDateString("en-CA", {
                        timeZone: "Europe/Istanbul",
                      }) === istanbulDay(day),
                  )
                  .map((a) => (
                    <button
                      key={a.id}
                      className={`qc-calendar-lesson ${a.status}`}
                      onClick={() => setChatAppointment(a)}
                    >
                      {timeOnly(a.scheduled_start)}
                      <strong>
                        {a.student_id === userId ? a.hoca_name : a.student_name}
                      </strong>
                      <small>{STATUS_LABELS[a.status]}</small>
                    </button>
                  ))}
              </section>
            ))}
          </div>
        </section>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon="calendar-smile"
          title={
            filter === "upcoming"
              ? "Yaklaşan randevun yok"
              : "Henüz geçmiş randevu yok"
          }
          text="Uygun olduğunda yeni bir çalışma saati seçebilirsin."
        />
      ) : (
        <div className="appointment-list">
          {items.map((item) => {
            const asHoca = item.student_id !== userId;
            return (
              <article key={item.id}>
                <time>
                  <strong>
                    {new Date(item.scheduled_start).toLocaleDateString(
                      "tr-TR",
                      { day: "2-digit", timeZone: "Europe/Istanbul" },
                    )}
                  </strong>
                  <span>
                    {new Date(item.scheduled_start).toLocaleDateString(
                      "tr-TR",
                      { month: "short", timeZone: "Europe/Istanbul" },
                    )}
                  </span>
                </time>
                <AvatarImage
                  src={avatar(
                    asHoca ? item.student_name : item.hoca_name,
                    asHoca ? item.student_avatar : item.hoca_photo,
                  )}
                  alt=""
                  size={48}
                />
                <div>
                  <span className={`appointment-status ${item.status}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                  <h3>{asHoca ? item.student_name : item.hoca_name}</h3>
                  <p>
                    {formatAppointment(item.scheduled_start)} ·{" "}
                    {Math.round(
                      (new Date(item.scheduled_end).getTime() -
                        new Date(item.scheduled_start).getTime()) /
                        60_000,
                    )}{" "}
                    dk
                  </p>
                  {item.topic_notes && (
                    <blockquote>“{item.topic_notes}”</blockquote>
                  )}
                </div>
                <div className="appointment-actions">
                  {["confirmed", "completed"].includes(item.status) && (
                    <button onClick={() => setChatAppointment(item)}>
                      <AppIcon name="message" /> Mesajlaş{" "}
                      {Number(
                        threads.find((t) => t.context_id === item.id)
                          ?.unread_count,
                      ) > 0 && (
                        <span className="qc-nav-badge">
                          {
                            threads.find((t) => t.context_id === item.id)
                              ?.unread_count
                          }
                        </span>
                      )}
                    </button>
                  )}
                  {item.status === "completed" && (
                    <button onClick={() => setReviewAppointment(item)}>
                      <AppIcon name="notes" /> Ders Notu
                    </button>
                  )}
                  {item.status === "completed" &&
                    item.student_id === userId &&
                    !item.is_demo &&
                    isValidUUID(userId) && (
                      <button onClick={() => setFeedbackAppointment(item)}>
                        Hocaya yorum bırak
                      </button>
                    )}
                  {!asHoca &&
                    ["pending", "confirmed"].includes(item.status) && (
                      <button
                        disabled={busyId === item.id || item.is_demo}
                        onClick={() => {
                          if (!teachers.some((t) => t.id === item.hoca_id)) {
                            setActionError("Hoca bilgileri yüklenemedi.");
                            return;
                          }
                          setReschedule(item);
                        }}
                      >
                        <AppIcon name="calendar" />
                        Yeniden planla
                      </button>
                    )}
                  {["pending", "confirmed"].includes(item.status) && (
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(
                          new Blob([appointmentCalendar(item)], {
                            type: "text/calendar;charset=utf-8",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `kuran-randevu-${istanbulDay(item.scheduled_start)}.ics`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      <AppIcon name="download" />
                      Takvime ekle
                    </button>
                  )}
                  {["pending", "confirmed"].includes(item.status) && (
                    <button
                      className="danger"
                      disabled={busyId === item.id}
                      onClick={() => void cancel(item)}
                    >
                      İptal et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {reviewAppointment && (
        <AppointmentReview
          appointment={reviewAppointment}
          isHoca={reviewAppointment.student_id !== userId}
          userId={userId}
          onClose={() => setReviewAppointment(null)}
          onSaved={() => {
            setReviewAppointment(null);
            onNotice("Ders notu kaydedildi.");
          }}
        />
      )}
      {chatAppointment && (
        <AppointmentChat
          appointment={chatAppointment}
          currentUserId={userId}
          isHoca={chatAppointment.student_id !== userId}
          presence={presence}
          onRead={onRead}
          onClose={() => setChatAppointment(null)}
        />
      )}
      {feedbackAppointment && (
        <QuranTeacherFeedback
          appointment={feedbackAppointment}
          userId={userId}
          onClose={() => setFeedbackAppointment(null)}
        />
      )}
      {reschedule && (
        <BookingFlow
          teacher={teachers.find((t) => t.id === reschedule.hoca_id)!}
          reschedule={reschedule}
          realUser={!reschedule.is_demo && isValidUUID(userId)}
          onClose={() => setReschedule(null)}
          onBooked={async () => {
            await onReload();
            onNotice("Dersin yeni saati onaylandı.");
          }}
        />
      )}
    </section>
  );
}
