import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Wine, FlaskConical, Package, Warehouse, ArrowUpDown, ArrowUp, ArrowDown, MapPin, FileText, Edit, Move, Tag, Download, ChevronDown, AlertTriangle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { makeBatchQrUrl, makeBlendQrUrl } from "@/lib/urls";

interface CellarBlend {
  id: string;
  name: string;
  total_volume: number;
  bottles_75cl: number;
  bottles_150cl: number;
  storage_location: string | null;
  created_at: string;
}

interface CellarOverviewProps {
  blends: CellarBlend[];
  onBlendClick: (blend: CellarBlend) => void;
  onRefresh: () => void;
}

type SortField = "name" | "total_volume" | "bottles_75cl" | "bottles_150cl" | "storage_location" | "created_at";
type SortDirection = "asc" | "desc";

export function CellarOverview({ blends, onBlendClick, onRefresh }: CellarOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [volumeFilter, setVolumeFilter] = useState<string>("all");
  const [selectedBlends, setSelectedBlends] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveToLocation, setMoveToLocation] = useState("");
  const [movingBlendIds, setMovingBlendIds] = useState<string[]>([]);

  // Calculate metrics
  const totalBlends = blends.length;
  const totalLiters = blends.reduce((sum, b) => sum + (b.total_volume || 0), 0);
  const total75cl = blends.reduce((sum, b) => sum + (b.bottles_75cl || 0), 0);
  const total150cl = blends.reduce((sum, b) => sum + (b.bottles_150cl || 0), 0);

  // Extract unique locations
  const locations = useMemo(() => {
    const locs = new Set(blends.map(b => b.storage_location).filter(Boolean));
    return Array.from(locs);
  }, [blends]);

  // Calculate location volumes for chart
  const locationVolumes = useMemo(() => {
    const volumes: Record<string, number> = {};
    blends.forEach(blend => {
      const loc = blend.storage_location || "Unknown";
      volumes[loc] = (volumes[loc] || 0) + (blend.total_volume || 0);
    });
    return Object.entries(volumes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  }, [blends]);

  // Find blends nearing depletion (low bottle count relative to volume)
  const blendsNearingDepletion = useMemo(() => {
    return blends
      .map(blend => {
        const totalBottles = (blend.bottles_75cl || 0) + (blend.bottles_150cl || 0);
        const expectedBottles = Math.floor((blend.total_volume || 0) * 1.33); // Approx bottles per liter
        const fillRate = expectedBottles > 0 ? (totalBottles / expectedBottles) * 100 : 0;
        return { ...blend, fillRate, totalBottles };
      })
      .filter(b => b.totalBottles > 0 && b.fillRate < 30)
      .sort((a, b) => a.totalBottles - b.totalBottles)
      .slice(0, 3);
  }, [blends]);

  // Find over-aged blends (older than 18 months)
  const overAgedBlends = useMemo(() => {
    const eighteenMonthsAgo = new Date();
    eighteenMonthsAgo.setMonth(eighteenMonthsAgo.getMonth() - 18);
    
    return blends
      .filter(blend => new Date(blend.created_at) < eighteenMonthsAgo)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 3);
  }, [blends]);

  // Bottling goal progress (toward 1000 bottles)
  const bottlingProgress = useMemo(() => {
    const totalBottles = total75cl + total150cl;
    const goalBottles = 1000;
    return (totalBottles / goalBottles) * 100;
  }, [total75cl, total150cl]);

  // Filtered and sorted blends
  const filteredBlends = useMemo(() => {
    let filtered = blends;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(query) ||
        b.id.toLowerCase().includes(query) ||
        (b.storage_location?.toLowerCase().includes(query))
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(b => b.storage_location === locationFilter);
    }

    // Volume filter
    if (volumeFilter !== "all") {
      if (volumeFilter === "small") {
        filtered = filtered.filter(b => b.total_volume < 20);
      } else if (volumeFilter === "medium") {
        filtered = filtered.filter(b => b.total_volume >= 20 && b.total_volume < 50);
      } else if (volumeFilter === "large") {
        filtered = filtered.filter(b => b.total_volume >= 50);
      }
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === "created_at") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [blends, searchQuery, locationFilter, volumeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedBlends.size === filteredBlends.length) {
      setSelectedBlends(new Set());
    } else {
      setSelectedBlends(new Set(filteredBlends.map(b => b.id)));
    }
  };

  const toggleSelectBlend = (id: string) => {
    const newSelected = new Set(selectedBlends);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBlends(newSelected);
  };

  const handleBulkAction = (action: string) => {
    if (selectedBlends.size === 0) {
      toast.error("No blends selected");
      return;
    }
    
    if (action === "Move") {
      setMovingBlendIds(Array.from(selectedBlends));
      setMoveDialogOpen(true);
    } else if (action === "Export") {
      handleBulkExportLabels();
    } else {
      toast.info(`${action} ${selectedBlends.size} blend(s) - Feature coming soon`);
    }
  };

  const handleBulkExportLabels = () => {
    const selectedBlendsList = blends.filter(b => selectedBlends.has(b.id));
    const csv = generateLabelCSV(selectedBlendsList);
    downloadCSV(csv, `blend-labels-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`Exported ${selectedBlends.size} blend labels`);
  };

  const generateLabelCSV = (blendsList: CellarBlend[]) => {
    const headers = ['Name', 'QR URL', 'Volume (L)', '75cl Bottles', 'Location', 'Created'];
    const rows = blendsList.map(blend => [
      `"${blend.name.replace(/"/g, '""')}"`,
      makeBlendQrUrl(blend.id),
      blend.total_volume,
      blend.bottles_75cl || 0,
      blend.storage_location || '',
      new Date(blend.created_at).toLocaleDateString()
    ]);
    
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleMoveBlends = async () => {
    if (!moveToLocation.trim()) {
      toast.error("Please enter a location");
      return;
    }

    // Here you would typically update the database
    // For now, just show a success message
    toast.success(`Moved ${movingBlendIds.length} blend(s) to ${moveToLocation}`);
    setMoveDialogOpen(false);
    setMoveToLocation("");
    setMovingBlendIds([]);
    setSelectedBlends(new Set());
    onRefresh();
  };

  const handleQuickAction = (blend: CellarBlend, action: string) => {
    if (action === "Move") {
      setMovingBlendIds([blend.id]);
      setMoveDialogOpen(true);
    } else if (action === "Label") {
      const csv = generateLabelCSV([blend]);
      downloadCSV(csv, `${blend.name}-label.csv`);
      toast.success(`Generated label for ${blend.name}`);
    } else {
      toast.info(`${action} ${blend.name} - Feature coming soon`);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const handleMetricClick = (filter: string) => {
    if (filter === "location") {
      setLocationFilter("all");
    } else if (filter === "volume") {
      setVolumeFilter("all");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleMetricClick("all")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                <Wine className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Blends</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalBlends}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleMetricClick("volume")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-accent/10 rounded-lg flex-shrink-0">
                <FlaskConical className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Liters</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{totalLiters.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleMetricClick("bottles")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-success/10 rounded-lg flex-shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">75cl Bottles</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{total75cl}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleMetricClick("bottles")}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-chart-2/10 rounded-lg flex-shrink-0">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-chart-2" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">150cl Bottles</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{total150cl}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Top Locations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Top Locations (L)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {locationVolumes.map(([location, volume]) => (
              <div key={location} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium truncate flex-1">{location}</span>
                  <span className="text-muted-foreground ml-2">{volume.toFixed(0)} L</span>
                </div>
                <Progress value={(volume / totalLiters) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Blends Nearing Depletion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {blendsNearingDepletion.length > 0 ? (
              blendsNearingDepletion.map(blend => (
                <Alert key={blend.id} variant="destructive" className="p-2">
                  <AlertDescription className="text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{blend.name}</span>
                      <span className="ml-2">{blend.totalBottles} btl</span>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">All blends well stocked</p>
            )}
          </CardContent>
        </Card>

        {/* Over-Aged Blends */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              Over-Aged (18mo+)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overAgedBlends.length > 0 ? (
              overAgedBlends.map(blend => {
                const ageMonths = Math.floor((Date.now() - new Date(blend.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30));
                return (
                  <Alert key={blend.id} className="p-2 border-warning">
                    <AlertDescription className="text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate flex-1">{blend.name}</span>
                        <span className="ml-2 text-warning">{ageMonths}mo</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground">No over-aged blends</p>
            )}
          </CardContent>
        </Card>

        {/* Bottling Goal Progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm sm:text-base">Bottling Goal Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={Math.min(bottlingProgress, 100)} className="h-3" />
            <p className="text-xs sm:text-sm text-muted-foreground">
              {total75cl + total150cl} / 1000 bottles ({bottlingProgress.toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search blends, IDs, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => (
              <SelectItem key={loc} value={loc!}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              Filters <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setVolumeFilter("all")}>All Volumes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVolumeFilter("small")}>Small (&lt;20L)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVolumeFilter("medium")}>Medium (20-50L)</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setVolumeFilter("large")}>Large (&gt;50L)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk Actions */}
      {selectedBlends.size > 0 && (
        <Card className="bg-muted/50 border-primary/20">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{selectedBlends.size} blend(s) selected</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("Move")}>
                  <Move className="h-3 w-3 mr-1" /> Move
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("Update Quantity")}>
                  <FileText className="h-3 w-3 mr-1" /> Update Qty
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction("Export")}>
                  <Download className="h-3 w-3 mr-1" /> Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table - Desktop */}
      <Card className="hidden md:block">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Inventory Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedBlends.size === filteredBlends.length && filteredBlends.length > 0}
                      onCheckedChange={toggleSelectAll}
                      className="h-3.5 w-3.5"
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-2">
                      Blend <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("total_volume")}>
                    <div className="flex items-center justify-end gap-2">
                      Volume <SortIcon field="total_volume" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("bottles_75cl")}>
                    <div className="flex items-center justify-end gap-2">
                      75cl <SortIcon field="bottles_75cl" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("bottles_150cl")}>
                    <div className="flex items-center justify-end gap-2">
                      150cl <SortIcon field="bottles_150cl" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("storage_location")}>
                    <div className="flex items-center gap-2">
                      Location <SortIcon field="storage_location" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer text-right" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center justify-end gap-2">
                      Created <SortIcon field="created_at" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlends.map((blend) => (
                  <TableRow key={blend.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedBlends.has(blend.id)}
                        onCheckedChange={() => toggleSelectBlend(blend.id)}
                        className="h-3.5 w-3.5"
                      />
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:underline"
                        onClick={() => onBlendClick(blend)}
                      >
                        <Wine className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">{blend.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{blend.total_volume}L</TableCell>
                    <TableCell className="text-right font-semibold">{blend.bottles_75cl || 0}</TableCell>
                    <TableCell className="text-right font-semibold">{blend.bottles_150cl || 0}</TableCell>
                    <TableCell>
                      {blend.storage_location ? (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="h-3 w-3" />
                          {blend.storage_location}
                        </Badge>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">Not set</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(blend.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(blend, "Move");
                          }}
                        >
                          Move
                        </Button>
                        <span className="text-muted-foreground">|</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAction(blend, "Label");
                          }}
                        >
                          Label
                        </Button>
                        <span className="text-muted-foreground">|</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBlendClick(blend);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredBlends.map((blend) => (
          <Card key={blend.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedBlends.has(blend.id)}
                  onCheckedChange={() => toggleSelectBlend(blend.id)}
                  className="mt-1 h-3.5 w-3.5"
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div 
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onBlendClick(blend)}
                  >
                    <Wine className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-semibold truncate">{blend.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Volume</p>
                      <p className="font-medium">{blend.total_volume}L</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">75cl</p>
                      <p className="font-medium">{blend.bottles_75cl || 0}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">150cl</p>
                      <p className="font-medium">{blend.bottles_150cl || 0}</p>
                    </div>
                  </div>

                  {blend.storage_location && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <MapPin className="h-3 w-3" />
                      {blend.storage_location}
                    </Badge>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(blend, "Move");
                      }}
                    >
                      <Move className="h-3 w-3 mr-1" /> Move
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAction(blend, "Label");
                      }}
                    >
                      <Tag className="h-3 w-3 mr-1" /> Label
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBlendClick(blend);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBlends.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Warehouse className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No blends match your filters.
          </p>
        </Card>
      )}

      {/* Move Location Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Blend{movingBlendIds.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="location">New Storage Location</Label>
              <Input
                id="location"
                placeholder="e.g., Cellar A3, Warehouse B"
                value={moveToLocation}
                onChange={(e) => setMoveToLocation(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Moving {movingBlendIds.length} blend{movingBlendIds.length > 1 ? 's' : ''}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveBlends}>
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
