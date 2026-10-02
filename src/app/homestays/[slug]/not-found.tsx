import { Compass } from "lucide-react";

import { IntentLink } from "@/components/shared/intent-link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[60vh] flex-col items-center justify-center pb-24 pt-28 text-center md:pt-32">
      <span className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <h1 className="text-headline">We could not find that home</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        It may have been unlisted while the hosts take a break. There are plenty of other rooms
        with a view of the water.
      </p>
      <Button asChild className="mt-8">
        <IntentLink href="/homestays">Browse all stays</IntentLink>
      </Button>
    </div>
  );
}
