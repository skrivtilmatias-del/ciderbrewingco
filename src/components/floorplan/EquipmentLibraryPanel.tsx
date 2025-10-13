import { useState } from "react";
import { Search, Box, Factory, Warehouse, Wine, Wrench } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { AddEquipmentDialog } from "./AddEquipmentDialog";
import { EquipmentCategory, EquipmentCatalogItem } from "@/types/floorplan";

const categoryIcons = {
  tank: Box,
  press: Factory,
  storage: Warehouse,
  bottling: Wine,
  workstation: Wrench,
};

export const EquipmentLibraryPanel = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const catalog = useFloorPlanStore((s) => s.catalog);
  
  const filteredCatalog = catalog.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const groupedEquipment = filteredCatalog.reduce((acc, equipment) => {
    if (!acc[equipment.category]) {
      acc[equipment.category] = [];
    }
    acc[equipment.category].push(equipment);
    return acc;
  }, {} as Record<EquipmentCategory, EquipmentCatalogItem[]>);
  
  const handleDragStart = (e: React.DragEvent, equipment: EquipmentCatalogItem) => {
    const payload = JSON.stringify(equipment);
    e.dataTransfer.setData('equipment', payload);
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.effectAllowed = 'copy';
  };
  
  const categoryLabels: Record<EquipmentCategory, string> = {
    tank: 'Tanks',
    press: 'Press',
    storage: 'Storage',
    bottling: 'Bottling',
    workstation: 'Tools',
  };
  
  return (
    <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-card flex flex-col max-h-96 lg:max-h-none">
      <div className="p-3 sm:p-4 border-b space-y-3 flex-shrink-0">
        <h3 className="font-semibold text-base sm:text-lg">Equipment Library</h3>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <Tabs defaultValue="tank" className="flex-1 flex flex-col">
        <div className="mx-4 mt-3 bg-muted/50 p-1 rounded-lg">
          <TabsList className="w-full h-auto grid grid-cols-5 gap-1 bg-transparent p-0">
            <TabsTrigger 
              value="tank" 
              className="px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Tanks
            </TabsTrigger>
            <TabsTrigger 
              value="press" 
              className="px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Press
            </TabsTrigger>
            <TabsTrigger 
              value="storage" 
              className="px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Storage
            </TabsTrigger>
            <TabsTrigger 
              value="bottling" 
              className="px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Bottling
            </TabsTrigger>
            <TabsTrigger 
              value="workstation" 
              className="px-3 py-1.5 text-sm font-medium rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Tools
            </TabsTrigger>
          </TabsList>
        </div>
        
        <ScrollArea className="flex-1 px-4 pb-4">
          {Object.entries(categoryLabels).map(([category, label]) => (
            <TabsContent key={category} value={category} className="mt-4 space-y-2">
              {groupedEquipment[category as EquipmentCategory]?.length > 0 ? (
                groupedEquipment[category as EquipmentCategory].map((equipment) => {
                  const Icon = categoryIcons[equipment.category];
                  
                  return (
                    <Card
                      key={equipment.id}
                      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, equipment)}
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
                            {equipment.widthM}m × {equipment.heightM}m
                          </p>
                          {equipment.capacityL && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {equipment.capacityL}L
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No {label.toLowerCase()} found
                </p>
              )}
            </TabsContent>
          ))}
        </ScrollArea>
      </Tabs>
      
      <div className="p-4 border-t">
        <AddEquipmentDialog />
      </div>
    </div>
  );
};
