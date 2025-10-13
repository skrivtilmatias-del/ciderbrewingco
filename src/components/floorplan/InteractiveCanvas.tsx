import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Group, Text, Transformer, Line } from "react-konva";
import Konva from "konva";
import { useFloorPlanStore } from "@/stores/floorplanStore";
import { m2px, px2m, snapM } from "@/types/floorplan";
import { EquipmentCatalogItem } from "@/types/floorplan";

const GRID_SIZE = 0.5; // meters

export const InteractiveCanvas = () => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  
  const {
    plan,
    catalog,
    selectedItemId,
    setSelectedItemId,
    updateItem,
    addItem,
    snapToGrid,
    zoomLevel,
  } = useFloorPlanStore();
  
  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('canvas-container');
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  useEffect(() => {
    if (transformerRef.current && selectedItemId) {
      const stage = stageRef.current;
      if (!stage) return;
      
      const selectedNode = stage.findOne(`#item-${selectedItemId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedItemId]);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItemId) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        useFloorPlanStore.getState().removeItem(selectedItemId);
      }
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        useFloorPlanStore.getState().duplicateItem(selectedItemId);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId]);
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const stage = stageRef.current;
    if (!stage) return;
    
    try {
      const equipmentData = e.dataTransfer.getData('equipment');
      if (!equipmentData) return;
      
      const equipment: EquipmentCatalogItem = JSON.parse(equipmentData);
      
      const pos = stage.getPointerPosition();
      if (!pos) return;
      
      // Convert to meters and snap if enabled
      let xM = px2m(pos.x / zoomLevel);
      let yM = px2m(pos.y / zoomLevel);
      
      if (snapToGrid) {
        xM = snapM(xM, GRID_SIZE);
        yM = snapM(yM, GRID_SIZE);
      }
      
      // Check bounds
      if (xM + equipment.widthM > plan.roomWidthM || yM + equipment.heightM > plan.roomHeightM) {
        return;
      }
      
      addItem({
        catalogId: equipment.id,
        name: equipment.name,
        xM,
        yM,
        widthM: equipment.widthM,
        heightM: equipment.heightM,
        rotationDeg: 0,
        capacityL: equipment.capacityL,
        color: equipment.color,
      });
    } catch (error) {
      console.error('Drop error:', error);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleItemDragEnd = (itemId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    let xM = px2m(e.target.x() / zoomLevel);
    let yM = px2m(e.target.y() / zoomLevel);
    
    if (snapToGrid) {
      xM = snapM(xM, GRID_SIZE);
      yM = snapM(yM, GRID_SIZE);
    }
    
    const item = plan.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Ensure within bounds
    xM = Math.max(0, Math.min(xM, plan.roomWidthM - item.widthM));
    yM = Math.max(0, Math.min(yM, plan.roomHeightM - item.heightM));
    
    updateItem(itemId, { xM, yM });
  };
  
  const handleTransformEnd = (itemId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    
    const item = plan.items.find(i => i.id === itemId);
    if (!item) return;
    
    let newWidthM = px2m((node.width() * scaleX) / zoomLevel);
    let newHeightM = px2m((node.height() * scaleY) / zoomLevel);
    const rotation = node.rotation();
    
    // Enforce minimum size
    newWidthM = Math.max(0.3, newWidthM);
    newHeightM = Math.max(0.3, newHeightM);
    
    if (snapToGrid) {
      newWidthM = snapM(newWidthM, GRID_SIZE);
      newHeightM = snapM(newHeightM, GRID_SIZE);
    }
    
    // Reset scale
    node.scaleX(1);
    node.scaleY(1);
    
    updateItem(itemId, {
      widthM: newWidthM,
      heightM: newHeightM,
      rotationDeg: rotation,
    });
  };
  
  const gridLines: JSX.Element[] = [];
  const roomWidthPx = m2px(plan.roomWidthM) * zoomLevel;
  const roomHeightPx = m2px(plan.roomHeightM) * zoomLevel;
  
  // Vertical grid lines
  for (let i = 0; i <= plan.roomWidthM / GRID_SIZE; i++) {
    const x = m2px(i * GRID_SIZE) * zoomLevel;
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[x, 0, x, roomHeightPx]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }
  
  // Horizontal grid lines
  for (let i = 0; i <= plan.roomHeightM / GRID_SIZE; i++) {
    const y = m2px(i * GRID_SIZE) * zoomLevel;
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, y, roomWidthPx, y]}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
    );
  }
  
  return (
    <div
      id="canvas-container"
      className="flex-1 bg-muted/30 relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedItemId(null);
          }
        }}
      >
        <Layer>
          {/* Floor background */}
          <Rect
            x={0}
            y={0}
            width={roomWidthPx}
            height={roomHeightPx}
            fill="white"
            stroke="#ccc"
            strokeWidth={2}
          />
          
          {/* Grid */}
          {gridLines}
          
          {/* Items */}
          {plan.items.map((item) => {
            const isSelected = item.id === selectedItemId;
            
            return (
              <Group
                key={item.id}
                id={`item-${item.id}`}
                x={m2px(item.xM) * zoomLevel}
                y={m2px(item.yM) * zoomLevel}
                rotation={item.rotationDeg}
                draggable
                onDragEnd={(e) => handleItemDragEnd(item.id, e)}
                onClick={() => setSelectedItemId(item.id)}
                onDblClick={() => setSelectedItemId(item.id)}
                onTransformEnd={(e) => handleTransformEnd(item.id, e)}
              >
                <Rect
                  width={m2px(item.widthM) * zoomLevel}
                  height={m2px(item.heightM) * zoomLevel}
                  fill={item.color}
                  stroke={isSelected ? "#2563eb" : "#000"}
                  strokeWidth={isSelected ? 3 : 1}
                  cornerRadius={8}
                  opacity={0.9}
                />
                <Text
                  text={item.name}
                  width={m2px(item.widthM) * zoomLevel}
                  height={m2px(item.heightM) * zoomLevel}
                  align="center"
                  verticalAlign="middle"
                  fontSize={14 * zoomLevel}
                  fill="white"
                  fontStyle="bold"
                />
                {item.capacityL && (
                  <Text
                    text={`${item.capacityL}L`}
                    width={m2px(item.widthM) * zoomLevel}
                    height={m2px(item.heightM) * zoomLevel}
                    align="center"
                    verticalAlign="bottom"
                    fontSize={11 * zoomLevel}
                    fill="white"
                    padding={5}
                  />
                )}
              </Group>
            );
          })}
          
          {/* Transformer for selected item */}
          {selectedItemId && (
            <Transformer
              ref={transformerRef}
              rotateEnabled={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                const minSize = m2px(0.3) * zoomLevel;
                if (newBox.width < minSize || newBox.height < minSize) {
                  return oldBox;
                }
                return newBox;
              }}
            />
          )}
        </Layer>
      </Stage>
      
      {plan.items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-foreground text-lg">
            Drag equipment here to start designing
          </p>
        </div>
      )}
    </div>
  );
};
