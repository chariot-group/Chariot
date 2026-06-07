import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  id: string;
  children: ReactNode;
  className?: string;
}

export default function ProfileSection({ title, id, children, className }: ProfileSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <h2
          id={id}
          className="text-lg sm:text-xl font-bold shrink-0">
          {title}
        </h2>
        <div
          className="flex-1 h-px bg-white/20 min-w-0"
          aria-hidden="true"
        />
      </div>
      {children}
    </section>
  );
}
