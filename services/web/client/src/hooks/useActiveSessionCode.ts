"use client";

import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { selectSessionCode } from "@/store/slices/sessionSlice";

export function useActiveSessionCode(): string | null {
  const searchParams = useSearchParams();
  const reduxSessionCode = useAppSelector(selectSessionCode);
  const querySessionCode = searchParams.get("sessionCode")?.trim();

  return querySessionCode || reduxSessionCode || null;
}
