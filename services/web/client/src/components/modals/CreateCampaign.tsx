"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/useToast";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";

interface CreateCampaginPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
}
export default function CreateCampaginValidation({ isOpen, onClose, onConfirm }: CreateCampaginPopupProps) {
  // Pour gérer l'animation
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const t = useTranslations("CampaignModal");
  const global = useTranslations("Global");
  const { error } = useToast();

  const [name, setName] = useState<string>("");
  const nameRef = useRef<string>("");
  const [hasError, setError] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const checkName = () => {
    // Check if the name is empty
    if (nameRef.current.trim() === "") {
      error(t("emptyName"));
      setError(true);
      return false;
    }
    // Check if the name contains only spaces
    if (nameRef.current.trim().length !== 0) {
      onConfirm(nameRef.current);
      setError(false);
      return true;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        handleClose();
        return;
      }

      if (event.key === "Escape") {
        updateName("");
        setError(false);
        onClose();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onConfirm, onClose]);

  const updateName = (name: string) => {
    setName(name);
    nameRef.current = name;
  };

  const handleClose = () => {
    if (checkName()) {
      updateName("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}></div>

      <Card
        className={`p-5 w-1/4 relative transform transition-all duration-300 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
        {/* Contenu */}
        <div className="flex flex-col gap-6 text-center">
          <div className="flex flex-col gap-3">
            <h3 className="text-2xl">{t("title")}</h3>
            <div className="flex flex-col">
              <p>{t("subTitles.info")}</p>
              <p>{t("subTitles.warning")}</p>
            </div>
          </div>
          <div>
            <Input
              type={"text"}
              value={name}
              onChange={(e) => updateName(e.target.value)}
              placeholder={t("placeholder")}
              className={`bg-background ${hasError && "border-destructive"}`}
            />
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant={"outline"}
              onClick={onClose}>
              {global("cancel")}
            </Button>
            <Button onClick={() => handleClose()}>{t("actions.create")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
