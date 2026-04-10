"use client";

import { useEffect } from "react";

/**
 * Invisible client component that tracks phone and WhatsApp CTA clicks
 * via Google Analytics gtag events. Uses event delegation on the document
 * so it works across all pages without touching any existing markup.
 *
 * Fires:
 *   - phone_click     — when an <a href="tel:..."> is clicked
 *   - whatsapp_click  — when an <a href="...wa.me/..."> or <a href="...api.whatsapp.com/..."> is clicked
 */
export function CtaTracker() {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // Walk up from the click target to find an anchor element
      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== "A") {
        el = el.parentElement;
      }
      if (!el) return;

      const href = (el as HTMLAnchorElement).href;
      if (!href) return;

      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (!gtag) return;

      if (href.startsWith("tel:")) {
        const phone = href.replace("tel:", "");
        gtag("event", "phone_click", { phone_number: phone });
      } else if (href.includes("wa.me/") || href.includes("api.whatsapp.com/")) {
        const match = href.match(/wa\.me\/(\d+)/);
        const phone = match?.[1] ?? "";
        gtag("event", "whatsapp_click", { phone_number: phone });
      }
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
