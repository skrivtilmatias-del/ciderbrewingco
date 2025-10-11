import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SO2Calculator() {
  const [pH, setPH] = useState("3.3");
  const [volumeL, setVolumeL] = useState("20");
  const [currentFree, setCurrentFree] = useState("10");
  const [targetMol, setTargetMol] = useState("0.8");

  const pKa = 1.81;
  const pHn = parseFloat(pH) || 0;
  const mol = parseFloat(targetMol) || 0;
  const f = 1 / (1 + Math.pow(10, pHn - pKa));
  const targetFree = mol / f;
  const addNeeded = Math.max(0, targetFree - (parseFloat(currentFree) || 0));
  const gramsKMS = (addNeeded * (parseFloat(volumeL) || 0)) / (0.57 * 1000);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">SO₂ Calculator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ph">pH</Label>
          <Input
            id="ph"
            type="number"
            step="0.1"
            placeholder="3.3"
            value={pH}
            onChange={(e) => setPH(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="volume-so2">Volume (L)</Label>
          <Input
            id="volume-so2"
            type="number"
            step="1"
            placeholder="20"
            value={volumeL}
            onChange={(e) => setVolumeL(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="current-free">Current free SO₂ (mg/L)</Label>
          <Input
            id="current-free"
            type="number"
            step="1"
            placeholder="10"
            value={currentFree}
            onChange={(e) => setCurrentFree(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="target-mol">Molecular SO₂ target (mg/L)</Label>
          <Select value={targetMol} onValueChange={setTargetMol}>
            <SelectTrigger id="target-mol">
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5 mg/L (low)</SelectItem>
              <SelectItem value="0.6">0.6 mg/L</SelectItem>
              <SelectItem value="0.7">0.7 mg/L</SelectItem>
              <SelectItem value="0.8">0.8 mg/L (typical)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="pt-4 border-t space-y-2">
          <div className="text-sm">
            Free SO₂ target: <span className="font-semibold">{isFinite(targetFree) ? targetFree.toFixed(0) : "–"} mg/L</span>
          </div>
          <div className="text-sm">
            Add <span className="font-semibold">{isFinite(gramsKMS) ? gramsKMS.toFixed(2) : "–"} g</span> potassium metabisulfite (KMS)
          </div>
          <div className="text-xs text-muted-foreground">
            Assumes KMS is 57% SO₂. Verify with bench trials & lab checks.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
