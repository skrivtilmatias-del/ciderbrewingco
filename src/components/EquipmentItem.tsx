import { EquipmentType } from "@/constants/equipment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EquipmentItemProps {
  equipment: EquipmentType;
  onDragStart: (equipment: EquipmentType) => void;
}

export const EquipmentItem = ({ equipment, onDragStart }: EquipmentItemProps) => {
  const Icon = equipment.icon;
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('equipment', JSON.stringify(equipment));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(equipment);
  };
  
  return (
    <Card
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: equipment.color }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{equipment.name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {equipment.width}m × {equipment.depth}m
          </p>
          {equipment.capacity && (
            <Badge variant="secondary" className="mt-1 text-xs">
              {equipment.capacity}L
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
