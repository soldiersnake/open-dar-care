"use client";

import { useState, type JSX } from "react";
import { usePathname } from "next/navigation";
import { navItems, mockUser, type NavItem } from "@/lib/feed-data";

const navIconGlyphs: Record<NavItem["icon"], JSX.Element> = {
  feed: (
    <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  ),
  kids: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
    </>
  ),
  notices: (
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
  ),
  account: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
};

function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#"
      className={
        className ?? "flex items-center gap-3 px-2 pt-1 pb-5"
      }
    >
      <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </div>
      <div>
        <div className="font-display text-[17px] font-semibold leading-none text-ink">
          OpenDayCare
        </div>
        <div className="mt-0.5 text-[11.5px] text-muted">Sala Soles</div>
      </div>
    </a>
  );
}

function NewPostButton({ onClick }: { onClick?: () => void }) {
  return (
    <a
      href="#"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      Nueva publicación
    </a>
  );
}

function isNavItemActive(pathname: string, href: string) {
  if (href === "#") return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        return (
          <a
            key={item.icon}
            href={item.href}
            onClick={onNavigate}
            className={
              active
                ? "flex items-center gap-3 rounded-xl bg-cta-bg px-3 py-2.5 text-[14.5px] font-extrabold text-accent"
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-semibold text-ink-body"
            }
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {navIconGlyphs[item.icon]}
            </svg>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}

function UserBlock() {
  return (
    <div className="mt-2.5 border-t border-line pt-3.5">
      <div className="flex items-center gap-3 px-2 py-1.5">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-brand-warm font-display text-base font-semibold text-white">
          {mockUser.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-ink">{mockUser.name}</div>
          <div className="text-xs text-muted">{mockUser.role}</div>
        </div>
        <a
          href="#"
          title="Cerrar sesión"
          className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-bg text-muted-soft"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </a>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <Logo />
      <div className="mb-4">
        <NewPostButton onClick={onNavigate} />
      </div>
      <NavList onNavigate={onNavigate} />
      <UserBlock />
    </>
  );
}

export function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-line bg-panel px-4 py-6 md:flex">
        <SidebarContent />
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-panel px-5 md:hidden">
        <Logo className="flex items-center gap-3" />
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-body"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          onClick={closeDrawer}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-panel px-4 py-6 transition-transform duration-200 md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent onNavigate={closeDrawer} />
      </div>
    </>
  );
}
