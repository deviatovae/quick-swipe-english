import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProgressOverviewProps {
  total: number;
  completed: number;
  onReset: () => void;
}

export function ProgressOverview({ total, completed, onReset }: ProgressOverviewProps) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const handleReset = () => {
    if (window.confirm("Reset all progress?")) {
      onReset();
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Overall progress</CardTitle>
          <p className="text-sm text-muted-foreground">{completed} of {total} reviewed</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} />
        <p className="mt-2 text-sm text-muted-foreground">{percentage}% complete</p>
      </CardContent>
    </Card>
  );
}
