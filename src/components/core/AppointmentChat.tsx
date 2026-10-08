"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isValidUUID } from "@/store/useJourneyStore";
import type { AppointmentView } from "./QuranCompanionView";
import QuranChat from "@/components/quran/QuranChat";
import type { QuranPresenceState } from "@/components/quran/useQuranPresence";
export default function AppointmentChat({
  appointment,
  currentUserId,
  isHoca,
  onClose,
  onRead,
  presence,
}: {
  appointment: AppointmentView;
  currentUserId: string;
  isHoca: boolean;
  onClose: () => void;
  onRead?: () => void;
  presence?: QuranPresenceState;
}) {
  const demo = Boolean(appointment.is_demo) || !isValidUUID(currentUserId);
  const [teacherUser, setTeacherUser] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (demo || isHoca) return;
    let active = true;
    void supabase
      .from("hoca_profiles")
      .select("user_id")
      .eq("id", appointment.hoca_id)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (!active) return;
        if (e || !data?.user_id)
          setError("Hoca hesabı mesajlaşma için etkin değil.");
        else setTeacherUser(data.user_id);
      });
    return () => {
      active = false;
    };
  }, [appointment.hoca_id, demo, isHoca]);
  return (
    <QuranChat
      contextId={appointment.id}
      userId={currentUserId || "demo-student"}
      partnerId={isHoca ? appointment.student_id : teacherUser}
      name={isHoca ? appointment.student_name : appointment.hoca_name}
      avatar={isHoca ? appointment.student_avatar : appointment.hoca_photo}
      subtitle={`Randevu mesajlaşması · ${new Date(appointment.scheduled_start).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" })}`}
      topic={error || appointment.topic_notes}
      demo={demo}
      readOnly={
        Boolean(error) || ["cancelled", "no_show"].includes(appointment.status)
      }
      unavailable={error}
      onClose={onClose}
      onRead={onRead}
      presence={presence}
    />
  );
}
