import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface Props {
  onMinusClicked: (value: number) => void;
  onPlusClicked: (value: number) => void;
}

const InitiativeDamagePopover = ({ onMinusClicked, onPlusClicked }: Props) => {
  const [delta, setDelta] = useState<string>("0");

  return (
    <div className="flex flex-row justify-between items-center">
      <Input
        className="w-20 bg-card  md:text-xl font-semibold"
        value={delta}
        onChange={(e) => {
          const value = e.target.value;
          if (!/^\d*$/.test(value) || value.length > 4) return;
          setDelta(value);
        }}
      />
      <div className="flex justify-between gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onMinusClicked(Number(delta))}>
          <Minus />
        </Button>
        <Button
          variant={"secondary"}
          size="sm"
          onClick={() => onPlusClicked(Number(delta))}>
          <Plus />
        </Button>
      </div>
    </div>
  );
};

export default InitiativeDamagePopover;
