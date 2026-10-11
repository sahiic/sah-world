"use client";

import AppointmentsView from "./AppointmentsView";
import HocaManagement from "./HocaManagement";
import PeerMatching from "./PeerMatching";
import TabSkeleton from "./TabSkeleton";
import TeacherDiscovery from "./TeacherDiscovery";
import type { QuranController } from "./useQuranCompanion";

interface QuranCommunityTabProps {
  controller: QuranController;
  onNavigate: (view: string) => void;
}
export default function QuranCommunityTab({
  controller,
}: QuranCommunityTabProps) {
  const {
    mainTab,
    unreadCounts,
    matches,
    teachers,
    isRealUser,
    load,
    setTab,
    flash,
    presence,
    userId,
    pilotDemo,
    appointments,
    threads,
    refreshThreads,
    enableReminders,
    bgLoading,
    helpers,
    profile,
    isHoca,
    isAdmin,
    tab,
    ownedHoca,
  } = controller;
  return (
    <>
      {" "}
      {mainTab === "topluluk" && (
        <>
          <nav
            className="qc-community-shortcuts"
            aria-label="Topluluk içinde gezin"
          >
            <a href="#quran-teachers">Hocalar</a>
            <a href="#quran-appointments">
              Randevularım
              {unreadCounts.appointments > 0 && (
                <em className="qc-nav-badge">{unreadCounts.appointments}</em>
              )}
            </a>
            <a href="#quran-peers">
              Kur’an Kardeşi
              {unreadCounts.peers +
                matches.filter(
                  (m) => m.direction === "received" && m.status === "pending",
                ).length >
                0 && (
                <em className="qc-nav-badge">
                  {unreadCounts.peers +
                    matches.filter(
                      (m) =>
                        m.direction === "received" && m.status === "pending",
                    ).length}
                </em>
              )}
            </a>
          </nav>
          <section id="quran-teachers" aria-label="Hocalar">
            <TeacherDiscovery
              teachers={teachers.filter(
                (t) => t.is_active && (isRealUser ? !t.is_placeholder : true),
              )}
              onBooked={async () => {
                await load();
                setTab("appointments");
                flash("Randevun onaylandı.");
              }}
              realUser={isRealUser}
              presence={presence}
            />
          </section>
          <section id="quran-appointments" aria-label="Randevularım">
            <AppointmentsView
              key={`${userId}-${pilotDemo}`}
              appointments={appointments}
              userId={userId}
              onReload={() => load(true)}
              teachers={teachers}
              threads={threads}
              onRead={() => void refreshThreads()}
              presence={presence}
              onReminders={() => void enableReminders()}
              onNotice={flash}
            />
          </section>
          <section id="quran-peers" aria-label="Kur'an Kardeşi">
            {bgLoading ? (
              <TabSkeleton />
            ) : (
              <PeerMatching
                key={`${userId}-${pilotDemo}`}
                helpers={helpers}
                matches={matches}
                level={profile?.quran_level || null}
                userId={userId}
                realUser={isRealUser}
                onReload={() => load(true)}
                threads={threads}
                onRead={() => void refreshThreads()}
                presence={presence}
              />
            )}
          </section>
          {(isHoca || isAdmin) && (
            <details className="qc-module-details" open={tab === "manage"}>
              <summary>Hoca yönetimi</summary>
              <HocaManagement
                teachers={teachers}
                ownedHoca={ownedHoca}
                appointments={appointments}
                isAdmin={isAdmin}
                onReload={load}
              />
            </details>
          )}
        </>
      )}
    </>
  );
}
