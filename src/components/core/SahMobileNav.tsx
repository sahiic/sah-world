"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  navigationItems,
  type NavigationItem,
  type ViewKey,
} from "./SahSidebar";
import type { User } from "@supabase/supabase-js";
import type { Dispatch, SetStateAction } from "react";

const mobileNavigationIds: ViewKey[] = [
  "dashboard",
  "focus",
  "mescidim",
  "journal",
];
const mobileNavigationItems = mobileNavigationIds
  .map((id) => navigationItems.find((item) => item.id === id))
  .filter((item): item is NavigationItem => Boolean(item));

export default function SahMobileNav({
  view,
  navigate,
  moreOpen,
  setMoreOpen,
  openPage,
  activeUser,
}: {
  view: string;
  navigate: (view: string) => void;
  moreOpen: boolean;
  setMoreOpen: Dispatch<SetStateAction<boolean>>;
  openPage: (path: string) => void;
  activeUser: User | null;
}) {
  return (
    <>
      <nav className="mobile-nav" aria-label="Mobil navigasyon">
        {mobileNavigationItems.map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            onClick={() => navigate(item.id)}
            aria-current={view === item.id ? "page" : undefined}
          >
            <AppIcon name={item.icon} />
            <span>
              {item.mobileLabel ??
                (item.label === "Kur’an’ı Kerim Kardeşim"
                  ? "Kur’an"
                  : item.label)}
            </span>
          </button>
        ))}
        <button
          className={moreOpen ? "active" : ""}
          onClick={() => setMoreOpen((value) => !value)}
          aria-expanded={moreOpen}
        >
          <AppIcon name="dots" />
          <span>Daha</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-more" role="dialog" aria-label="Diğer bölümler">
          {navigationItems
            .filter((item) => !mobileNavigationIds.includes(item.id))
            .map((item) => (
              <button key={item.id} onClick={() => navigate(item.id)}>
                <AppIcon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          <button onClick={() => openPage("/feedback")}>
            <AppIcon name="message-heart" />
            <span>Görüş</span>
          </button>
          {activeUser?.app_metadata?.role === "admin" && (
            <button onClick={() => openPage("/admin/feedback")}>
              <AppIcon name="shield-check" />
              <span>Yönetim</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
