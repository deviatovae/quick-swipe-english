import { Card, CardContent } from "@/components/ui/card";

interface StatisticsGridProps {
  known: number;
  unknown: number;
  total: number;
}

const items = (
  known: number,
  unknown: number,
  total: number,
) => [
  {
    label: "Known words",
    value: known,
  },
  {
    label: "Needs review",
    value: unknown,
  },
  {
    label: "Not seen yet",
    value: Math.max(total - (known + unknown), 0),
  },
  {
    label: "Accuracy",
    value:
      known + unknown === 0
        ? 0
        : Math.round((known / (known + unknown)) * 100),
    suffix: "%",
  },
];

export function StatisticsGrid(props: StatisticsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items(props.known, props.unknown, props.total).map((item) => (
        <Card key={item.label} className="bg-muted/40">
          <CardContent className="space-y-1 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="text-2xl font-semibold">
              {item.value}
              {item.suffix}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
