"use client";
import QuranModal from "@/components/quran/QuranModal";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { supabase } from "@/lib/supabase";
import type { HocaProfileRow } from "@/types/database";
import { useEffect, useRef, useState } from "react";

import {
  DAYS,
  avatar,
  dateKey,
  formatAppointment,
  timeOnly,
  type AppointmentView,
} from "./companionShared";
interface BookingFlowProps {
  teacher: HocaProfileRow;
  onClose: () => void;
  onBooked: () => Promise<void>;
  realUser: boolean;
  reschedule?: AppointmentView;
}

export default function BookingFlow({
  teacher,
  onClose,
  onBooked,
  realUser,
  reschedule,
}: BookingFlowProps) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [availableDays, setAvailableDays] = useState<Record<string, number>>(
    {},
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<
    Array<{ slot_start: string; slot_end: string }>
  >([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState(reschedule?.topic_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const slotVersion = useRef(0),
    bookingLock = useRef(false);

  useEffect(() => {
    let active = true;
    slotVersion.current++;
    if (!realUser) {
      const result: Record<string, number> = {};
      for (
        let d = 1;
        d <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        d += 1
      ) {
        const date = new Date(month.getFullYear(), month.getMonth(), d);
        if ([1, 3, 6].includes(date.getDay()) && date > new Date())
          result[dateKey(date)] = 4;
      }
      const timer = window.setTimeout(() => setAvailableDays(result), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void supabase
        .rpc("get_hoca_available_days", {
          target_hoca_id: teacher.id,
          month_date: dateKey(month),
        })
        .then(({ data, error }) => {
          if (!active) return;
          setSelectedDate("");
          setSelectedSlot("");
          setSlots([]);
          if (error) setError("Müsait günler yüklenemedi. Yeniden açıp dene.");
          setAvailableDays(
            Object.fromEntries(
              (data || []).map((item) => [
                item.available_date,
                Number(item.slot_count),
              ]),
            ),
          );
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      // Invalidate the previous month's slot requests, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      slotVersion.current++;
    };
  }, [month, realUser, teacher.id]);

  const chooseDate = async (key: string) => {
    const version = ++slotVersion.current;
    setSelectedDate(key);
    setSelectedSlot("");
    setBusy(true);
    if (!realUser) {
      setSlots(
        ["10:00", "10:30", "11:00", "11:30"].map((time) => {
          const start = new Date(`${key}T${time}:00+03:00`);
          return {
            slot_start: start.toISOString(),
            slot_end: new Date(start.getTime() + 30 * 60_000).toISOString(),
          };
        }),
      );
      setBusy(false);
      return;
    }
    const { data, error: slotError } = await supabase.rpc(
      "get_hoca_available_slots",
      { target_hoca_id: teacher.id, target_date: key },
    );
    if (version !== slotVersion.current) return;
    setSlots(data || []);
    setError(slotError ? "Saatler yüklenemedi." : "");
    setBusy(false);
  };
  const confirm = async () => {
    if (bookingLock.current) return;
    if (!selectedSlot || !realUser || teacher.is_placeholder) {
      if (!realUser)
        setError("Canlı randevu oluşturmak için gerçek hesabınla giriş yap.");
      if (teacher.is_placeholder)
        setError("Örnek profil ile canlı randevu oluşturulmaz.");
      return;
    }
    bookingLock.current = true;
    setBusy(true);
    setError("");
    const { error: bookingError } = reschedule
      ? await supabase.rpc("reschedule_hoca_appointment", {
          target_appointment_id: reschedule.id,
          new_start: selectedSlot,
          new_notes: notes,
        })
      : await supabase.rpc("book_hoca_appointment", {
          target_hoca_id: teacher.id,
          target_start: selectedSlot,
          notes,
        });
    if (bookingError) {
      setError(
        bookingError.message.includes("SLOT_UNAVAILABLE")
          ? "Bu saat az önce doldu."
          : bookingError.message.includes("CANCELLATION_WINDOW")
            ? "Randevuya 2 saatten az kaldı. Hocanla iletişim kur."
            : "Randevu oluşturulamadı. Mevcut randevun korunuyor.",
      );
      setBusy(false);
      bookingLock.current = false;
      await chooseDate(selectedDate);
      return;
    }
    bookingLock.current = false;
    await onBooked();
    onClose();
  };
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const calendar = [
    ...Array(new Date(month.getFullYear(), month.getMonth(), 1).getDay()).fill(
      null,
    ),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
  return (
    <QuranModal
      onClose={onClose}
      label={`${teacher.display_name} randevu`}
      className="booking-modal"
    >
      <>
        <button className="modal-close" onClick={onClose} aria-label="Kapat">
          <AppIcon name="x" />
        </button>
        <aside>
          <AvatarImage
            src={avatar(teacher.display_name, teacher.photo_url)}
            alt={`${teacher.display_name} profil fotoğrafı`}
            size={120}
          />
          <span className="eyebrow">{teacher.title}</span>
          <h2 id="booking-title">{teacher.display_name}</h2>
          {reschedule && (
            <p className="qc-reschedule-info">
              Yeniden planlanacak ders:{" "}
              {formatAppointment(reschedule.scheduled_start)}. Yeni saat
              onaylanana kadar mevcut ders korunur.
            </p>
          )}
          <p>{teacher.bio}</p>
          <div className="hoca-tags">
            {teacher.specialties.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <small>
            <AppIcon name="clock" /> Saatler Türkiye saatiyle gösterilir.
          </small>
        </aside>
        <div className="booking-calendar">
          <header>
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              aria-label="Önceki ay"
            >
              <AppIcon name="chevron-left" />
            </button>
            <strong>
              {month.toLocaleDateString("tr-TR", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              aria-label="Sonraki ay"
            >
              <AppIcon name="chevron-right" />
            </button>
          </header>
          <div className="calendar-weekdays">
            {DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="booking-days">
            {calendar.map((date, index) =>
              date ? (
                <button
                  key={date.toISOString()}
                  disabled={!availableDays[dateKey(date)]}
                  className={selectedDate === dateKey(date) ? "selected" : ""}
                  onClick={() => void chooseDate(dateKey(date))}
                >
                  <span>{date.getDate()}</span>
                  {availableDays[dateKey(date)] ? (
                    <i>{availableDays[dateKey(date)]}</i>
                  ) : null}
                </button>
              ) : (
                <i key={`blank-${index}`} />
              ),
            )}
          </div>
        </div>
        <div className="booking-slots">
          <span className="eyebrow">
            {selectedDate
              ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "tr-TR",
                  { day: "numeric", month: "long" },
                )
              : "ÖNCE BİR GÜN SEÇ"}
          </span>
          <h3>Uygun saatler</h3>
          {busy ? (
            <div className="slot-loading">Saatler hazırlanıyor…</div>
          ) : selectedDate && slots.length === 0 ? (
            <p>Bu gün için uygun saat kalmadı.</p>
          ) : (
            <div className="slot-list">
              {slots.map((slot) => (
                <button
                  key={slot.slot_start}
                  className={selectedSlot === slot.slot_start ? "selected" : ""}
                  onClick={() => setSelectedSlot(slot.slot_start)}
                >
                  {timeOnly(slot.slot_start)}
                  {selectedSlot === slot.slot_start && <AppIcon name="check" />}
                </button>
              ))}
            </div>
          )}
          {selectedSlot && (
            <label className="booking-note">
              <span>Bugün ne üzerinde çalışmak istersin?</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={600}
                placeholder="Örn. Tecvid kuralları, ezber tekrarı…"
              />
            </label>
          )}
          {error && <p className="booking-error">{error}</p>}
          <button
            className="primary-button booking-confirm"
            disabled={!selectedSlot || busy}
            onClick={() => void confirm()}
          >
            <AppIcon name="calendar-check" />{" "}
            {reschedule ? "Yeni saati onayla" : "Randevuyu onayla"}
          </button>
          <small className="booking-policy">
            Randevu anında onaylanır. Başlangıçtan 2 saat öncesine kadar
            ücretsiz iptal edebilirsin.
          </small>
        </div>
      </>
    </QuranModal>
  );
}
