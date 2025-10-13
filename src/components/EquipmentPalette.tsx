import { EquipmentType, EQUIPMENT_DATABASE } from "@/constants/equipment";
import { EquipmentItem } from "./EquipmentItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EquipmentPaletteProps {
  onEquipmentSelect: (equipment: EquipmentType) => void;
}

export const EquipmentPalette = ({ onEquipmentSelect }: EquipmentPaletteProps) => {
  const groupedEquipment = EQUIPMENT_DATABASE.reduce((acc, equipment) => {
    if (!acc[equipment.type]) {
      acc[equipment.type] = [];
    }
    acc[equipment.type].push(equipment);
    return acc;
  }, {} as Record<string, EquipmentType[]>);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Equipment Library</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Drag equipment onto the floor plan
        </p>
      </div>

      <Tabs defaultValue="tank" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="tank">Tanks</TabsTrigger>
          <TabsTrigger value="press">Press</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="bottling">Bottling</TabsTrigger>
          <TabsTrigger value="workstation">Work</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 px-4">
          {Object.entries(groupedEquipment).map(([type, items]) => (
            <TabsContent key={type} value={type} className="mt-4 space-y-2">
              {items.map((equipment) => (
                <EquipmentItem
                  key={equipment.id}
                  equipment={equipment}
                  onDragStart={onEquipmentSelect}
                />
              ))}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
    </div>
  );
};
