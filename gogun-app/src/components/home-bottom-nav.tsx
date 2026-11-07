"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type HomeBottomNavActiveTab = "trips" | "recommend" | "profile";

const MENU_ITEMS: {
  id: HomeBottomNavActiveTab | "add-trip";
  label: string;
  icon: string;
  href: string;
  demoHref: string;
}[] = [
  { id: "add-trip", label: "เพิ่มทริปใหม่", icon: "/images/floating-menu/icon-add-trip.svg", href: "/trips/new", demoHref: "/signin" },
  { id: "trips", label: "จัดการทริป", icon: "/images/floating-menu/icon-trips.svg", href: "/trips", demoHref: "/trips/demo" },
  { id: "recommend", label: "แนะนำทริป", icon: "/images/floating-menu/icon-recommend.svg", href: "/recommend", demoHref: "/trips/demo/recommend" },
  { id: "profile", label: "โปรไฟล์", icon: "/images/floating-menu/icon-profile.svg", href: "/profile", demoHref: "/trips/demo/profile" },
];

export function HomeBottomNav({ active = "trips" }: { active?: HomeBottomNavActiveTab }) {
  const pathname = usePathname();
  const demoMode = pathname.startsWith("/trips/demo");
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPath(null);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = menuRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      {open && (
        <button
          type="button"
          className="maew-floating-menu-backdrop"
          aria-label="ปิดเมนู"
          tabIndex={-1}
          onClick={() => {
            setOpenPath(null);
            triggerRef.current?.focus();
          }}
        />
      )}
      <nav ref={menuRef} className={"maew-floating-menu" + (open ? " is-open" : "")} aria-label="เมนูหลัก">
        <div id="maew-floating-menu-items" className="maew-floating-menu-items" aria-hidden={!open}>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={demoMode ? item.demoHref : item.href}
              className="maew-floating-menu-link"
              aria-current={active === item.id ? "page" : undefined}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpenPath(null)}
            >
              <span className={"maew-floating-menu-link-icon is-" + item.id}>
                <img src={item.icon} alt="" />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="maew-floating-menu-trigger"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={open}
          aria-controls="maew-floating-menu-items"
          onClick={() => setOpenPath((value) => value === pathname ? null : pathname)}
        >
          <img className="maew-floating-menu-base" src="/images/floating-menu/button-base.svg" alt="" />
          <img className="maew-floating-menu-glint" src="/images/floating-menu/button-glint.svg" alt="" />
          <img className="maew-floating-menu-dot" src="/images/floating-menu/button-dot.svg" alt="" />
          <img className="maew-floating-menu-shadow" src="/images/floating-menu/button-shadow.svg" alt="" />
          <img className="maew-floating-menu-hamburger" src="/images/floating-menu/icon-menu.svg" alt="" />
          <svg className="maew-floating-menu-close-icon" viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <path d="M7 7L27 27M27 7L7 27" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        </button>
      </nav>
    </>
  );
}
