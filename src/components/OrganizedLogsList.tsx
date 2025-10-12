import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BatchLogCard, type BatchLog } from "./BatchLogCard";
import { isToday, isYesterday, isThisWeek, format } from "date-fns";
import { Pin, FlaskConical, Eye, FileText } from "lucide-react";

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

  const renderGroup = (title: string, logs: BatchLog[]) => {
    if (logs.length === 0) return null;

    return (
      <div key={title} className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
        <div className="space-y-2">
          {logs.map((log) => (
            <BatchLogCard
              key={log.id}
              log={log}
              onDelete={() => onDeleteLog(log.id)}
              onUpdate={onUpdateLog ? () => onUpdateLog(log) : () => {}}
            />
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
