import * as React from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteIconButtonProps = Omit<React.ComponentProps<typeof Button>, "variant" | "size" | "children"> & {
  "aria-label": string;
};

/** Shared trash button for removing a row or block in edit forms: same size, color and hover everywhere. */
function DeleteIconButton({ className, type = "button", ...props }: DeleteIconButtonProps) {
  return (
    <Button
      type={type}
      variant="ghost"
      size="icon"
      data-slot="delete-icon-button"
      className={cn("text-red hover:bg-red/10 hover:text-red disabled:hover:bg-transparent", className)}
      {...props}>
      <Trash2
        className="size-4"
        aria-hidden="true"
      />
    </Button>
  );
}

export { DeleteIconButton };
