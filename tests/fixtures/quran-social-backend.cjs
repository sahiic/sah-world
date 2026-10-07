// Loopback-only browser fixture. Not Supabase, NOT a production auth bypass.
// No real keys/users/data. Database authorization is tested separately in SQL.
const http = require("node:http"),
  crypto = require("node:crypto");
const ids = {
  student: "11111111-1111-4111-8111-111111111111",
  teacher: "22222222-2222-4222-8222-222222222222",
  helper: "33333333-3333-4333-8333-333333333333",
  hoca: "44444444-4444-4444-8444-444444444444",
  appointment: "55555555-5555-4555-8555-555555555555",
  otherAppointment: "66666666-6666-4666-8666-666666666666",
  completed: "77777777-7777-4777-8777-777777777777",
  match: "88888888-8888-4888-8888-888888888888",
  request: "99999999-9999-4999-8999-999999999999",
  otherHelper: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
};
const created_at = new Date().toISOString();
function user(id) {
  return {
    id,
    email: "fixture@example.invalid",
    aud: "authenticated",
    role: "authenticated",
    created_at,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
  };
}
function profile(id) {
  return {
    id,
    display_name:
      id === ids.teacher
        ? "Örnek Hoca"
        : id === ids.helper
          ? "Örnek Destekçi"
          : "Örnek Öğrenci",
    role: id === ids.teacher ? "hoca" : "user",
    quran_level: id === ids.teacher ? "helper" : "fluent",
    avatar_url: null,
    xp: 0,
    streak_current: 0,
    streak_last_date: "",
    badges: [],
    total_zikir: 0,
    vehicle_type: "car",
    location_city: null,
    location_country: null,
    location_lat: null,
    location_lng: null,
    onboarding_completed: true,
    theme_preference: "system",
    notification_preferences: {},
    created_at,
    updated_at: created_at,
  };
}
const teacher = {
  id: ids.hoca,
  user_id: ids.teacher,
  display_name: "Örnek Hoca",
  title: "Kur’an öğreticisi",
  bio: "Yalnızca izole arayüz test profili.",
  specialties: ["Tecvid"],
  photo_url: null,
  is_active: true,
  is_placeholder: false,
  created_at,
  updated_at: created_at,
};
const helper = {
  id: ids.helper,
  display_name: "Örnek Destekçi",
  avatar_url: null,
  xp: 80,
  quran_level: "helper",
};
const secondHelper = {
  ...helper,
  id: ids.otherHelper,
  display_name: "Yeni Destekçi",
};
const start = new Date(Date.now() + 7 * 86400000);
start.setUTCHours(9, 0, 0, 0);
function appointment(id, date, status = "confirmed") {
  return {
    id,
    hoca_id: ids.hoca,
    student_id: ids.student,
    scheduled_start: date.toISOString(),
    scheduled_end: new Date(date.getTime() + 1800000).toISOString(),
    status,
    topic_notes:
      id === ids.appointment ? "Fâtiha · birinci ders" : "İhlâs · ayrı ders",
    created_at,
    cancelled_at: null,
    cancellation_reason: null,
    hoca_name: teacher.display_name,
    hoca_title: teacher.title,
    hoca_photo: null,
    student_name: "Örnek Öğrenci",
    student_avatar: null,
  };
}
let appointments, matches, messages, notes, rooms, members;
function reset() {
  appointments = [
    appointment(ids.appointment, start),
    appointment(ids.otherAppointment, new Date(start.getTime() + 86400000)),
    appointment(ids.completed, new Date(Date.now() - 86400000), "completed"),
  ];
  matches = [
    {
      id: ids.match,
      requester_id: ids.student,
      helper_id: ids.helper,
      status: "accepted",
      message: "Fâtiha çalışalım.",
      created_at,
    },
    {
      id: ids.request,
      requester_id: ids.helper,
      helper_id: ids.student,
      status: "pending",
      message: "Birlikte tekrar yapalım.",
      created_at,
    },
  ];
  messages = [
    {
      id: crypto.randomUUID(),
      sender_id: ids.teacher,
      receiver_id: ids.student,
      group_id: null,
      context_id: ids.appointment,
      content: "Yalnızca ilk dersin mesajı",
      is_read: false,
      created_at,
    },
    {
      id: crypto.randomUUID(),
      sender_id: ids.teacher,
      receiver_id: ids.student,
      group_id: null,
      context_id: ids.otherAppointment,
      content: "İkinci dersin özel mesajı",
      is_read: false,
      created_at,
    },
    {
      id: crypto.randomUUID(),
      sender_id: ids.helper,
      receiver_id: ids.student,
      group_id: null,
      context_id: ids.match,
      content: "Kardeş sohbeti",
      is_read: false,
      created_at,
    },
    {
      id: crypto.randomUUID(),
      sender_id: ids.teacher,
      receiver_id: ids.student,
      group_id: null,
      context_id: null,
      content: "Eski ortak sohbet arşivi",
      is_read: false,
      created_at,
    },
  ];
  notes = [
    {
      id: crypto.randomUUID(),
      appointment_id: ids.completed,
      author_id: ids.student,
      author_role: "student",
      surah_name: null,
      start_ayah: null,
      end_ayah: null,
      topics_covered: [],
      performance_note: null,
      student_reflection: "Öğrencinin karşılıklı özel notu",
      next_assignment: null,
      difficulty_rating: 3,
      created_at,
      updated_at: created_at,
    },
  ];
  rooms = [];
  members = [];
}
reset();
const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {}
  const url = new URL(req.url, "http://fixture.invalid");
  let viewer = ids.student;
  try {
    viewer =
      JSON.parse(
        Buffer.from(
          (req.headers.authorization ?? "").split(".")[1],
          "base64url",
        ).toString(),
      ).sub || viewer;
  } catch {}
  const reply = (data, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === "/health") {
    reply({ fixture: true });
    return;
  }
  if (url.pathname === "/reset") {
    reset();
    reply({ ok: true });
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    reply(user(viewer));
    return;
  }
  if (url.pathname === "/auth/v1/settings") {
    reply({ external: { google: false } });
    return;
  }
  const route = url.pathname.replace("/rest/v1/", "");
  const matchView = () =>
    matches
      .filter((m) => m.requester_id === viewer || m.helper_id === viewer)
      .map((m) => ({
        ...m,
        partner_id: m.requester_id === viewer ? m.helper_id : m.requester_id,
        partner_name: m.id === ids.request ? "Yeni Kardeş" : "Örnek Destekçi",
        partner_avatar: null,
        direction: m.requester_id === viewer ? "sent" : "received",
      }));
  if (route === "rpc/get_my_quran_appointments") {
    reply(appointments);
    return;
  }
  if (route === "rpc/browse_quran_helpers") {
    reply([helper, secondHelper]);
    return;
  }
  if (route === "rpc/get_my_quran_peer_matches") {
    reply(matchView());
    return;
  }
  if (route === "rpc/get_quran_thread_summaries") {
    reply(
      [
        ...appointments.map((a) => ({ context_id: a.id, kind: "appointment" })),
        { context_id: ids.match, kind: "peer" },
      ].map((c) => ({
        ...c,
        unread_count: messages.filter(
          (m) =>
            m.context_id === c.context_id &&
            m.receiver_id === viewer &&
            !m.is_read,
        ).length,
        last_message:
          messages.filter((m) => m.context_id === c.context_id).at(-1)
            ?.content ?? null,
        last_message_at: created_at,
      })),
    );
    return;
  }
  if (route === "rpc/mark_quran_thread_read") {
    let count = 0;
    messages = messages.map((m) => {
      if (
        m.context_id === body.target_context &&
        body.message_ids.includes(m.id) &&
        m.receiver_id === viewer &&
        !m.is_read
      ) {
        count++;
        return { ...m, is_read: true };
      }
      return m;
    });
    reply(count);
    return;
  }
  if (route === "rpc/send_quran_message") {
    if (body.message_content === "FAIL TEST") {
      reply({ message: "fixture failed send", code: "TEST" }, 500);
      return;
    }
    const partner =
      body.target_context === ids.match
        ? ids.helper
        : viewer === ids.student
          ? ids.teacher
          : ids.student;
    const m = {
      id: crypto.randomUUID(),
      context_id: body.target_context,
      group_id: null,
      sender_id: viewer,
      receiver_id: partner,
      content: body.message_content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    messages.push(m);
    reply(m);
    return;
  }
  if (route === "rpc/send_quran_peer_request") {
    matches.push({
      id: crypto.randomUUID(),
      requester_id: viewer,
      helper_id: body.target_helper_id,
      status: "pending",
      message: body.request_message,
      created_at,
    });
    reply(matches.at(-1));
    return;
  }
  if (route === "rpc/respond_quran_peer_match") {
    matches = matches.map((m) =>
      m.id === body.target_match_id
        ? { ...m, status: body.accept_request ? "accepted" : "declined" }
        : m,
    );
    reply(matches.find((m) => m.id === body.target_match_id));
    return;
  }
  if (route === "rpc/create_quran_study_room") {
    const room = {
      id: crypto.randomUUID(),
      group_id: crypto.randomUUID(),
      name: body.room_name,
      creator_id: viewer,
      surah_target: body.target_surah,
      start_ayah: body.first_ayah,
      end_ayah: body.last_ayah,
      scheduled_at: body.study_time,
      max_participants: 5,
      is_active: true,
      created_at,
    };
    rooms.push(room);
    members.push(
      {
        id: crypto.randomUUID(),
        room_id: room.id,
        user_id: viewer,
        status: "accepted",
        joined_at: created_at,
      },
      ...body.invited_users.map((id) => ({
        id: crypto.randomUUID(),
        room_id: room.id,
        user_id: id,
        status: "invited",
        joined_at: created_at,
      })),
    );
    reply(room);
    return;
  }
  if (route === "rpc/get_hoca_available_days") {
    reply([
      { available_date: start.toISOString().slice(0, 10), slot_count: 2 },
    ]);
    return;
  }
  if (route === "rpc/get_hoca_available_slots") {
    reply([
      {
        slot_start: new Date(start.getTime() + 3600000).toISOString(),
        slot_end: new Date(start.getTime() + 5400000).toISOString(),
      },
    ]);
    return;
  }
  if (route === "rpc/reschedule_hoca_appointment") {
    const old = appointments.find((a) => a.id === body.target_appointment_id);
    old.status = "cancelled";
    const next = {
      ...old,
      id: crypto.randomUUID(),
      status: "confirmed",
      scheduled_start: body.new_start,
      scheduled_end: new Date(
        new Date(body.new_start).getTime() + 1800000,
      ).toISOString(),
      topic_notes: body.new_notes,
    };
    appointments.push(next);
    reply(next);
    return;
  }
  if (route === "rpc/get_my_hasanat_total") {
    reply(0);
    return;
  }
  if (route === "rpc/ensure_my_profile") {
    reply(profile(viewer));
    return;
  }
  let data = [];
  if (route === "profiles") data = [profile(viewer)];
  else if (route === "hoca_profiles") data = [teacher];
  else if (route === "chat_messages")
    data = messages
      .filter((m) => {
        const c = url.searchParams.get("context_id");
        return c === "is.null"
          ? m.context_id === null
          : c
            ? m.context_id === c.slice(3)
            : true;
      })
      .slice()
      .reverse();
  else if (route === "appointment_notes")
    data = notes.filter(
      (n) =>
        !url.searchParams.get("appointment_id") ||
        n.appointment_id === url.searchParams.get("appointment_id").slice(3),
    );
  else if (route === "quran_study_rooms") data = rooms;
  else if (route === "quran_study_room_members") data = members;
  const object = req.headers.accept?.includes("vnd.pgrst.object+json");
  reply(object ? (data[0] ?? null) : data);
});
server.listen(
  Number(process.env.SAH_SOCIAL_FIXTURE_PORT ?? 3116),
  "127.0.0.1",
  () => console.log("Isolated social UI fixture ready (no production data)."),
);
