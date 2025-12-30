"use client";

import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { useEffect } from "react";

export default function Home() {
  const { success, error, warning, info } = useToast();

  useEffect(() => {
    success("This is a success message.");
    error("This is an error message.");
    warning("This is a warning message.");
    info("This is an info message.");
  }, []);

  return (
    <div className="">
      <Card className="border-none">
        Hello, Chariot! <span className="text-primary">Primary</span>
      </Card>
    </div>
  );
}
