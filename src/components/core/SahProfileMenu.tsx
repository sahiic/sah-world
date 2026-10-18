"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import AwarenessProfileSummary from "./AwarenessProfileSummary";
import ProfessionProfileSummary from "./ProfessionProfileSummary";
import type { Profile } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Props = {
  avatarUrl: string;
  activeProfile: Profile | null;
  store: { streak: { current: number } };
  level: { name: string };
  navigate: (view: string) => void;
  setProfileOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  toggleTheme: () => void;
  theme: "light" | "dark";
  activeUser: User | null;
  openPage: (path: string) => void;
  isSigningOut: boolean;
  signOut: () => unknown;
  signOutError: string | null;
};

export default function SahProfileMenu({
  avatarUrl,
  activeProfile,
  store,
  level,
  navigate,
  setProfileOpen,
  setSettingsOpen,
  toggleTheme,
  theme,
  activeUser,
  openPage,
  isSigningOut,
  signOut,
  signOutError,
}: Props) {
  return (
    <div className="profile-popover" role="menu">
      <div className="profile-summary">
        <AvatarImage src={avatarUrl} size={48} />
        <span>
          <strong>{activeProfile?.display_name || "Yolcu"}</strong>
          <small>
            {store.streak.current} günlük seri · {level.name}
          </small>
        </span>
      </div>
      <AwarenessProfileSummary onOpen={() => navigate("awareness")} />
      <ProfessionProfileSummary onOpen={() => navigate("profession-school")} />
      <button role="menuitem" onClick={() => navigate("profile")}>
        <AppIcon name="user-circle" /> Profilim ve rozetlerim
      </button>
      <button role="menuitem" onClick={() => navigate("community")}>
        <AppIcon name="users-group" /> Topluluklarım
      </button>
      <button
        role="menuitem"
        onClick={() => {
          setProfileOpen(false);
          setSettingsOpen(true);
        }}
      >
        <AppIcon name="settings" /> Hesap ve gizlilik
      </button>
      <button role="menuitem" onClick={toggleTheme}>
        <AppIcon name={theme === "light" ? "moon" : "sun"} />{" "}
        {theme === "light" ? "Gece görünümü" : "Aydınlık görünüm"}
      </button>
      {activeUser?.app_metadata?.role === "admin" && (
        <button role="menuitem" onClick={() => openPage("/admin/feedback")}>
          <AppIcon name="shield-check" /> Geri bildirim yönetimi
        </button>
      )}
      <button
        className="signout"
        role="menuitem"
        disabled={isSigningOut}
        onClick={() => void signOut()}
      >
        <AppIcon name="logout" />{" "}
        {isSigningOut ? "Çıkış yapılıyor…" : "Oturumu kapat"}
      </button>
      {signOutError && <p role="alert">{signOutError}</p>}
    </div>
  );
}
