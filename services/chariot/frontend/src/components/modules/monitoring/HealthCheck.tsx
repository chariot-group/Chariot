"use client";

import HealthService from "@/services/healthService";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const HealthCheck = () => {
  const t = useTranslations("HealthCheck");
  const [status, setStatus] = useState(t("status.loading"));

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await HealthService.getHealth();
        setStatus(status === 200 ? t("status.ok") : t("status.error"));
      } catch {
        setStatus(t("status.error"));
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000); // Vérifie toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`p-4 rounded-md text-white ${status === t("status.ok") ? "bg-green-500" : "bg-red-500"}`}>
      {t("status.label")} : {status.toUpperCase()}
    </div>
  );
};

export default HealthCheck;
