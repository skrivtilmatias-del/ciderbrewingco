import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PrimingCalculator() {
  const [vols, setVols] = useState("2.5");
  const [temp, setTemp] = useState("20");
  const [volumeL, setVolumeL] = useState("20");
  const [sugar, setSugar] = useState("sucrose");

  const residualCO2 = (tC: number) => Math.max(0, 1.7 - 0.043 * tC);
  const yields: Record<string, number> = { sucrose: 1.00, dextrose: 1.04, dme: 1.40 };

  const desired = parseFloat(vols) || 0;
  const tempNum = parseFloat(temp) || 0;
  const volumeNum = parseFloat(volumeL) || 0;
  const existing = residualCO2(tempNum);
  const volsNeeded = Math.max(0, desired - existing);
  const gramsSucrose = volsNeeded * 4.0 * volumeNum;
  const grams = gramsSucrose * (yields[sugar] || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Priming Sugar Calculator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="vols">Target CO₂ (vols)</Label>
          <Input
            id="vols"
            type="number"
            step="0.1"
            placeholder="2.5"
            value={vols}
            onChange={(e) => setVols(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="temp">Cider temp at bottling (°C)</Label>
          <Input
            id="temp"
            type="number"
            step="1"
            placeholder="20"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="volume">Batch volume (L)</Label>
          <Input
            id="volume"
            type="number"
            step="1"
            placeholder="20"
            value={volumeL}
            onChange={(e) => setVolumeL(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sugar">Sugar type</Label>
          <Select value={sugar} onValueChange={setSugar}>
            <SelectTrigger id="sugar">
              <SelectValue placeholder="Select sugar type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sucrose">Table sugar (sucrose)</SelectItem>
              <SelectItem value="dextrose">Corn sugar (dextrose)</SelectItem>
              <SelectItem value="dme">DME (spray malt)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground">
            Existing CO₂: {existing.toFixed(2)} vols
          </div>
          <div className="text-sm">
            Add <span className="font-semibold">{grams.toFixed(0)} g</span> of {sugar} (total batch)
          </div>
          <div className="text-xs text-muted-foreground">
            Formula: grams ≈ (target−existing)×4.0×volumeL×yield
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
