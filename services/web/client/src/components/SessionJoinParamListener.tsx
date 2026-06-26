"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { JoinSessionDialog } from "@/components/dialogs/JoinSessionDialog";

export default function SessionJoinParamListener() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const joinCode = searchParams.get("join");
  const processedRef = useRef<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialCode, setInitialCode] = useState("");

  useEffect(() => {
    if (!joinCode || processedRef.current === joinCode) return;
    processedRef.current = joinCode;
    setInitialCode(joinCode.toUpperCase());
    setDialogOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("join");
    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`);
  }, [joinCode, pathname, router, searchParams]);

  if (!dialogOpen) return null;

  return (
    <JoinSessionDialog
      open={dialogOpen}
      onOpenChange={setDialogOpen}
      initialCode={initialCode}
    />
  );
}
