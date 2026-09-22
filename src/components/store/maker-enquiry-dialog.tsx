"use client";

import { Check, Copy, ExternalLink, Info, Phone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Craft } from "@/types";

/**
 * Manipur Tourism takes no payment and no commission, so this is not a checkout — it
 * hands the visitor the maker's own contact details and gets out of the way.
 */
export function MakerEnquiryDialog({ craft }: { craft: Craft }) {
  const [copied, setCopied] = useState<"phone" | "message" | null>(null);

  const message = `Hello ${craft.maker}, I found your ${craft.name} on Manipur Tourism and would like to enquire about buying one${
    craft.madeToOrder ? ", made to order" : ""
  }. Could you tell me about availability and delivery?`;

  const copy = async (value: string, key: "phone" | "message") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="primary" size="lg" className="w-full">
          <Phone aria-hidden="true" />
          Enquire with the maker
        </Button>
      </DialogTrigger>

      <DialogContent
        aria-describedby="enquiry-description"
        className="w-[calc(100%-2rem)] sm:w-full"
      >
        <DialogHeader>
          <DialogTitle>Contact {craft.maker}</DialogTitle>
          <DialogDescription id="enquiry-description">
            Your enquiry goes straight to the artisan — not to Manipur Tourism. We take no payment and no
            commission, so you agree the price, the making and the delivery with them directly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="rounded-[var(--radius)] border border-border bg-surface-sunken p-4">
            <p className="eyebrow text-muted-foreground">About</p>
            <p className="mt-1.5 text-sm">
              {craft.name} · {craft.location}, {craft.district}
            </p>
          </div>

          {craft.phone && (
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-muted-foreground">Phone</p>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${craft.phone.replace(/\s+/g, "")}`}>
                    <Phone aria-hidden="true" />
                    {craft.phone}
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(craft.phone ?? "", "phone")}
                >
                  {copied === "phone" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                  {copied === "phone" ? "Copied" : "Copy number"}
                </Button>
              </div>
            </div>
          )}

          {craft.website && (
            <div className="flex flex-col gap-2">
              <p className="eyebrow text-muted-foreground">Website</p>
              <Button asChild variant="outline" size="sm" className="self-start">
                <a href={craft.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink aria-hidden="true" />
                  Visit the maker&rsquo;s site
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="eyebrow text-muted-foreground">Something to say</p>
            <p className="rounded-[var(--radius)] border border-border bg-surface-sunken p-4 text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => copy(message, "message")}
            >
              {copied === "message" ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              {copied === "message" ? "Copied" : "Copy message"}
            </Button>
          </div>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Contact details are placeholders in this prototype and are not verified numbers. On the
            live site they are supplied and confirmed by the maker.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
