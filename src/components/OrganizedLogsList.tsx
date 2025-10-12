import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BatchLogCard, type BatchLog } from "./BatchLogCard";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";
import { FlaskConical, Eye, FileText, Edit, Image } from "lucide-react";
import { useState } from "react";

interface OrganizedLogsListProps {
  logs: BatchLog[];
  onDeleteLog: (logId: string) => void;
  onUpdateLog?: (log: BatchLog) => void;
}

export const OrganizedLogsList = ({ logs, onDeleteLog, onUpdateLog }: OrganizedLogsListProps) => {
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const getLogType = (log: BatchLog): 'measurement' | 'observation' | 'general' => {
    if (log.og || log.fg || log.ph || log.temp_c || log.ta_gpl) return 'measurement';
    if (log.role === 'Observation') return 'observation';
    return 'general';
  };

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'measurement': return FlaskConical;
      case 'observation': return Eye;
      default: return FileText;
    }
  };

  const groupLogsByDate = (logs: BatchLog[]) => {
    const groups: { [key: string]: BatchLog[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    logs.forEach(log => {
      const date = new Date(log.created_at);
      if (isToday(date)) {
        groups.today.push(log);
      } else if (isYesterday(date)) {
        groups.yesterday.push(log);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(log);
      } else {
        groups.older.push(log);
      }
    });

    return groups;
  };

  const groupedLogs = groupLogsByDate(logs);

  const LogEntry = ({ log }: { log: BatchLog }) => {
    const logType = getLogType(log);
    const Icon = getLogTypeIcon(logType);
    const isEditing = editingLogId === log.id;

    if (isEditing) {
      return (
        <BatchLogCard
          log={log}
          onDelete={() => {
            onDeleteLog(log.id);
            setEditingLogId(null);
          }}
          onUpdate={() => {
            if (onUpdateLog) onUpdateLog(log);
            setEditingLogId(null);
          }}
          onClose={() => setEditingLogId(null)}
        />
      );
    }

    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg h-fit ${
            logType === 'measurement' ? 'bg-info/10' :
            logType === 'observation' ? 'bg-warning/10' :
            'bg-muted'
          }`}>
            <Icon className={`h-4 w-4 ${
              logType === 'measurement' ? 'text-info' :
              logType === 'observation' ? 'text-warning' :
              'text-muted-foreground'
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(log.created_at), "MMM d, h:mm a")}
                  </span>
                  <Badge variant="outline" className="text-xs h-5">
                    {log.stage}
                  </Badge>
                  {log.role !== 'General' && (
                    <Badge variant="secondary" className="text-xs h-5">
                      {log.role}
                    </Badge>
                  )}
                </div>
                {log.title && (
                  <h4 className="font-semibold text-sm">{log.title}</h4>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingLogId(log.id)}
                className="h-7 px-2"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>

            {/* Content */}
            {log.content && (
              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                {log.content}
              </p>
            )}

            {/* Measurements Grid */}
            {(log.og || log.fg || log.ph || log.temp_c || log.ta_gpl) && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2 p-2 bg-muted/50 rounded">
                {log.og && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">OG:</span>
                    <span className="ml-1 font-medium">{log.og}</span>
                  </div>
                )}
                {log.fg && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">FG:</span>
                    <span className="ml-1 font-medium">{log.fg}</span>
                  </div>
                )}
                {log.ph && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">pH:</span>
                    <span className="ml-1 font-medium">{log.ph}</span>
                  </div>
                )}
                {log.temp_c && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Temp:</span>
                    <span className="ml-1 font-medium">{log.temp_c}°C</span>
                  </div>
                )}
                {log.ta_gpl && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">TA:</span>
                    <span className="ml-1 font-medium">{log.ta_gpl} g/L</span>
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {log.tags && log.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {log.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Attachments indicator */}
            {log.attachments && log.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Image className="h-3 w-3" />
                <span>{log.attachments.length} image{log.attachments.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderGroup = (title: string, logs: BatchLog[]) => {
    if (logs.length === 0) return null;

    return (
      <div key={title} className="space-y-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">{title}</h4>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-2">
          {logs.map((log) => (
            <LogEntry key={log.id} log={log} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderGroup("Today", groupedLogs.today)}
      {renderGroup("Yesterday", groupedLogs.yesterday)}
      {renderGroup("This Week", groupedLogs.thisWeek)}
      {renderGroup("Older", groupedLogs.older)}
    </div>
  );
};
