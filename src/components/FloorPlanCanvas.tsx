import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Rect, Text, Group, Line } from "react-konva";
import { EquipmentType, EQUIPMENT_DATABASE } from "@/constants/equipment";
import { PlacedEquipment, getEquipmentBounds, metersToPixels, pixelsToMeters, snapToGrid, checkCollision, generateEquipmentId, isWithinFloor } from "@/lib/floorPlanUtils";
import Konva from "konva";

interface FloorPlanCanvasProps {
  floorWidth: number;
  floorHeight: number;
  placedEquipment: PlacedEquipment[];
  onEquipmentPlace: (equipment: PlacedEquipment) => void;
  onEquipmentMove: (id: string, x: number, y: number) => void;
  onEquipmentRotate: (id: string) => void;
  onEquipmentDelete: (id: string) => void;
  draggedEquipment: EquipmentType | null;
  selectedEquipmentId: string | null;
  onSelectEquipment: (id: string | null) => void;
}

const SCALE = 50; // 1 meter = 50 pixels
const GRID_SIZE = 0.5; // 0.5 meter grid

export const FloorPlanCanvas = ({
  floorWidth,
  floorHeight,
  placedEquipment,
  onEquipmentPlace,
  onEquipmentMove,
  onEquipmentRotate,
  onEquipmentDelete,
  draggedEquipment,
  selectedEquipmentId,
  onSelectEquipment
}: FloorPlanCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleDrop = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.evt.preventDefault();
    if (!draggedEquipment) return;

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const x = snapToGrid(pixelsToMeters(pointerPosition.x, SCALE), GRID_SIZE);
    const y = snapToGrid(pixelsToMeters(pointerPosition.y, SCALE), GRID_SIZE);

    const bounds = getEquipmentBounds(draggedEquipment, x, y, 0);
    
    // Check if within floor
    if (!isWithinFloor(bounds, floorWidth, floorHeight)) {
      return;
    }

    // Check collisions
    const hasCollision = placedEquipment.some(placed => {
      const placedEquipmentData = EQUIPMENT_DATABASE.find(e => e.id === placed.equipmentId);
      if (!placedEquipmentData) return false;
      
      const placedBounds = getEquipmentBounds(placedEquipmentData, placed.x, placed.y, placed.rotation);
      return checkCollision(bounds, placedBounds, draggedEquipment.minClearance);
    });

    if (hasCollision) return;

    onEquipmentPlace({
      id: generateEquipmentId(),
      equipmentId: draggedEquipment.id,
      x,
      y,
      rotation: 0
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedEquipmentId) return;
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      onEquipmentDelete(selectedEquipmentId);
      onSelectEquipment(null);
    } else if (e.key === 'r' || e.key === 'R') {
      onEquipmentRotate(selectedEquipmentId);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEquipmentId]);

  // Draw grid lines
  const gridLines = [];
  for (let i = 0; i <= floorWidth / GRID_SIZE; i++) {
    const x = metersToPixels(i * GRID_SIZE, SCALE);
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, metersToPixels(floorHeight, SCALE)]}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }
  for (let i = 0; i <= floorHeight / GRID_SIZE; i++) {
    const y = metersToPixels(i * GRID_SIZE, SCALE);
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, metersToPixels(floorWidth, SCALE), y]}
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full bg-white rounded-lg border">
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onDrop={handleDrop}
        onDragOver={(e) => e.evt.preventDefault()}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            onSelectEquipment(null);
          }
        }}
      >
        <Layer>
          {/* Floor background */}
          <Rect
            x={0}
            y={0}
            width={metersToPixels(floorWidth, SCALE)}
            height={metersToPixels(floorHeight, SCALE)}
            fill="#f9fafb"
            stroke="#000"
            strokeWidth={2}
          />

          {/* Grid */}
          {gridLines}

          {/* Dimensions */}
          <Text
            x={metersToPixels(floorWidth / 2, SCALE) - 30}
            y={-25}
            text={`${floorWidth}m`}
            fontSize={14}
            fill="#000"
          />
          <Text
            x={metersToPixels(floorWidth, SCALE) + 10}
            y={metersToPixels(floorHeight / 2, SCALE) - 10}
            text={`${floorHeight}m`}
            fontSize={14}
            fill="#000"
          />

          {/* Placed equipment */}
          {placedEquipment.map((placed) => {
            const equipmentData = EQUIPMENT_DATABASE.find(e => e.id === placed.equipmentId);
            if (!equipmentData) return null;

            const bounds = getEquipmentBounds(equipmentData, placed.x, placed.y, placed.rotation);
            const isSelected = placed.id === selectedEquipmentId;

            return (
              <Group
                key={placed.id}
                x={metersToPixels(placed.x, SCALE)}
                y={metersToPixels(placed.y, SCALE)}
                draggable
                onDragEnd={(e) => {
                  const x = snapToGrid(pixelsToMeters(e.target.x(), SCALE), GRID_SIZE);
                  const y = snapToGrid(pixelsToMeters(e.target.y(), SCALE), GRID_SIZE);
                  onEquipmentMove(placed.id, x, y);
                  e.target.position({
                    x: metersToPixels(x, SCALE),
                    y: metersToPixels(y, SCALE)
                  });
                }}
                onClick={() => onSelectEquipment(placed.id)}
              >
                <Rect
                  width={metersToPixels(bounds.width, SCALE)}
                  height={metersToPixels(bounds.height, SCALE)}
                  fill={equipmentData.color}
                  stroke={isSelected ? '#000' : '#fff'}
                  strokeWidth={isSelected ? 3 : 1}
                  opacity={0.8}
                  cornerRadius={4}
                />
                <Text
                  x={metersToPixels(bounds.width / 2, SCALE)}
                  y={metersToPixels(bounds.height / 2, SCALE) - 10}
                  text={equipmentData.name}
                  fontSize={12}
                  fill="#fff"
                  align="center"
                  offsetX={metersToPixels(bounds.width / 2, SCALE)}
                />
                {equipmentData.capacity && (
                  <Text
                    x={metersToPixels(bounds.width / 2, SCALE)}
                    y={metersToPixels(bounds.height / 2, SCALE) + 5}
                    text={`${equipmentData.capacity}L`}
                    fontSize={10}
                    fill="#fff"
                    align="center"
                    offsetX={metersToPixels(bounds.width / 2, SCALE)}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
