import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  total: number;
  completed: number;
}

export function ProgressBar({ total, completed }: ProgressBarProps) {
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="flex-1">
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

