"use client";
import EmptyState from "@/components/quran/QuranEmptyState";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { supabase } from "@/lib/supabase";
import type {
  HocaAvailabilityRow,
  HocaProfileRow,
  HocaTimeOffRow,
} from "@/types/database";
import { useEffect, useState } from "react";

import {
  DAYS,
  avatar,
  formatAppointment,
  type AppointmentView,
} from "./companionShared";
interface HocaManagementProps {
  teachers: HocaProfileRow[];
  ownedHoca?: HocaProfileRow;
  appointments: AppointmentView[];
  isAdmin: boolean;
  onReload: () => Promise<void>;
}

export default function HocaManagement({
  teachers,
  ownedHoca,
  appointments,
  isAdmin,
  onReload,
}: HocaManagementProps) {
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [managedId, setManagedId] = useState(
    ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : ""),
  );
  const effectiveManagedId =
    managedId || ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : "");
  const managed = teachers.find((item) => item.id === effectiveManagedId);
  const [availability, setAvailability] = useState<HocaAvailabilityRow[]>([]);
  const [timeOff, setTimeOff] = useState<HocaTimeOffRow[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      display_name: string;
      email: string;
      avatar_url: string | null;
      role: "user" | "admin" | "hoca";
    }>
  >([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setScheduleError("Fotoğraf 2 MB'den küçük olmalı.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const loadSchedule = async () => {
    if (!effectiveManagedId) return;
    const [a, t] = await Promise.all([
      supabase
        .from("hoca_availability")
        .select("*")
        .eq("hoca_id", effectiveManagedId)
        .order("day_of_week"),
      supabase
        .from("hoca_time_off")
        .select("*")
        .eq("hoca_id", effectiveManagedId)
        .order("start_datetime"),
    ]);
    setAvailability(a.data || []);
    setTimeOff(t.data || []);
    if (a.error || t.error)
      setScheduleError("Takvim yüklenemedi. Yeniden dene.");
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSchedule();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [effectiveManagedId]); // eslint-disable-line react-hooks/exhaustive-deps
  const searchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data, error } = await supabase.rpc("admin_search_quran_users", {
      search_text: search,
    });
    if (error) {
      setScheduleError("Kullanıcı araması yapılamadı.");
      return;
    }
    setUsers(data || []);
  };
  const setRole = async (id: string, role: "user" | "hoca" | "admin") => {
    if (
      !window.confirm(
        `Bu kullanıcının rolünü ${role === "admin" ? "yönetici" : role === "hoca" ? "hoca" : "öğrenci"} olarak değiştirmek istiyor musun?`,
      )
    )
      return;
    const { error } = await supabase.rpc("admin_set_quran_role", {
      target_user_id: id,
      next_role: role,
    });
    if (error) {
      setScheduleError("Yetki değişikliği kaydedilemedi.");
      return;
    }
    if (!error) {
      const { data } = await supabase.rpc("admin_search_quran_users", {
        search_text: search,
      });
      setUsers(data || []);
      await onReload();
    }
  };
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const fd = new FormData(event.currentTarget);
    let photoUrl: string | null = String(fd.get("photo")) || null;

    if (photoFile) {
      setPhotoUploading(true);
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${managed.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("hoca-photos")
        .upload(path, photoFile, { upsert: true });
      setPhotoUploading(false);
      if (uploadError) {
        setScheduleError(
          "Fotoğraf yüklenemedi. Profil diğer bilgilerle kaydedilecek.",
        );
      } else {
        const { data: publicData } = supabase.storage
          .from("hoca-photos")
          .getPublicUrl(path);
        photoUrl = publicData.publicUrl;
      }
      setPhotoFile(null);
    }

    const { error } = await supabase
      .from("hoca_profiles")
      .update({
        display_name: String(fd.get("name")),
        title: String(fd.get("title")),
        bio: String(fd.get("bio")),
        specialties: String(fd.get("specialties"))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        photo_url: photoUrl,
        is_active: fd.get("active") === "on",
      })
      .eq("id", managed.id);
    if (error) {
      setScheduleError("Profil kaydedilemedi. Formdaki bilgilerin korunuyor.");
      return;
    }
    setScheduleNotice("Profil kaydedildi.");
    setPhotoPreview(null);
    await onReload();
  };
  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const form = event.currentTarget,
      fd = new FormData(form);
    setScheduleError("");
    setScheduleNotice("");
    const start = String(fd.get("start"));
    const end = String(fd.get("end"));
    if (start >= end) {
      setScheduleError("Bitiş saati başlangıç saatinden sonra olmalı.");
      return;
    }
    const { error: availabilityError } = await supabase
      .from("hoca_availability")
      .insert({
        hoca_id: managed.id,
        day_of_week: Number(fd.get("day")),
        start_time: start,
        end_time: end,
        slot_duration_minutes: Number(fd.get("duration")),
        is_recurring: true,
        specific_date: null,
      });
    if (availabilityError) {
      setScheduleError("Müsaitlik kaydedilemedi.");
      return;
    }
    form.reset();
    await loadSchedule();
    setScheduleNotice("Müsaitlik takvime eklendi.");
  };
  const addTimeOff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const form = event.currentTarget,
      fd = new FormData(form);
    const start = new Date(String(fd.get("start"))),
      end = new Date(String(fd.get("end")));
    if (!Number.isFinite(start.getTime()) || start >= end) {
      setScheduleError("İzin bitişi başlangıcından sonra olmalı.");
      return;
    }
    const { error } = await supabase.from("hoca_time_off").insert({
      hoca_id: managed.id,
      start_datetime: new Date(String(fd.get("start"))).toISOString(),
      end_datetime: new Date(String(fd.get("end"))).toISOString(),
      reason: String(fd.get("reason")),
    });
    if (error) {
      setScheduleError("İzin kaydedilemedi.");
      return;
    }
    form.reset();
    await loadSchedule();
  };
  const updateStatus = async (id: string, status: "completed" | "no_show") => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      setScheduleError("Randevu durumu kaydedilemedi.");
      return;
    }
    await onReload();
  };
  return (
    <section className="quran-management">
      {scheduleError && (
        <p className="booking-error" role="alert">
          {scheduleError}
        </p>
      )}
      {scheduleNotice && (
        <p className="manage-success" role="status">
          {scheduleNotice}
        </p>
      )}
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">YETKİLİ ALAN</span>
          <h2>Hoca ve takvim yönetimi</h2>
          <p>
            Profil, haftalık müsaitlik, izin dönemleri ve görüşme durumlarını
            güvenle yönet.
          </p>
        </div>
        {isAdmin && (
          <select
            value={managedId}
            onChange={(event) => setManagedId(event.target.value)}
          >
            {teachers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name}
              </option>
            ))}
          </select>
        )}
      </header>
      {isAdmin && (
        <article className="admin-role-card">
          <header>
            <span>
              <AppIcon name="shield-check" />
            </span>
            <div>
              <small>YALNIZCA YÖNETİCİ</small>
              <h3>Hoca yetkisi ata</h3>
            </div>
          </header>
          <form onSubmit={(event) => void searchUsers(event)}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              minLength={2}
              placeholder="Ad veya e-posta ile ara"
            />
            <button>Ara</button>
          </form>
          {users.map((item) => (
            <div className="admin-user-row" key={item.id}>
              <AvatarImage
                src={avatar(item.display_name, item.avatar_url)}
                size={42}
              />
              <span>
                <strong>{item.display_name}</strong>
                <small>
                  {item.email} ·{" "}
                  <em className={`role-tag role-${item.role}`}>
                    {item.role === "admin"
                      ? "Yönetici"
                      : item.role === "hoca"
                        ? "Hoca"
                        : "Öğrenci"}
                  </em>
                </small>
              </span>
              <span className="admin-role-actions">
                {item.role !== "admin" && (
                  <button
                    className="role-btn hoca"
                    onClick={() =>
                      void setRole(
                        item.id,
                        item.role === "hoca" ? "user" : "hoca",
                      )
                    }
                  >
                    {item.role === "hoca" ? "Hoca kaldır" : "Hoca yap"}
                  </button>
                )}
                {item.role !== "admin" && (
                  <button
                    className="role-btn admin"
                    onClick={() => void setRole(item.id, "admin")}
                  >
                    Admin yap
                  </button>
                )}
              </span>
            </div>
          ))}
        </article>
      )}
      {managed ? (
        <div className="management-grid">
          <form
            className="manage-profile-card"
            key={managed.id}
            onSubmit={(event) => void saveProfile(event)}
          >
            <h3>Hoca profili</h3>
            <label>
              Görünen ad
              <input name="name" defaultValue={managed.display_name} required />
            </label>
            <label>
              Unvan
              <input name="title" defaultValue={managed.title} required />
            </label>
            <label>
              Kısa biyografi
              <textarea name="bio" defaultValue={managed.bio} rows={4} />
            </label>
            <label>
              Uzmanlıklar
              <input
                name="specialties"
                defaultValue={managed.specialties.join(", ")}
              />
            </label>
            <label>
              Fotoğraf yükle
              <input type="file" accept="image/*" onChange={handlePhotoFile} />
            </label>
            {(photoPreview || managed.photo_url) && (
              <div className="hoca-photo-preview">
                <AvatarImage
                  src={photoPreview || managed.photo_url || ""}
                  alt="Fotoğraf önizleme"
                  size={80}
                />
                {photoUploading && <small>Yükleniyor...</small>}
              </div>
            )}
            <label>
              Fotoğraf URL (alternatif)
              <input
                name="photo"
                defaultValue={managed.photo_url || ""}
                placeholder="Veya doğrudan URL yapıştır"
              />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                name="active"
                defaultChecked={managed.is_active}
              />{" "}
              Aktif profilde göster
            </label>
            <button className="primary-button">Profili kaydet</button>
          </form>
          <section className="manage-availability-card">
            <h3>Haftalık müsaitlik</h3>
            <div
              className="qc-week-grid"
              aria-label="Haftalık müsaitlik takvimi"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <article key={day}>
                  <strong>{DAYS[day]}</strong>
                  {availability
                    .filter((a) => a.day_of_week === day)
                    .map((a) => (
                      <span key={a.id}>
                        {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                        <br />
                        {a.slot_duration_minutes} dk
                      </span>
                    ))}
                  {!availability.some((a) => a.day_of_week === day) && (
                    <small>Kapalı</small>
                  )}
                </article>
              ))}
            </div>
            <form onSubmit={(event) => void addAvailability(event)}>
              <select name="day">
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
              <input name="start" type="time" defaultValue="18:00" required />
              <input name="end" type="time" defaultValue="20:00" required />
              <select name="duration" defaultValue="30">
                <option value="20">20 dk</option>
                <option value="30">30 dk</option>
                <option value="40">40 dk</option>
                <option value="45">45 dk</option>
                <option value="60">60 dk</option>
                <option value="90">90 dk</option>
              </select>
              <button>
                <AppIcon name="plus" /> Ekle
              </button>
            </form>
            <div className="availability-list">
              {availability.map((item) => (
                <article key={item.id}>
                  <strong>{DAYS[item.day_of_week]}</strong>
                  <span>
                    {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} ·{" "}
                    {item.slot_duration_minutes} dk
                  </span>
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("hoca_availability")
                        .delete()
                        .eq("id", item.id);
                      if (error) {
                        setScheduleError("Müsaitlik kaldırılamadı.");
                        return;
                      }
                      await loadSchedule();
                    }}
                    aria-label={`${DAYS[item.day_of_week]} müsaitliğini kaldır`}
                  >
                    <AppIcon name="trash" />
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section className="manage-timeoff-card">
            <h3>İzin / kapalı zaman</h3>
            <form onSubmit={(event) => void addTimeOff(event)}>
              <input name="start" type="datetime-local" required />
              <input name="end" type="datetime-local" required />
              <input name="reason" placeholder="Kısa açıklama (isteğe bağlı)" />
              <button>
                <AppIcon name="plus" /> Engelle
              </button>
            </form>
            {timeOff.map((item) => (
              <article key={item.id}>
                <span>
                  <strong>{formatAppointment(item.start_datetime)}</strong>
                  <small>{item.reason || "Müsait değil"}</small>
                </span>
                <button
                  onClick={async () => {
                    const { error } = await supabase
                      .from("hoca_time_off")
                      .delete()
                      .eq("id", item.id);
                    if (error) {
                      setScheduleError("Kapalı zaman kaldırılamadı.");
                      return;
                    }
                    await loadSchedule();
                  }}
                  aria-label="Kapalı zamanı kaldır"
                >
                  <AppIcon name="trash" />
                </button>
              </article>
            ))}
          </section>
          <section className="manage-appointments-card">
            <h3>Yaklaşan öğrenciler</h3>
            {appointments
              .filter(
                (item) =>
                  item.hoca_id === managed.id &&
                  ["pending", "confirmed"].includes(item.status),
              )
              .map((item) => (
                <article key={item.id}>
                  <AvatarImage
                    src={avatar(item.student_name, item.student_avatar)}
                    alt=""
                    size={42}
                  />
                  <span>
                    <strong>{item.student_name}</strong>
                    <small>
                      {formatAppointment(item.scheduled_start)} ·{" "}
                      {item.topic_notes || "Konu belirtilmedi"}
                    </small>
                  </span>
                  <div>
                    <button
                      onClick={() => void updateStatus(item.id, "completed")}
                    >
                      Tamamlandı
                    </button>
                    <button
                      onClick={() => void updateStatus(item.id, "no_show")}
                    >
                      Gelmedi
                    </button>
                  </div>
                </article>
              ))}
          </section>
        </div>
      ) : (
        <EmptyState
          icon="user-off"
          title="Yönetilecek hoca profili yok"
          text="Yönetici bir kullanıcıya hoca rolü atadığında profil burada oluşur."
        />
      )}
    </section>
  );
}
