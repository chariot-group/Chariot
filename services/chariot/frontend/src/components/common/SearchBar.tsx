import { Input } from "@/components/ui/input";
import { CircleDashedIcon, CrossIcon, DeleteIcon, Search, XIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  reverse?: boolean;
}

const SearchInput = ({ value, onChange, placeholder, reverse = false }: Props) => (
  <div className="relative w-full">
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`pr-10 w-full border-ring shadow-md ${reverse ? "bg-background" : "bg-card"}`}
    />
    {value.length <= 0 && <Search className="size-5 absolute right-3 top-1/2 -translate-y-1/2" />}
    {value.length > 0 && (
      <XIcon
        className="cursor-pointer size-5 absolute right-3 top-1/2 -translate-y-1/2"
        onClick={() => onChange("")}
      />
    )}
  </div>
);

export default SearchInput;
