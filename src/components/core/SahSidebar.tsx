"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import type { SectionKey } from "./SectionView";
import polish from "./SahAppPolish.module.css";

export type ViewKey =
  | "dashboard"
  | "growth"
  | "community"
  | "reports"
  | "profile"
  | "focus"
  | "awareness"
  | "profession-school"
  | "quran-companion"
  | SectionKey;
export type NavigationItem = {
  id: ViewKey;
  label: string;
  mobileLabel?: string;
  icon: string;
};

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Âlem", icon: "home" },
  {
    id: "focus",
    label: "Attention Is All You Need",
    mobileLabel: "Attention",
    icon: "target-arrow",
  },
  { id: "quran-companion", label: "Kur’an’ı Kerim Kardeşim", icon: "book-2" },
  {
    id: "mescidim",
    label: "Allah’a en sevimli olan mekânlar",
    mobileLabel: "Mekânlar",
    icon: "building-mosque",
  },
  { id: "journal", label: "Günlük", icon: "notebook" },
  { id: "awareness", label: "Mazlum Coğrafyalar", icon: "world-heart" },
  { id: "reports", label: "Gelişim Raporlarım", icon: "chart-histogram" },
  {
    id: "profession-school",
    label: "Meslek ve Ahlak Okulu",
    icon: "certificate",
  },
];

const SidebarContext = createContext({
  sidebarCollapsed: false,
  toggleSidebar: () => {},
});

export function SahShell({
  focusMode,
  children,
}: {
  focusMode: boolean;
  children: ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      const collapsed = ["true", "1"].includes(
        localStorage.getItem("sah:sidebar-collapsed") ?? "",
      );
      queueMicrotask(() => setSidebarCollapsed(collapsed));
    } catch {
      /* optional device preference */
    }
  }, []);
  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    try {
      localStorage.setItem("sah:sidebar-collapsed", String(next));
    } catch {
      /* still works this visit */
    }
  };

  return (
    <SidebarContext.Provider value={{ sidebarCollapsed, toggleSidebar }}>
      <div
        className={`core-app phase-two-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${focusMode ? "focus-mode" : ""}`}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export default function SahSidebar({
  view,
  navigate,
  openPage,
  quranUnread,
}: {
  view: string;
  navigate: (view: string) => void;
  openPage: (path: string) => void;
  quranUnread: number;
}) {
  const { sidebarCollapsed, toggleSidebar } = useContext(SidebarContext);
  const handleSidebarKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button:not(:disabled)",
      ),
    );
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next]?.focus();
  };

  return (
    <aside
      className={`app-sidebar core-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
      aria-label="Ana navigasyon"
    >
      <button
        className="brand sidebar-brand"
        onClick={() => navigate("dashboard")}
        aria-label="SAHİ ana sayfa"
      >
        <span className="brand-mark">
          <AppIcon name="leaf" />
        </span>
        <span>
          <strong className={polish.brandWordmark}>SAHİ</strong>
        </span>
      </button>

      <nav className="sidebar-nav">
        <section aria-label="Ana bölümler" onKeyDown={handleSidebarKeyDown}>
          <p>ANA BÖLÜMLER</p>
          {navigationItems.map((item) => (
            <button
              key={item.id}
              className={`${view === item.id ? "active" : ""} ${polish.navButton} ${item.mobileLabel ? polish.longNavButton : ""}`}
              onClick={() => navigate(item.id)}
              aria-current={view === item.id ? "page" : undefined}
              aria-label={item.label}
              data-tooltip={item.label}
            >
              <AppIcon name={item.icon} />
              <span className={`nav-label ${polish.navLabel}`}>
                {item.label}
              </span>
              {item.id === "quran-companion" && quranUnread > 0 && (
                <em
                  className="sidebar-badge"
                  aria-label={`${quranUnread} okunmamış mesaj`}
                >
                  {quranUnread > 99 ? "99+" : quranUnread}
                </em>
              )}
            </button>
          ))}
        </section>
      </nav>

      <div className="sidebar-support">
        <button
          onClick={() => openPage("/feedback")}
          aria-label="Görüş ve Öneri"
          data-tooltip="Görüş ve Öneri"
        >
          <AppIcon name="message-heart" />
          <span className="nav-label">Görüş ve Öneri</span>
        </button>
        <p>
          <AppIcon name="lock" /> Özel kayıtların yalnızca sana görünür.
        </p>
        <div className="sidebar-legal">
          <a href="/gizlilik">Gizlilik</a>
          <span>·</span>
          <a href="/kullanim-kosullari">Koşullar</a>
        </div>
        <button
          className="sidebar-collapse-toggle"
          onClick={toggleSidebar}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          data-tooltip={sidebarCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          <AppIcon
            name={
              sidebarCollapsed
                ? "layout-sidebar-right"
                : "layout-sidebar-left-collapse"
            }
          />
          <span className="nav-label">Menüyü daralt</span>
        </button>
      </div>
    </aside>
  );
}
