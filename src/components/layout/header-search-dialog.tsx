"use client";

import { SearchInput } from "@/components/search/search-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The header's site search, in a dialog.
 *
 * A file of its own so the header can load it with `next/dynamic` on first
 * use: `SearchInput` (and the dialog chrome) is only ever needed after a
 * reader presses the search button or Ctrl/Cmd+K, so it stays out of the
 * first-load JavaScript every route ships. The header mounts this once the
 * dialog has been opened the first time and keeps it mounted afterwards, so
 * closing still plays the exit animation and reopening is instant.
 *
 * Focus: Radix moves focus into the dialog on open (the input asks for it with
 * `autoFocus`). On close Radix would only hand focus back to a
 * `Dialog.Trigger`, and there is none: the dialog opens from a plain button
 * and from Ctrl/Cmd+K, so left to itself focus would fall to <body>. The
 * header therefore remembers what held focus when it opened the dialog and
 * restores it in `onCloseAutoFocus`, which it passes in here.
 */
export function HeaderSearchDialog({
  open,
  onOpenChange,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Radix's close-focus hook: call `event.preventDefault()` and move focus
   *  yourself, or leave it to Radix (which, with no trigger, means <body>). */
  onCloseAutoFocus?: (event: Event) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[12vh] max-w-2xl translate-y-0 overflow-visible p-6"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle>Search Manipur</DialogTitle>
          <DialogDescription>
            Places, stays, experiences, food and tours.
          </DialogDescription>
        </DialogHeader>
        <SearchInput
          autoFocus
          size="lg"
          label="Search Manipur"
          placeholder="Loktak, Ukhrul, eromba, weaving…"
          onNavigate={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
