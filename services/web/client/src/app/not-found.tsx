import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Page() {
    return (
        <div className="w-full h-dvh flex flex-col items-center justify-center bg-background">
        <Card className="w-[40%] shadow-md relative">
          <div className="p-6 w-full flex flex-col items-center justify-center gap-[3dvh]">
            <div className="flex flex-col items-center justify-center gap-2">
              <h1 className="text-xl font-bold">Critical failure, page not found</h1>
              <p className="text-muted-foreground text-center">Location roll: 1. The owlbear stares at the sign... but the sign doesn't respond.</p>
            </div>
            <img src={"/illustrations/404/404_Owlbear_wb.webp"} alt="Owlbear 404 illustration" className="w-1/2" />
            <Link href="/" >
              <Button>Back to home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
}