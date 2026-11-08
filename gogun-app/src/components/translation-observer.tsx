"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { english } from "@/lib/i18n-dictionary";
import { useLocale, type Locale } from "@/lib/locale";

const originalText = new WeakMap<Text, { source: string; output: string }>();
const originalAttributes = new WeakMap<Element, Map<string, { source: string; output: string }>>();
const translatedAttributes = ["placeholder", "aria-label", "title", "alt"];
const protectedContent = [
  "[translate='no']", "[data-user-content]", "[contenteditable]",
  "script", "style", "code", "pre", "svg", "textarea",
  ".maew-home-trip-row-title",
  ".maew-trip-hero-title", ".maew-profile-info",
  ".maew-overview-member-name", ".maew-expense-row-title",
  ".maew-overview-value", ".maew-notifications-item-title",
  ".maew-create-activity-title", ".maew-create-activity-desc",
  ".workspace-trip-name", ".workspace-heading",
].join(",");

function translated(source: string, locale: Locale) {
  if (locale === "th") return source;
  const clean = source.trim().replace(/\s+/g, " ");
  const replacement = english[clean];
  if (!replacement) return source;
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return `${leading}${replacement}${trailing}`;
}

function skip(element: Element | null) {
  return !element || Boolean(element.closest(protectedContent));
}

function updateText(node: Text, locale: Locale) {
  if (skip(node.parentElement)) return;
  const current = node.data;
  const prior = originalText.get(node);
  const source = prior && current === prior.output ? prior.source : current;
  const output = translated(source, locale);
  originalText.set(node, { source, output });
  if (current !== output) node.data = output;
}

function updateAttributes(element: Element, locale: Locale) {
  if (skip(element)) return;
  let remembered = originalAttributes.get(element);
  if (!remembered) {
    remembered = new Map();
    originalAttributes.set(element, remembered);
  }
  for (const name of translatedAttributes) {
    const current = element.getAttribute(name);
    if (current === null) continue;
    const prior = remembered.get(name);
    const source = prior && current === prior.output ? prior.source : current;
    const output = translated(source, locale);
    remembered.set(name, { source, output });
    if (current !== output) element.setAttribute(name, output);
  }
}

function updateTree(root: Node, locale: Locale) {
  if (root.nodeType === Node.TEXT_NODE) {
    updateText(root as Text, locale);
    return;
  }
  if (!(root instanceof Element)) return;
  updateAttributes(root, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) updateText(node as Text, locale);
    else updateAttributes(node as Element, locale);
  }
}

export function TranslationObserver() {
  const { locale } = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const root = document.body;
    updateTree(root, locale);
    const updateStaticTitle = () => {
      // Keep page titles supplied by trips or other user content intact.
      if (["Maew Tiew | แมวเที่ยว", "Maew Tiew | Easy trips together"].includes(document.title)) {
        const expected = locale === "en" ? "Maew Tiew | Easy trips together" : "Maew Tiew | แมวเที่ยว";
        if (document.title !== expected) document.title = expected;
      }
    };
    updateStaticTitle();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") updateTree(mutation.target, locale);
        else if (mutation.type === "attributes") updateAttributes(mutation.target as Element, locale);
        else for (const added of mutation.addedNodes) updateTree(added, locale);
      }
    });
    observer.observe(root, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: translatedAttributes,
    });
    const titleObserver = new MutationObserver(updateStaticTitle);
    titleObserver.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => { observer.disconnect(); titleObserver.disconnect(); };
  }, [locale, pathname]);

  return null;
}
