"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { removePhoto } from "@/lib/community/admin-actions";
import type { ActionResult } from "@/lib/community/types";

const FAILED: ActionResult = {
  ok: false,
  error: "That photo could not be removed. Check your connection and try again.",
};

/**
 * Remove one photo, after a confirmation that says what removal means: the
 * image file is deleted for good and only the record of the upload stays.
 */
export function CommunityRemovePhotoButton({
  photoId,
  label,
  onRemoved,
  className,
}: {
  photoId: string;
  /** What the photo is, for the button's accessible name, e.g. "photo 2 of Loktak". */
  label: string;
  onRemoved?: () => void;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [removing, startRemoving] = useTransition();

  function remove() {
    startRemoving(async () => {
      let result: ActionResult;
      try {
        result = await removePhoto(photoId);
      } catch {
        result = FAILED;
      }
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      onRemoved?.();
      toast.success("Photo removed", {
        description: "The image file is deleted. The upload record stays for reference.",
      });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !removing && setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className} aria-label={`Remove ${label}`}>
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove this photo?</DialogTitle>
          <DialogDescription>
            The image file is deleted from storage straight away and cannot be recovered. It
            disappears from every page, including the public place page. The record of who
            uploaded it, and when, is kept. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={removing}>
            Keep the photo
          </Button>
          <Button variant="destructive" onClick={remove} disabled={removing}>
            {removing && <Loader2 className="animate-spin" aria-hidden="true" />}
            Remove for good
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
