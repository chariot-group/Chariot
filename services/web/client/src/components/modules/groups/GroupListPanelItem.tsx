import React, { useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { IGroup } from "@/models/groups/IGroup";
import { Grip } from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

interface Props {
  group: IGroup;
  reverse?: boolean;
  grabbled?: boolean;
  currentPanelType: string;
  setGroupSelected?: (group: IGroup) => void;
  groupSelected?: IGroup | null;
  idCampaign: string;
  disabled?: boolean;
  clickable?: boolean;
  changeLabel?: (label: string, group: IGroup) => void;
  updated?: boolean;
  displayMembersCount?: boolean;
}

const GroupListPanelItem = ({
  group,
  reverse,
  grabbled = false,
  currentPanelType,
  setGroupSelected,
  groupSelected,
  idCampaign,
  disabled = false,
  clickable = true,
  changeLabel,
  updated,
  displayMembersCount,
}: Props) => {
  const t = useTranslations("GroupListPanelItem");
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: group._id,
    data: {
      group,
      from: currentPanelType,
    },
  });

  const router = useRouter();

  const isOverlay = currentPanelType === "overlay";

  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  const pointerStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (event: React.MouseEvent) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseUp = (event: React.MouseEvent) => {
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5 && setGroupSelected && clickable) {
      router.push(`/campaigns/${idCampaign}/groups?search=${group.label}`);
    }
  };

  return (
    <Card
      ref={!isOverlay ? setNodeRef : undefined}
      style={isOverlay ? {} : style}
      onMouseDown={!isOverlay && !grabbled ? handleMouseDown : undefined}
      onMouseUp={!isOverlay && !grabbled ? handleMouseUp : undefined}
      className={`flex p-2 cursor-pointer border-ring items-center shadow-md hover:shadow-[inset_0_0_0_1px_hsl(var(--ring))] ${
        reverse ? "bg-background" : "bg-card"
      } ${grabbled && "cursor-pointer justify-center"} ${
        isOverlay ? "opacity-80 scale-105 pointer-events-none" : ""
      } ${groupSelected?._id === group._id ? "border-2" : ""} ${updated && "pl-0"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={(e) => {
        if (setGroupSelected && !disabled && !grabbled) {
          setGroupSelected(group);
        }
      }}>
      {!grabbled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-between items-center w-full">
              <span className="cursor-pointer text-foreground font-bold">{group.label}</span>
              {displayMembersCount && (
                <span className="text-muted-foreground ml-2">
                  {group.characters ? `(${group.characters.length})` : `(0)`}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {group.characters
                ? `${group.characters.length} ${t(group.characters.length === 1 ? "member" : "members")}`
                : `0 ${t("members")}`}
            </p>
          </TooltipContent>
        </Tooltip>
      )}

      {grabbled && updated && <span className="rounded-full bg-secondary size-2 m-1"></span>}

      {grabbled && changeLabel && (
        <div className="flex items-center gap-2">
          <Input
            value={group.label}
            id={group._id}
            className="bg-card"
            placeholder={t("newGroup")}
            onChange={(e) => changeLabel(e.target.value, group)}
          />
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing">
            <Grip />
          </span>
        </div>
      )}
    </Card>
  );
};

export default GroupListPanelItem;
