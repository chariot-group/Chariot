"use client";

import { DndContext, DragEndEvent, DragOverlay, closestCorners } from "@dnd-kit/core";
import { useState } from "react";
import GroupListPanelItem from "./GroupListPanelItem";
import { IGroup } from "@/models/groups/IGroup";

export default function GroupDnDWrapper({
  onDragEnd,
  children,
}: {
  onDragEnd: (event: DragEndEvent) => void;
  children: React.ReactNode;
}) {
  const [activeGroup, setActiveGroup] = useState<IGroup | null>(null);

  const internalHandleDragEnd = (event: DragEndEvent) => {
    onDragEnd(event);
    setActiveGroup(null);
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragStart={(event) => {
        const group = event.active.data.current?.group as IGroup;
        setActiveGroup(group);
      }}
      onDragEnd={(event) => internalHandleDragEnd(event)}
      onDragCancel={() => setActiveGroup(null)}>
      {children}

      <DragOverlay>
        {activeGroup ? (
          <GroupListPanelItem
            idCampaign={""}
            group={activeGroup}
            currentPanelType={"overlay"}
            grabbled={true}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
