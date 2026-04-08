"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import styles from "./PopBanner.module.css";

interface Banner {
  id: string;
  title: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  inline_link_text?: string;
  inline_link_url?: string;
  property_id?: string;
  background_color: string;
  text_color: string;
  banner_type: "popup" | "top_bar" | "slide_in";
  show_once: boolean | number;
  valid_from?: string;
  valid_until?: string;
}

const DISMISS_PREFIX = "zevio_banner_dismissed_";

function isDismissed(banner: Banner): boolean {
  if (!banner.show_once) return false;
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${DISMISS_PREFIX}${banner.id}`) === "1";
}

function markDismissed(banner: Banner) {
  if (banner.show_once && typeof window !== "undefined") {
    localStorage.setItem(`${DISMISS_PREFIX}${banner.id}`, "1");
  }
}

// Build the button/link href — property deeplink takes precedence over button_link
function resolveButtonHref(banner: Banner): string {
  if (banner.property_id) return `/properties/${banner.property_id}`;
  return banner.button_link || "#";
}

// ─────────────────────────────────────────
// POPUP variant
// ─────────────────────────────────────────
function PopupBanner({
  banner,
  onDismiss,
}: {
  banner: Banner;
  onDismiss: () => void;
}) {
  const buttonHref = resolveButtonHref(banner);
  const buttonLabel =
    banner.button_text || (banner.property_id ? "View Property" : undefined);

  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div
        className={styles.popup}
        style={{
          backgroundColor: banner.background_color,
          color: banner.text_color,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeBtn}
          onClick={onDismiss}
          aria-label="Close banner"
          style={{ color: banner.text_color }}
        >
          ✕
        </button>

        <p className={styles.title}>{banner.title}</p>

        {banner.description && (
          <p className={styles.description}>{banner.description}</p>
        )}

        <div className={styles.actions}>
          {buttonLabel && (
            <Link
              href={buttonHref}
              className={styles.ctaBtn}
              style={{
                color: banner.text_color,
                borderColor: banner.text_color,
              }}
              onClick={onDismiss}
              target={banner.property_id ? undefined : "_blank"}
              rel={banner.property_id ? undefined : "noopener noreferrer"}
            >
              {buttonLabel}
            </Link>
          )}

          {banner.inline_link_text && banner.inline_link_url && (
            <Link
              href={banner.inline_link_url}
              className={styles.inlineLink}
              style={{ color: banner.text_color }}
              onClick={onDismiss}
              target="_blank"
              rel="noopener noreferrer"
            >
              {banner.inline_link_text}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// TOP BAR variant
// ─────────────────────────────────────────
function TopBarBanner({
  banner,
  onDismiss,
}: {
  banner: Banner;
  onDismiss: () => void;
}) {
  const buttonHref = resolveButtonHref(banner);
  const buttonLabel =
    banner.button_text || (banner.property_id ? "View" : undefined);

  return (
    <div
      className={styles.topBar}
      style={{
        backgroundColor: banner.background_color,
        color: banner.text_color,
      }}
    >
      <div className={styles.topBarContent}>
        <span className={styles.topBarTitle}>{banner.title}</span>

        {banner.description && (
          <span className={styles.topBarDesc}>{banner.description}</span>
        )}

        {buttonLabel && (
          <Link
            href={buttonHref}
            className={styles.ctaBtn}
            style={{ color: banner.text_color, borderColor: banner.text_color }}
            onClick={onDismiss}
            target={banner.property_id ? undefined : "_blank"}
            rel={banner.property_id ? undefined : "noopener noreferrer"}
          >
            {buttonLabel}
          </Link>
        )}

        {banner.inline_link_text && banner.inline_link_url && (
          <Link
            href={banner.inline_link_url}
            className={styles.inlineLink}
            style={{ color: banner.text_color }}
            onClick={onDismiss}
            target="_blank"
            rel="noopener noreferrer"
          >
            {banner.inline_link_text}
          </Link>
        )}
      </div>

      <button
        className={styles.closeBtnTopBar}
        onClick={onDismiss}
        aria-label="Close banner"
        style={{ color: banner.text_color }}
      >
        ✕
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// SLIDE-IN variant
// ─────────────────────────────────────────
function SlideInBanner({
  banner,
  onDismiss,
}: {
  banner: Banner;
  onDismiss: () => void;
}) {
  const buttonHref = resolveButtonHref(banner);
  const buttonLabel =
    banner.button_text || (banner.property_id ? "View Property" : undefined);

  return (
    <div
      className={styles.slideIn}
      style={{
        backgroundColor: banner.background_color,
        color: banner.text_color,
      }}
    >
      <button
        className={styles.closeBtn}
        onClick={onDismiss}
        aria-label="Close banner"
        style={{ color: banner.text_color }}
      >
        ✕
      </button>

      <p className={styles.title}>{banner.title}</p>

      {banner.description && (
        <p className={styles.description}>{banner.description}</p>
      )}

      <div className={styles.actions}>
        {buttonLabel && (
          <Link
            href={buttonHref}
            className={styles.ctaBtn}
            style={{ color: banner.text_color, borderColor: banner.text_color }}
            onClick={onDismiss}
            target={banner.property_id ? undefined : "_blank"}
            rel={banner.property_id ? undefined : "noopener noreferrer"}
          >
            {buttonLabel}
          </Link>
        )}

        {banner.inline_link_text && banner.inline_link_url && (
          <Link
            href={banner.inline_link_url}
            className={styles.inlineLink}
            style={{ color: banner.text_color }}
            onClick={onDismiss}
            target="_blank"
            rel="noopener noreferrer"
          >
            {banner.inline_link_text}
          </Link>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN PopBanner component
// ─────────────────────────────────────────
export default function PopBanner() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4500/api";
    fetch(`${apiUrl}/banners/active`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        const data: Banner[] = Array.isArray(json.data) ? json.data : [];
        // Filter out already-dismissed show_once banners immediately
        const visible = data.filter((b) => !isDismissed(b));
        setBanners(visible);
      })
      .catch(() => {
        // Banner fetch is non-critical; fail silently
      });
  }, []);

  const handleDismiss = useCallback((banner: Banner) => {
    markDismissed(banner);
    setDismissed((prev) => new Set(prev).add(banner.id));
  }, []);

  // Only show banners not yet dismissed this session
  const visible = banners.filter((b) => !dismissed.has(b.id));

  if (visible.length === 0) return null;

  // Render banners in order; each type is independent
  // Top bars stack (rare), popups are stacked modals (typically admin creates just one active)
  return (
    <>
      {visible.map((banner) => {
        const key = banner.id;
        if (banner.banner_type === "popup") {
          return (
            <PopupBanner
              key={key}
              banner={banner}
              onDismiss={() => handleDismiss(banner)}
            />
          );
        }
        if (banner.banner_type === "top_bar") {
          return (
            <TopBarBanner
              key={key}
              banner={banner}
              onDismiss={() => handleDismiss(banner)}
            />
          );
        }
        if (banner.banner_type === "slide_in") {
          return (
            <SlideInBanner
              key={key}
              banner={banner}
              onDismiss={() => handleDismiss(banner)}
            />
          );
        }
        return null;
      })}
    </>
  );
}
