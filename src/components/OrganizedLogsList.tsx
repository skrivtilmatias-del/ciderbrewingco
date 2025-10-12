import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BatchLogCard, type BatchLog } from "./BatchLogCard";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";
import { Pin, FlaskConical, Eye, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";

interface OrganizedLogsListProps {
  logs: BatchLog[];
  onDeleteLog: (logId: string) => void;
  onUpdateLog?: (log: BatchLog) => void;
}

export const OrganizedLogsList = ({ logs, onDeleteLog, onUpdateLog }: OrganizedLogsListProps) => {
  const getLogType = (log: BatchLog): 'measurement' | 'observation' | 'general' => {
    if (log.og || log.fg || log.ph || log.temp_c || log.ta_gpl) return 'measurement';
    if (log.role === 'Observation') return 'observation';
    return 'general';
  };

  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'measurement': return 'bg-info/10 text-info';
      case 'observation': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
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

  const LogEntryCompact = ({ log }: { log: BatchLog }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (isExpanded) {
      return (
        <BatchLogCard
          log={log}
          onDelete={() => onDeleteLog(log.id)}
          onUpdate={onUpdateLog ? () => onUpdateLog(log) : () => {}}
        />
      );
    }

    return (
      <Card 
        className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-start gap-3">
          <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            {/* Date and Stage Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium">
                {format(new Date(log.created_at), "MM/dd/yyyy, h:mm:ss a")}
              </span>
              <Badge variant="outline" className="text-xs">
                {log.stage}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {log.role}
              </Badge>
            </div>
            
            {/* Title */}
            {log.title && (
              <div className="text-sm font-medium text-foreground">
                {log.title}
              </div>
            )}
            
            {/* Content Preview */}
            {log.content && (
              <div className="text-sm text-muted-foreground line-clamp-2">
                {log.content}
              </div>
            )}
            
            {/* Tags */}
            {log.tags && log.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {log.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Measurements */}
            {(log.og || log.fg || log.ph || log.temp_c) && (
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {log.og && <span>OG: {log.og}</span>}
                {log.fg && <span>FG: {log.fg}</span>}
                {log.ph && <span>pH: {log.ph}</span>}
                {log.temp_c && <span>Temp: {log.temp_c}°C</span>}
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
      <div key={title} className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
        <div className="space-y-2">
          {logs.map((log) => (
            <LogEntryCompact key={log.id} log={log} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderGroup("Today", groupedLogs.today)}
      {renderGroup("Yesterday", groupedLogs.yesterday)}
      {renderGroup("This Week", groupedLogs.thisWeek)}
      {renderGroup("Older", groupedLogs.older)}
    </div>
  );
};
