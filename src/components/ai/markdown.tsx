"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A deliberately small markdown renderer for streamed assistant text.
 *
 * It builds React elements rather than injecting HTML, so a half-finished
 * stream can never produce broken or unsafe markup. It understands exactly what
 * the concierge is told to emit: headings, paragraphs, lists, bold, italic,
 * inline code and links.
 */

const INLINE = /(\[[^\]\n]+\]\([^)\s]+\))|(\*\*[^*\n]+\*\*)|(`[^`\n]+`)|(\*[^*\n]+\*)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    const token = match[0];
    const key = `${keyPrefix}-${index}`;
    index += 1;

    if (token.startsWith("[")) {
      const split = token.indexOf("](");
      const label = token.slice(1, split);
      const href = token.slice(split + 2, -1);
      const classes =
        "font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
      // Model output is untrusted: "//host" and "/\host" leave the site, and
      // `javascript:` and friends must never reach an href.
      if (/^\/(?![\/\\])/.test(href)) {
        nodes.push(
          <Link key={key} href={href} className={classes}>
            {label}
          </Link>,
        );
      } else if (/^https?:\/\//i.test(href)) {
        nodes.push(
          <a key={key} href={href} className={classes} target="_blank" rel="noreferrer noopener">
            {label}
          </a>,
        );
      } else {
        nodes.push(label);
      }
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded-[var(--radius-sm)] bg-muted px-1.5 py-0.5 text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    }

    cursor = start + token.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "h"; level: 2 | 3 | 4; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "p", lines: [] });
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(Math.max(heading[1].length, 2), 4) as 2 | 3 | 4;
      blocks.push({ type: "h", level, text: heading[2] });
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(trimmed);
    if (ordered) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") last.items.push(ordered[1]);
      else blocks.push({ type: "ol", items: [ordered[1]] });
      continue;
    }

    const last = blocks[blocks.length - 1];
    if (last?.type === "p" && last.lines.length > 0) last.lines.push(trimmed);
    else blocks.push({ type: "p", lines: [trimmed] });
  }

  return blocks.filter((b) => b.type !== "p" || b.lines.length > 0);
}

export function Markdown({ children, className }: { children: string; className?: string }) {
  const blocks = parse(children);

  return (
    <div className={cn("space-y-3 text-sm leading-relaxed text-foreground", className)}>
      {blocks.map((block, i) => {
        const key = `b${i}`;
        switch (block.type) {
          case "h": {
            const Tag = block.level === 2 ? "h2" : block.level === 3 ? "h3" : "h4";
            return (
              <Tag key={key} className="font-display text-base font-semibold tracking-tight text-foreground">
                {renderInline(block.text, key)}
              </Tag>
            );
          }
          case "ul":
            return (
              <ul key={key} className="list-disc space-y-1.5 pl-5 marker:text-accent">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key} className="list-decimal space-y-1.5 pl-5 marker:text-muted-foreground">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          default:
            return (
              <p key={key}>
                {block.lines.map((l, j) => (
                  <Fragment key={`${key}-${j}`}>
                    {j > 0 && " "}
                    {renderInline(l, `${key}-${j}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
