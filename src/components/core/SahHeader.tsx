"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import type { Profile } from "@/lib/supabase";
import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react";
import polish from "./SahAppPolish.module.css";

type Props = {
  navigate: (view: string) => void;
  viewLabel: string;
  setSearchOpen: (open: boolean) => void;
  profileMenuRef: RefObject<HTMLDivElement | null>;
  setProfileOpen: Dispatch<SetStateAction<boolean>>;
  profileOpen: boolean;
  avatarUrl: string;
  activeProfile: Profile | null;
  level: { name: string };
  store: { xp: number };
  children: ReactNode;
};

export default function SahHeader({
  navigate,
  viewLabel,
  setSearchOpen,
  profileMenuRef,
  setProfileOpen,
  profileOpen,
  avatarUrl,
  activeProfile,
  level,
  store,
  children,
}: Props) {
  return (
    <header className="app-header">
      <button
        className="mobile-brand"
        onClick={() => navigate("dashboard")}
        aria-label="SAHİ ana sayfa"
      >
        <span className="brand-mark">
          <AppIcon name="leaf" />
        </span>
        <strong className={polish.mobileWordmark}>SAHİ</strong>
      </button>
      <div className="header-search-area">
        <div className="route-context">
          <span className={polish.routeBrand}>SAHİ</span>
          <strong className={polish.routeTitle}>{viewLabel}</strong>
        </div>
        <button
          className="global-search-button"
          onClick={() => setSearchOpen(true)}
          aria-label="Her yerde ara"
        >
          <AppIcon name="search" />
          <span>Ayet, niyet, ders veya kavram ara…</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>
      <div className="header-actions" ref={profileMenuRef}>
        <button
          className="header-quick-add"
          aria-label="Gününü Yaz"
          onClick={() => navigate("journal")}
        >
          <AppIcon name="plus" />
          <span className={polish.quickAddLabel}>Gününü Yaz</span>
        </button>
        <button
          className="profile-button"
          aria-label="Hesap menüsü"
          onClick={() => setProfileOpen((value) => !value)}
          aria-expanded={profileOpen}
          aria-haspopup="menu"
        >
          <AvatarImage src={avatarUrl} size={48} priority />
          <span>
            <strong>{activeProfile?.display_name || "Yolcu"}</strong>
            <small>
              {level.name} · {store.xp} XH
            </small>
          </span>
          <AppIcon name="chevron-down" />
        </button>
        {profileOpen && children}
      </div>
      
    </header>
  );
}


