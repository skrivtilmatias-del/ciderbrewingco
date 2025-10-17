import { useState } from 'react';
import { X, Upload, Plus, Calendar, User, Thermometer, Beaker, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import type { StageHistory } from './BatchTimeline';
import { toast } from 'sonner';

interface StageDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: string;
  history?: StageHistory;
  batchId: string;
  onComplete?: () => void;
  onAddNote?: (note: string) => void;
  onUploadPhoto?: (file: File) => void;
  onLogMeasurement?: (measurements: StageHistory['measurements']) => void;
}

export const StageDetailsModal = ({
  open,
  onOpenChange,
  stage,
  history,
  batchId,
  onComplete,
  onAddNote,
  onUploadPhoto,
  onLogMeasurement,
}: StageDetailsModalProps) => {
  const [note, setNote] = useState('');
  const [measurements, setMeasurements] = useState<StageHistory['measurements']>({
    temperature: undefined,
    ph: undefined,
    specific_gravity: undefined,
  });

  const handleAddNote = () => {
    if (!note.trim()) return;
    onAddNote?.(note);
    setNote('');
    toast.success('Note added');
  };

  const handleLogMeasurement = () => {
    if (
      !measurements.temperature &&
      !measurements.ph &&
      !measurements.specific_gravity
    ) {
      toast.error('Please enter at least one measurement');
      return;
    }
    onLogMeasurement?.(measurements);
    setMeasurements({
      temperature: undefined,
      ph: undefined,
      specific_gravity: undefined,
    });
    toast.success('Measurement logged');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto?.(file);
      toast.success('Photo uploaded');
    }
  };

  const isCompleted = !!history?.completed_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {stage}
            {isCompleted && (
              <Badge variant="default" className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {history?.started_at && !isCompleted && (
              <Badge variant="secondary">In Progress</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Manage stage details, notes, photos, and measurements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stage Timeline */}
          {history && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                {history.started_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">
                        {format(new Date(history.started_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
                {history.completed_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-medium">
                        {format(new Date(history.completed_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              {history.duration_days && (
                <p className="text-sm text-muted-foreground">
                  Duration: <span className="font-medium">{history.duration_days} days</span>
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Notes</h3>
            {history?.notes && (
              <div className="p-3 bg-muted rounded-md text-sm">
                {history.notes}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this stage..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} size="sm" disabled={!note.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>

          <Separator />

          {/* Measurements Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Measurements</h3>
            {history?.measurements && (
              <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-md">
                {history.measurements.temperature && (
                  <div>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                    <p className="font-medium">{history.measurements.temperature}°C</p>
                  </div>
                )}
                {history.measurements.ph && (
                  <div>
                    <p className="text-xs text-muted-foreground">pH</p>
                    <p className="font-medium">{history.measurements.ph}</p>
                  </div>
                )}
                {history.measurements.specific_gravity && (
                  <div>
                    <p className="text-xs text-muted-foreground">Specific Gravity</p>
                    <p className="font-medium">{history.measurements.specific_gravity}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="temperature" className="text-xs">
                  Temperature (°C)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="20.0"
                  value={measurements.temperature || ''}
                  onChange={(e) =>
                    setMeasurements({
                      ...measurements,
                      temperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph" className="text-xs">
                  pH
                </Label>
                <Input
                  id="ph"
                  type="number"
                  step="0.01"
                  placeholder="3.5"
                  value={measurements.ph || ''}
                  onChange={(e) =>
                    setMeasurements({
                      ...measurements,
                      ph: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sg" className="text-xs">
                  Specific Gravity
                </Label>
                <Input
                  id="sg"
                  type="number"
                  step="0.001"
                  placeholder="1.050"
                  value={measurements.specific_gravity || ''}
                  onChange={(e) =>
                    setMeasurements({
                      ...measurements,
                      specific_gravity: parseFloat(e.target.value) || undefined,
                    })
                  }
                />
              </div>
            </div>
            <Button onClick={handleLogMeasurement} size="sm" variant="outline">
              <Beaker className="h-4 w-4 mr-2" />
              Log Measurements
            </Button>
          </div>

          <Separator />

          {/* Photos Section */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Photos</h3>
            {history?.photos && history.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {history.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Stage photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md"
                  />
                ))}
              </div>
            )}
            <div>
              <label htmlFor="photo-upload">
                <Button size="sm" variant="outline" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </span>
                </Button>
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isCompleted && (
            <Button onClick={onComplete}>
              <Check className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
