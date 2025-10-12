import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplets, FlaskConical, Eye, Plus, Calendar, AlertCircle } from "lucide-react";

interface QuickActionsPanelProps {
  onAddMeasurement: () => void;
  onAddObservation: () => void;
  onScheduleTask: () => void;
  onAddGeneral: () => void;
}

export const QuickActionsPanel = ({
  onAddMeasurement,
  onAddObservation,
  onScheduleTask,
  onAddGeneral
}: QuickActionsPanelProps) => {
  const actions = [
    {
      label: "Take Measurement",
      icon: FlaskConical,
      onClick: onAddMeasurement,
      color: "bg-info/10 text-info hover:bg-info/20",
      description: "Log OG, FG, pH, temp"
    },
    {
      label: "Record Observation",
      icon: Eye,
      onClick: onAddObservation,
      color: "bg-warning/10 text-warning hover:bg-warning/20",
      description: "Visual or taste notes"
    },
    {
      label: "Add Note",
      icon: Plus,
      onClick: onAddGeneral,
      color: "bg-primary/10 text-primary hover:bg-primary/20",
      description: "General batch note"
    }
  ];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className={`h-auto flex-col items-start p-3 ${action.color}`}
            onClick={action.onClick}
          >
            <div className="flex items-center gap-2 w-full mb-1">
              <action.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
            <span className="text-xs opacity-80">{action.description}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
