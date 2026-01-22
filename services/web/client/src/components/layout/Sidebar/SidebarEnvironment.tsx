import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAppDispatch } from "@/store/hooks";
import { ContextMode, setContextMode } from "@/store/slices/environmentSlice";
import { ChevronRight, PlusCircleIcon } from "lucide-react";
import { useState } from "react";

export default function SidebarEnvironment() {
  const [open, setOpen] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  function changeEnvironment(environment: ContextMode) {
    dispatch(setContextMode(environment));
  }

  return (
    <Collapsible
      className={`rounded-[15px] border-2`}
      open={open}
      onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={`w-full ${open && "bg-white"} border-1 cursor-pointer hover:bg-white py-1.5 px-3 rounded-[12px] transition-all duration-150 flex justify-between items-center w-full group`}>
        <span className={`text-sm ${open && "text-black font-bold"} group-hover:font-bold group-hover:text-black`}>
          Vos espaces
        </span>
        <ChevronRight
          className={`w-5 h-5 ${open && "rotate-90 text-black"} group-hover:text-black transition-all duration-100`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="my-2 flex mx-5 flex-col gap-3">
        <span
          onClick={() => changeEnvironment("player")}
          className={`text-sm text-black cursor-pointer border hover:font-bold bg-white transition-all duration-100 rounded-[12px] py-1.5 px-3 w-full`}>
          Vos personnages
        </span>

        <div className="w-full border">{/* Liste des campagnes */}</div>

        <span
          onClick={() => changeEnvironment("gm")}
          className="text-sm cursor-pointer flex hover:font-bold justify-between transition-all duration-100 text-black border bg-white rounded-[12px] py-1.5 px-3 w-full">
          Créer une campaigne
          <PlusCircleIcon className="w-5 h-5" />
        </span>
        <div className="flex flex-col gap-2"></div>
      </CollapsibleContent>
    </Collapsible>
  );
}
