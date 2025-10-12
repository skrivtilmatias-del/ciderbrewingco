import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ABVCalculator() {
  const [og, setOg] = useState("");
  const [fg, setFg] = useState("");

  const calculateABV = (og: number, fg: number) => {
    if (!og || !fg) return "";
    const ABV = (og - fg) * 131.25;
    return ABV.toFixed(2);
  };

  const sgToBrix = (sg: number) => {
    if (!sg) return "";
    const b = (182.4601 * sg ** 3) - (775.6821 * sg ** 2) + (1262.7794 * sg) - 669.5622;
    return b.toFixed(1);
  };

  const ogNum = parseFloat(og);
  const fgNum = parseFloat(fg);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ABV Calculator</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="og">OG</Label>
          <Input
            id="og"
            type="number"
            step="0.001"
            placeholder="1.050"
            value={og}
            onChange={(e) => setOg(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="fg">FG</Label>
          <Input
            id="fg"
            type="number"
            step="0.001"
            placeholder="0.998"
            value={fg}
            onChange={(e) => setFg(e.target.value)}
          />
        </div>
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">ABV:</span>
            <span className="font-semibold">{calculateABV(ogNum, fgNum) || "–"}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Brix (from OG):</span>
            <span className="font-semibold">{sgToBrix(ogNum) || "–"}°</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
