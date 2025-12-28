// components/ValidationPopup.jsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";

interface ValidationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmMessage: string;
  onConfirm: () => void;
}
export default function ValidationPopup({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmMessage,
}: ValidationPopupProps) {
  // Pour gérer l'animation
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const t = useTranslations("Global");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        onConfirm();
        onClose();
        return;
      }

      if (event.key === "Escape") {
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onConfirm, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}></div>

      <Card
        className={`p-5 w-1/4 relative transform transition-all duration-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        {/* Contenu */}
        <div className="flex flex-col gap-5 text-center">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl">{title}</h3>
            <p>{message}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant={"outline"}
              onClick={() => {
                onConfirm();
                onClose();
              }}>
              {confirmMessage}
            </Button>
            <Button onClick={onClose}>{t("cancel")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
