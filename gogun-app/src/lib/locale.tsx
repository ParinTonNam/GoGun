"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "th" | "en";

const STORAGE_KEY = "gogun_lang";
const CHANGE_EVENT = "gogun-language-change";
let fallbackLocale: Locale = "th";
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "th", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocale, (): Locale => "th");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

function getLocale(): Locale {
  try { return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "th"; }
  catch { return fallbackLocale; }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function setLocale(next: Locale) {
  fallbackLocale = next;
  try { window.localStorage.setItem(STORAGE_KEY, next); } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLocale() {
  return useContext(LocaleContext);
}
