"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const t = useTranslations("error");

  useEffect(() => {
    // Log l'erreur côté client pour le monitoring
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-lg w-full border-none p-6">
        <CardHeader>
          <CardTitle className="text-2xl text-white">{t("title")}</CardTitle>
          <CardDescription className="text-white">{t("description")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg p-4">
            <p className="text-sm font-mono italic flex items-center gap-2">
              <XCircle className="text-destructive size-6" />
              {error.message || t("unknownError")}
            </p>
          </div>

          <div className="text-sm text-white space-y-2">
            <p>{t("suggestion")}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t("suggestions.refresh")}</li>
              <li>{t("suggestions.retry")}</li>
              <li>{t("suggestions.contact")}</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex gap-3">
          <button
            onClick={reset}
            className="cursor-pointer flex-1 px-4 py-2 ring hover:ring-1 rounded-lg transition-colors font-medium">
            {t("actions.retry")}
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="cursor-pointer flex-1 px-4 py-2 bg-primary rounded-lg hover:bg-primary/90 transition-colors font-medium">
            {t("actions.home")}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
