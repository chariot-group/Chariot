import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface IChampsProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: any | null;
  setValue: (value: any) => void;
  onChange?: () => void;
  color?: string;
  isActive?: boolean;
}
export default function Field({
  id,
  type,
  label,
  placeholder,
  value,
  setValue,
  color = "background",
  onChange,
  isActive = true,
}: IChampsProps) {
  const [pending, setPending] = useState(false);

  const handleChange = (e: any) => {
    setPending(true);
    setValue(e.target.value);
  };

  useEffect(() => {
    if (pending) {
      onChange?.();
      setPending(false);
    }
  }, [value]);

  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label
        htmlFor={id}
        className="text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        className={`bg-${color}`}
        readOnly={!isActive}
      />
    </div>
  );
}
