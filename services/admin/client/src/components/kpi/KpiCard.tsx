import type { ElementType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiTitle } from "@/components/kpi/KpiInfo";

export function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
  info,
  color = "text-primary",
}: {
  title: string;
  value: string;
  icon: ElementType;
  sub?: string;
  info: string;
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <KpiTitle info={info}>{title}</KpiTitle>
          </CardTitle>
          <Icon className={`h-4 w-4 shrink-0 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold text-card-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
