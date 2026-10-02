"use client";

import type { CSSProperties } from "react";

/**
 * Last-resort error page, for a failure in the root layout itself (the
 * header, the footer, `Providers`), which `app/error.tsx` cannot catch: an
 * error boundary does not wrap the layout of its own segment.
 *
 * While it is showing it REPLACES the root layout, so it brings its own
 * `<html>` and `<body>` and depends on nothing the layout provides: no
 * globals.css, no fonts, no theme, no components that could be the thing that
 * broke. Hence the inline styles, kept to the house palette (ivory ground,
 * ink text, crimson action) and a system font stack.
 *
 * `retry` (stable since Next 16.3) re-fetches and re-renders the segment; a
 * plain link home is the way out if that fails again. A full page load, not
 * `next/link`, because the client router may be what is broken.
 */

const page: CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "24px 16px",
  background: "#fbf8f3",
  color: "#16130f",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  lineHeight: 1.5,
};

const card: CSSProperties = { maxWidth: "32rem", textAlign: "center" };

const button: CSSProperties = {
  font: "inherit",
  fontWeight: 600,
  padding: "10px 20px",
  borderRadius: 999,
  border: "none",
  background: "#5c1020",
  color: "#fbf8f3",
  cursor: "pointer",
};

const link: CSSProperties = {
  fontWeight: 600,
  padding: "10px 20px",
  borderRadius: 999,
  border: "1px solid #e8e0d2",
  color: "inherit",
  textDecoration: "none",
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={page}>
        <title>Something went wrong · Discover Manipur</title>
        <main style={card}>
          <h1 style={{ fontSize: "1.75rem", lineHeight: 1.2, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ margin: "0 0 28px", color: "#6b5f54" }}>
            Discover Manipur could not load this page. It is usually temporary, so please try
            again.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <button type="button" style={button} onClick={() => retry()}>
              Try again
            </button>
            {/* A full page load on purpose: see the note above. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={link}>
              Go to the homepage
            </a>
          </div>
          {error.digest && (
            <p style={{ marginTop: 28, fontSize: "0.875rem", color: "#6b5f54" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
