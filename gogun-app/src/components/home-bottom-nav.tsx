"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useLocale, type Locale } from "@/lib/locale";

export type HomeBottomNavActiveTab = "trips" | "recommend" | "profile";

const MENU_ITEMS: {
  id: HomeBottomNavActiveTab | "add-trip";
  label: Record<Locale, string>;
  icon: string;
  href: string;
  demoHref: string;
}[] = [
  { id: "add-trip", label: { th: "เพิ่มทริปใหม่", en: "Add a new trip" }, icon: "/images/floating-menu/icon-add-trip.svg", href: "/trips/new", demoHref: "/signin" },
  { id: "trips", label: { th: "จัดการทริป", en: "Manage trips" }, icon: "/images/floating-menu/icon-trips.svg", href: "/trips", demoHref: "/trips/demo" },
  { id: "recommend", label: { th: "แนะนำทริป", en: "Trip ideas" }, icon: "/images/floating-menu/icon-recommend.svg", href: "/recommend", demoHref: "/trips/demo/recommend" },
  { id: "profile", label: { th: "โปรไฟล์", en: "Profile" }, icon: "/images/floating-menu/icon-profile.svg", href: "/profile", demoHref: "/trips/demo/profile" },
];

export function HomeBottomNav({ active = "trips" }: { active?: HomeBottomNavActiveTab }) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const demoMode = pathname.startsWith("/trips/demo");
  const [openPath, setOpenPath] = useState<string | null>(null);
  const [scrollingDownAt, setScrollingDownAt] = useState<string | null>(null);
  const [calendarInViewAt, setCalendarInViewAt] = useState<string | null>(null);
  const open = openPath === pathname;
  const menuRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const scrollArea = document.querySelector<HTMLElement>(".maew-trip-scroll-content");
    const targets: Array<Window | HTMLElement> = scrollArea ? [window, scrollArea] : [window];
    const lastPositions = new Map<Window | HTMLElement, number>();
    for (const target of targets) {
      lastPositions.set(target, target === window ? window.scrollY : (target as HTMLElement).scrollTop);
    }
    const onScroll = (event: Event) => {
      const target = event.currentTarget as Window | HTMLElement;
      const current = target === window ? window.scrollY : (target as HTMLElement).scrollTop;
      const previous = lastPositions.get(target) ?? current;
      lastPositions.set(target, current);
      if (current < 20) setScrollingDownAt(null);
      else if (current - previous > 5) setScrollingDownAt(pathname);
      else if (previous - current > 5) setScrollingDownAt(null);
    };
    for (const target of targets) target.addEventListener("scroll", onScroll, { passive: true });

    const calendar = document.querySelector(".maew-plan-cal-grid");
    const calendarObserver = calendar && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => setCalendarInViewAt(entry.isIntersecting ? pathname : null), {
          rootMargin: "0px 0px -90px 0px",
        })
      : null;
    if (calendar && calendarObserver) calendarObserver.observe(calendar);

    return () => {
      for (const target of targets) target.removeEventListener("scroll", onScroll);
      calendarObserver?.disconnect();
    };
  }, [pathname]);

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
          aria-label={locale === "th" ? "ปิดเมนู" : "Close menu"}
          tabIndex={-1}
          onClick={() => {
            setOpenPath(null);
            triggerRef.current?.focus();
          }}
        />
      )}
      <nav ref={menuRef} className={"maew-floating-menu" + (open ? " is-open" : "") + (!open && (scrollingDownAt === pathname || calendarInViewAt === pathname) ? " is-reading" : "")} aria-label={locale === "th" ? "เมนูหลัก" : "Main menu"}>
        <div id="maew-floating-menu-items" className="maew-floating-menu-items" aria-hidden={!open}>
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={demoMode ? item.demoHref : item.href}
              className="maew-floating-menu-link"
              aria-current={active === item.id && pathname === (demoMode ? item.demoHref : item.href) ? "page" : undefined}
              tabIndex={open ? 0 : -1}
              translate="no"
              onClick={() => setOpenPath(null)}
            >
              <span className="maew-floating-menu-link-label">{item.label[locale]}</span>
              <span className={"maew-floating-menu-link-icon is-" + item.id}>
                <img src={item.icon} alt="" />
              </span>
            </Link>
          ))}
        </div>
        <button
          ref={triggerRef}
          type="button"
          className="maew-floating-menu-trigger"
          aria-label={locale === "th" ? (open ? "ปิดเมนู" : "เปิดเมนู") : (open ? "Close menu" : "Open menu")}
          aria-expanded={open}
          aria-controls="maew-floating-menu-items"
          onClick={() => setOpenPath((value) => value === pathname ? null : pathname)}
        >
          <img className="maew-floating-menu-base" src={open ? "/images/floating-menu/button-open-base.svg" : "/images/floating-menu/button-base.svg"} alt="" />
          <img className="maew-floating-menu-glint" src="/images/floating-menu/button-glint.svg" alt="" />
          <img className="maew-floating-menu-dot" src="/images/floating-menu/button-dot.svg" alt="" />
          <img className="maew-floating-menu-shadow" src="/images/floating-menu/button-shadow.svg" alt="" />
          <img className="maew-floating-menu-hamburger" src="/images/floating-menu/icon-menu.svg" alt="" />
          <img className="maew-floating-menu-close-icon" src="/images/floating-menu/icon-close.svg" alt="" />
        </button>
      </nav>
    </>
  );
}
